---
title: "Get started with Docker"
tags: JavaScript
date: 17/06/2015
---

_This article was published in Healthy Code Magazine, India_

We have all been there, we have just written a cool application and are super excited to ship it out. Then we have a chat with the Ops team, “Redis” they say, “you are using Redis, well, we do not support that”. Ops adds “We can surely add Redis to our infrastructure but give us a few days to add it to our Puppet setup and test it”. You can hear your dreams shattering, your MVP which was built in two weeks will now take one week to be released to production. “Surely, there is a better way”, you think to yourselves.

Docker allows you to solve this problem. By definition - __“Docker is an open-source engine that enables distribution and deployment of any application as a lightweight, portable, self-sufficient container that can run almost anywhere”__.  When building applications it is a huge effort to ensure that they can run in development, staging and production environments smoothly and predictably. Docker solves this problem easily and elegantly with a minimal effort. This is a huge win and also explains Docker’s tremendous popularity since its launch only a couple of years back.

To understand how Docker works, let us look at something called LXC. Wikipedia does a good job of explaining LXC -

LXC (Linux Containers) is an operating-system-level virtualization environment for running multiple isolated Linux systems (containers) on a single Linux control host.

The Linux kernel provides the cgroups functionality that allows limitation and prioritization of resources (CPU, memory, block I/O, network, etc.) without the need for starting any virtual machines, and namespace isolation functionality that allows complete isolation of an application's' view of the operating environment, including process trees, networking, user IDs and mounted file systems.[3]

LXC combines kernel's cgroups and support for isolated namespaces to provide an isolated environment for applications. Docker can also use LXC as one of its execution drivers, enabling image management and providing deployment services.

cgroups (abbreviated from control groups) is a Linux kernel feature that limits, accounts for and isolates the resource usage (CPU, memory, disk I/O, network, etc.) of a collection of processes.

Docker builds upon cgroups and LXC concepts to provide an environment to run any application as a self-contained container on a Linux host. For example, you can have a Rails application running in one container and a Scala Play application running in another container on the same Linux host each completely unaware of the existence of other.

How is this different from a Virtual machine, you might ask. Virtual machines have a fully functional OS with its own memory management installed with the associated overhead of virtual device drivers. Every guest OS runs as an individual entity from the host system. On the other hand Docker containers are executed with the Docker engine rather than the hypervisor. Containers are therefore smaller than Virtual Machines and enable faster start up with better performance, less isolation and greater compatibility all possible due to sharing of the host’s kernel. So while VMs provide greater isolation (and hence more overhead), Docker containers are more lightweight and less resource intensive.


##Docker Commands

