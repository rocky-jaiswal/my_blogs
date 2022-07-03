---
title: "Scale up with Docker and Mesos"
tags: Docker, JRuby, Ruby, Mesos
date: 20/06/2015
---

I find [Docker](http://docker.io) to be quite an exciting piece of technology. Packaging an application as an container and shipping it off is usually an easy and pleasant experience. Application containers help avoid provisioning and configuring pains and can be run on any server with a recent Linux kernel.

While containers solve the problem of provisioning and setup of servers they do not address scalability on their own. What we need is the ability to spin new containers quickly and efficiently and also the ability to add hardware to the cluster with relative ease and then be able to spin containers on it quickly. The latter task is not easy really, as you move beyond a dozen machines in a cluster it is difficult to track what is going on (naming the hosts itself becomes a problem :D). One often wonders how the big technology companies manage clusters of thousands of machines.

Well, with [Mesos](http://mesos.apache.org/), us simple folk can also maintain a cluster of a thousand machine with relative ease. The trick is to not to treat the thousand machines as a thousand machines but as a single one. Mesos abstracts away from the idea of machines but treats them as a pool of resources. When you want a task to run, configured resources are allocated to it from the pool. If you want to scale up, simply add more resources from the available pool and you are done. Without going into too much details about Mesos, consider it as a distributed resources manager with a master node which does the task allocation and several slave nodes which do the work allocated by master.

To explain things we will build a demo -

1. Setup Mesos (standalone) on our laptop (8 core CPU, 8GB RAM preferred).
2. Build our application as a Docker container.
3. Run our application container on the Mesos setup.
4. Scale up our container instances to manage load.

###Setup Mesos

The first part is easy, all you need is Vagrant installed and follow the instructions here - [https://github.com/mesosphere/playa-mesos](https://github.com/mesosphere/playa-mesos). Give the VM as many resources as you can, once you do __vagrant up__, you can check the Mesos server cluster on http://10.141.141.10:5050. You can see here that there is a slave node with certain resources available.

![Mesos](images/mesos_1.png)

To have long running tasks on Mesos (like application servers) we need a framework on top of Mesos called [Marathon](https://github.com/mesosphere/marathon). _[Mesosphere](https://mesosphere.com/) is an organization which specializes in Mesos and have products built on top of it, Marathon is one such add-on (btw I do really like the work Mesosphere is doing)._ With our VM we already have Marathon setup and running and we can view the UI at - http://10.141.141.10:8080


###Containerize Application

Next we want to have our application setup as a container. For this we will use a [an app](https://github.com/rocky-jaiswal/hello-sinatra) [we built earlier](http://rockyj.in/2015/06/17/docker_introduction.html). It is basically a simple Sintra API that says Hello {input}! given an {input}.

The Dockerfile for this application looks like -

    FROM phusion/passenger-ruby22:0.9.15

    # Set correct environment variables.
    ENV HOME /root

    # Use baseimage-docker's init process.
    CMD ["/sbin/my_init"]

    # Copy code
    ADD . /home/app/hello-sinatra
    RUN chown -R app:app /home/app/
    RUN gem install bundler

    # Setup app
    USER app
    WORKDIR /home/app/hello-sinatra
    RUN bundle install --binstubs --deployment --without test development

    USER root
    RUN mkdir /etc/service/thin
    ADD thin.sh /etc/service/thin/run

    EXPOSE 3000

    # Clean up APT when done.
    RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

You can build and run the container by simply running (locally) -

    $ docker build --rm=true --no-cache=false -t rockyj/hello-sinatra .

Now we can run a container based on the image we built above by running the command -

    $ docker run -tid -p 3000:3000 --name hello-sinatra rockyj/hello-sinatra

If everything works locally we are ready to run our container on top of Mesos. For that we need to first publish our image somewhere where the Mesos setup can pull from. Since this is a demo we can publish the image to [Docker Hub](https://registry.hub.docker.com/) (_if you can you should setup a private Docker image repository_). Do this by creating a repository on Docker Hub and running -

    $ docker push rockyj/hello-sinatra

You will be prompted to enter your Docker Hub credentials and after a while your container image will be published.

###Running and scaling the container on Mesos

With the Mesos VM running, we need to POST an application on the Marathon API. This is as simple as posting to - http://10.141.141.10:8080/v2/apps, with the JSON -

    {
      "id": "hello-sinatra",
      "cpus": 2,
      "mem": 1024.0,
      "instances": 1,
      "container": {
        "type": "DOCKER",
        "docker": {
          "image": "rockyj/hello-sinatra",
          "network": "BRIDGE",
          "portMappings": [
            { "containerPort": 3000, "hostPort": 0, "servicePort": 9000, "protocol": "tcp" }
          ]
        }
      }
    }

After a while you can see that the application is running by looking at the Marathon UI - http://10.141.141.10:8080

You can now also run __vagrant ssh__ to log into the Vagrant machine and then run -

    $ sudo docker ps

to see your container based on __rockyj/hello-sinatra__ image running.

The __sudo docker ps__ command will also tell you how the ports are mapped and you can most probably access you Sinatra application's API by pinging __http://10.141.141.10:31000/greet/world__.

Now, If you look at the Mesos UI (http://10.141.141.10:5050) you can see if you have any spare resources, if you do, you can scale your application by simply clicking on the application name on the Marathon UI then clicking on 'scale' and then finally adding one more instance to the application.

![Mesos](images/mesos_2.png)

This will ensure that there are two containers running on the Mesos setup and you can verify it by running __sudo docker ps__ on the VM. As you may see the second container is mapped to a different port.

Finally, a few questions remain -

1. The Mesos master is a single point of failure - In a production setup, you can have multiple masters (3, 5, 7 or more) on stand-by with the working leader elected via [Zookeeper](https://zookeeper.apache.org/).
2. How do I add more resources to the setup? - Simply add a machine and configure it as a slave in the setup.
3. The containers are mapped to different ports, how can I access them without knowing the ports - This is what we call Service Discovery. First add HAPROXY to the slaves and we can periodically ask Marathon for the services running and configure our HAPROXY so that it proxies all the running container's ports. See more [here](https://open.mesosphere.com/getting-started/service-discovery/).