Instructions to install Docker can be found at - [https://docs.docker.com/installation/#installation](https://docs.docker.com/installation/#installation)

Since it is fairly easy to install Docker, I will not go into that. Instead, lets test out our Docker setup. ($ indicates the command line)

    $ docker run ubuntu:14.04 /bin/echo 'Hello World!'

If the Docker daemon is running properly, we will get the above command working. You will see some messages about downloading images and then finally our message “Hello World!”. The command above downloads the “ubuntu:14.04” Docker image, starts a container with that image and runs the command - /bin/echo ‘Hello World’.

If you now run -

    $ docker images

you will see a few images that Docker has downloaded on your machine.

To see the containers, run -

    $ docker ps -a

You will most probably see a container id, the image it was based on, and the status message.

So far we have already seen a few concepts -

- Docker images
- the container itself
- the run command
- the ps / images command

Since these are important concepts, lets look at them in a bit more detail -

__Docker Image:__ The Docker image is like a template / blue-print upon which the container is based. When we ran the “run” command earlier, an image called “ubuntu:14.04” was downloaded from Docker’s Repository and a container was instantiated based on that image. The image is based on a Linux distribution, upon which various packages / applications can be installed. You can of-course create your own images and maintain your own repository. Later when we look at “Dockerfiles” we will see how to create our own images.

__Docker Container:__ The Docker container is our main workhorse, it provides process isolation and is a working instance of an image. Docker containers can be run, started, stopped, moved, and deleted. Each container is an isolated and secure application platform.

__The run command:__ The “run” command is probably the most important command we will be working with so let us look at it in along with a few options we can pass it.

To see all the available options for the command, run -

    $ docker run --help

The few important ones (for now) are -

    -i : Keep STDIN open even if not attached
    -t: Allocate a pseudo-TTY
    --name: Assign a name to a container

So if we run -

    $ docker run -it --name container-shell ubuntu:14.04 /bin/bash

We will get a container based on an ubuntu:14:04 image and we will be attached to a bash shell on it.

__The ps / images command:__ The ps command will give an overview of the running containers on a host, with the “-a” option all the container irrespective of the state are listed. Similarly “docker images” lists all the images available on the host.


##Building an application with Docker

Now that we have some basic idea abou Docker, let us build a simple application, dockerize it and run it on containers. Let us say, we have an awesome web application that just says “Hello” to people. We know it is going to be a major hit so we would also like to measure our requests / hits using Redis.

Since we want to keep things really simple we will use Sinatra (http://www.sinatrarb.com/). So the entire application is nothing but three files -

Gemfile (for dependency management)

    source 'https://rubygems.org'

    gem 'sinatra'
    gem 'json'
    gem 'redis'
    gem 'thin'

config.ru (for server config)

    require './app'

    configure do
      set :redis, Redis.new
    end

    run Sinatra::Application

app.rb (application logic)

    require 'sinatra'
    require 'json'
    require 'redis'

    get '/greet/:name', :provides => :json do
      settings.redis.incr("greeter_hits")
      { greeting: "Hello #{params['name']}!" }.to_json
    end

That is it! With redis and ruby installed all we need to run is -

    $ bundle exec thin -R ./config.ru start

We can test the response via the browser or curl -

    $ curl -i http://localhost:3000/greet/World

Now we have our application working, let us Dockerize it. We need at-least two containers -

- 1 thin server container (our main container)
- 1 container for Redis
- 1 optional nginx container to proxy thin (left as an exercise to the reader)

We can do all this in one container but that is not recommended, Docker recommends that we follow the Unix philosophy while building containers - “Do one thing and do it well”.

So lets us first containerize the Sinatra app. As with most web application, we would like to run our server/s as a system service and have the port configurable. Since Sinatra is a Ruby application server, we would need Ruby installed (pretty much that is it the only package required).

Now let us start writing a Dockerfile. A Dockerfile is a plain text file that tells Docker exactly how to construct a Docker image. First, for simplicity we run our app without Redis.

Our Dockerfile could look something like this -

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

    #Setup runit service
    USER root
    RUN mkdir /etc/service/thin
    ADD thin.sh /etc/service/thin/run

    EXPOSE 3000

    # Clean up APT when done.
    RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

Let us quickly go over the Dockerfile -

- Our image will be based upon [http://phusion.github.io/baseimage-docker/](http://phusion.github.io/baseimage-docker/). This base image has a lot of advantages, one of the foremost being having runit ([http://smarden.org/runit/](http://smarden.org/runit/)) installed and setup.
- Runit takes away the pain of setting up system services. It also provides service supervision, this means we can be assured that if the container is running our service is running.
- The Dockerfile is pretty self-explanatory - we copy the code to the Docker container, install necessary software and setup the process monitoring with runit.

Configuring runit is as simple as copying a file in the right place -

    #!/bin/bash

    cd /home/app/hello-sinatra
    exec chpst -u app:app ./bin/thin -R ./config.ru start >>/var/log/thin.log 2>&1

The file above is copied in /etc/service/thin/run. After that runit will ensure that the thin server is running all the time. The code for the application above is available on [https://github.com/rocky-jaiswal/hello-sinatra](https://github.com/rocky-jaiswal/hello-sinatra).
We can then run the following command to build a Docker image based on the Dockerfile -

    $ docker build --rm=true --no-cache=false -t rockyj/hello-sinatra .

With the command above we can see our image being listed -

    $ docker images

Now we can run a container based on the image we built above by running the command -

    $ docker run -tid -p 3000:3000 --name hello-sinatra rockyj/hello-sinatra

In the command above we gave our container a name (hello-sinatra) so that we can easily reference it later and we also gave it an option “-p” which exposes the container’s port on the host (in our case port 3000).

We can also attach a bash session to the container to check what is going on inside or to read the logs by running -

    $ docker exec -it hello-sinatra bash

We can stop the container anytime by running -

    $ docker stop hello-sinatra

And delete it by running -

    $ docker rm hello-sinatra

Well, voila! We have our first container running. We can again test it with curl or the browser.


##Docker Linking and Volumes

So far we ran our application without interacting with Redis (assume that the redis specific lines were commented). We now want the application to interact with a redis container. Two things are sure, we would need to let our two containers interact with one another. The second important concept is that we would like our redis container to persist its data even when the container restarts. For this we will use Docker volumes, more on this later.

First we need to setup a simple redis container. We can do this by, searching the Docker registry and running -

    $ docker run --name my-redis -d redis

That is it. The command above will download the redis image from the Docker repository and run it.

If we change our config.ru file to -

    require './app'

    configure do
      set :redis, Redis.new(host: 'my-redis')
    end

    run Sinatra::Application

we should be back in business. Now let us run both containers simultaneously. Remember to re-build our image and then run the sinatra container. You can check the details of the running containers by running -

    $ docker ps

However, right now the containers are not able to talk to each other. For that we need to link the two containers. This can be easily done by running our web / sinatra container with -

    $ docker run -tid -p 3000:3000 --name hello-sinatra --link my-redis:my-redis rockyj/hello-sinatra

using the ‘--link’ option we have our redis container visible to our web container and the application works as expected.

Finally, we want to persist the data for our redis container between the server restarts. For that we need to configure a “volume”.

Docker volumes are designed to persist data, independent of the container's life cycle. Docker therefore never automatically delete volumes when you remove a container, nor will it "garbage collect" volumes that are no longer referenced by a container.

A Docker volume is a specially-designated directory within one or more containers that bypasses the internal Docker file system. Data volumes provide several useful features for persistent or shared data:

Volumes are initialized when a container is created. If the container's base image contains data at the specified mount point, that data is copied into the new volume.

- Data volumes can be shared and reused among containers.
- Changes to a data volume are made directly.
- Changes to a data volume will not be included when you update an image.
- Data volumes persist even if the container itself is deleted.

For demonstration purpose, we can run the following command -

    $ docker run --name my-redis -d -v /home/rockyj/tmp/redis-data:/data redis

This will enable our redis container to store the redis data (usually in /data in the container) in the host’s /home/rockyj/tmp/redis-data directory. So when we stop or delete the redis container the data is still safe and the container can be restarted anytime without fearing data loss.


##Summary

Well that was a whirlwind tour of Docker. We looked briefly at how -

- Docker works
- How to run simple containers
- Create our own Docker images
- Run our application inside a container
- Link two containers and
- Persist data with volumes

Hope this was useful. Armed with this knowledge, you can start rolling applications as Docker containers. I would also recommend looking at Docker compose (formerly fig) and how to set up a cluster of Docker containers for scaling your application. Happy hacking!


##References

- https://docker.io
- https://docs.docker.com/reference/builder/
- https://docs.docker.com/userguide/usingdocker/#seeing-docker-command-usage
- http://docs.docker.com/userguide/dockervolumes/
- http://blog.scottlowe.org/2014/03/11/a-quick-introduction-to-docker/
- https://linuxcontainers.org/lxc/introduction/
- http://devops.com/blogs/devops-toolbox/docker-vs-vms/
- http://smarden.org/runit
