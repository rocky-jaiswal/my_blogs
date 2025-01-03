---
title: "Hello Kubernetes"
tags: Kubernetes, AWS, DevOps
date: 01/10/2016
---

**Introduction**

Pretty much everyone in the technology world has heard about Kubernetes by now. But before we dive into it, let's try and understand the problems it solves -

Back when I started programming, servers were usually considered out of reach for us developers. We sent an email or filled a form and someone after a week allocated us some CPU, RAM, disk space and an IP. Within the limited rights and the tech stack that the organization supported we were supposed to work by the book on the allocated piece of the hardware. Thankfully with the advent of Virtualization getting a piece of the hardware became easier and the week's delay reduced to hours, then with the DevOps revolution and Cloud based infrastructure us developers were free to manage and run our own infrastructure on demand.

With easy server availability we also saw the rise of provisioning tools like Chef and Puppet because managing all this infrastructure without automation was a nightmare. However provisioning and managing each server along with smooth delivery of all the components of an application was still an uphill task. Finally, with Docker the provisioning problem was also solved, each application could now be delivered as a packaged box which is self-contained, self-sufficient and isolated. Provisioning machines was now simply a task of installing Docker on them.

Even with all this awesomeness, Docker still had a problem of management at scale. For example, if my application needed 3-4 Docker containers, it was hard to make sure that the containers were setp in a fault-tolerant, scalable and distributable manner and it was difficult to manage them on the servers while making sure that if a computing instance / server died I did not lose my application. _Note that this problem only occurs when we have multiple services / containers to manage. With a single application (monolith) maybe we probably don't even need Docker (expect for distribution and process isolation)._ But with everyone writing microservices these days, scalable container management is a core development task and that is where Kubernetes shines.

![Container Management](/images/containers.jpg)

**Kubernetes**

Like [other](/2015/06/20/scale_docker_mesos.html) [container managers / schedulers](https://dcos.io) Kubernetes lets us abstract away from the relationship between the server and the container. For example, with a container manager we just need to know that our container is running, we do not care about which server it is running on. The container manager will also make sure that in case a server dies, the container will be provisioned on another server.

Kubernetes provides all this and more. Managing containers at scale is a breeze with Kubernetes, plus it provides features like configuration and secret management which are really useful for all applications.

Alright enough talk, let's setup Kubernetes (K8) and install something on it.

**Our Application**

To start things off we have a simple [HapiJS](http://hapijs.com/) based API which simply responds with success on a certain route. The application is Dockerized and the code is available on [Github](https://github.com/rocky-jaiswal/hello-hapi). Also since the code is hardly ground breaking I have published my image on Docker [Hub](https://hub.docker.com/r/rockyj/hello-hapi/). So that's that, we have a simple Node application packaged in a container ready to go. We now need to setup Kubernetes to manage our application container.

**AWS VPC**

In my humble opinion Amazon Web Services Virtual Private Cloud is a decent, secure setup to host any application. By deploying the application components between the public and private subnets we can make the application more secure. I usually use a VPC with 2 subnets - Public (e.g. CIDR: 10.0.0.0/24) which hosts nothing but the web & bastion servers (for example) and Private (e.g. CIDR 10.0.1.0/24) which hosts the rest of the application like the application servers and the DB servers.

Setting up a AWS VPC is a well documented process, so I will not go into that. Our setup will start with the assumption that you have a VPC with 2 subnets setup. Only thing to note is we should open all traffic within the subnet, since this rule will be only applied to within the subnet we should be fine (no one can access the private subnet instances from the internet anyways).

**AWS EC2 Instances**

Now we will setup 3 instances one t2.small and one t2.micro. The t2.small will act as the Kubernetes master and will be setup in the Public subnet and the 2 micro instances will be our minions. This horsepower is enough for a simple weekend project like ours.

![AWS Instances overview](/images/aws_vpc_instances.png)

**Kubernetes Setup**

Now that we have our instances and their networking setup it is time to install and setup Kubernetes. For this we will use the recently launched _kubeadm_ tool. Most of the documentation is [here](http://kubernetes.io/docs/getting-started-guides/kubeadm/). I followed it to the letter till step 4, except I did not "taint" my master, so that all the containers run on the minions.

After this simple setup of installing the Kubernetes repositories along with the software and running a few commands to setup the cluster we should be all set to use Kubernetes.

**Back to the Application**

Back to our HapiJS [application](https://hub.docker.com/r/rockyj/hello-hapi/), well we just found a home for it. So we will now set it up on our K8 cluster.

Kubernetes has the concept of Pods, Deployments and Services which are well documented elsewhere so we will simply setup a Kubernetes Service which is ready to serve our application via an internal IP and a port.

The service definition file looks like (hello-hapi-kube.yml) -

    ---
    kind: List
    apiVersion: v1
    items:
    - apiVersion: extensions/v1beta1
    kind: Deployment
    metadata:
    name: hello-hapi
    spec:
    replicas: 3
    template:
      metadata:
        labels:
          app: hello-hapi
          tier: backend
        name: hello-hapi
      spec:
        containers:
        - name: hello-hapi
          image: rockyj/hello-hapi:0.0.1
          env:
          - name: NODE_ENV
            value: production
          ports:
          - containerPort: 3000
    - apiVersion: v1
    kind: Service
    metadata:
    labels:
      name: hello-hapi
      tier: backend
    name: hello-hapi
    spec:
    ports:
    - port: 80
      targetPort: 3000
    selector:
      app: hello-hapi
    type: NodePort

Few things to note about our service definition -

1. We referenced our application Docker image, this is all we need to run our application. The image tag is very important to send out updates.
2. We can pass environment variables to our image to modify it's behavior.
3. We created 3 replicas of our application so that we have some fault tolerance.
4. Finally we exposed our application as a "NodePort". This allows us to expose our entire Service via an internal IP and port. Note that this way our application is not exposed to the internet directly.

So to run our service we will run the following command on the master node -

    kubectl apply -f ./hello-hapi-kube.yml

That should bring up 3 pods and the encompassing service, we can check this via the commands -

    $ kubectl get pods
    NAME                          READY     STATUS    RESTARTS   AGE
    hello-hapi-4099402515-n83av   1/1       Running   0          13s
    hello-hapi-4099402515-pjwpa   1/1       Running   0          13s
    hello-hapi-4099402515-t5kf5   1/1       Running   0          13s

    $ kubectl get services -o wide
    NAME         CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE       SELECTOR
    hello-hapi   100.64.231.240   <nodes>       80/TCP    13s       app=hello-hapi

Now we know the internal IP and port for our service so we can use a proxy to expose it to the internet. For this we can setup nginx or haproxy. Example nginx configuration could be like -

    server {
        listen 80;

        server_name XX.YY.16.202;

        location / {
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Host $http_host;
            proxy_set_header X-NginX-Proxy true;

            proxy_pass http://100.64.231.240/;
            proxy_redirect off;
        }
    }

That's it, now our service is exposed to the internet via the master node's nginx. We can check this from any workstation -

    $ http http://XX.YY.16.202/ping
    HTTP/1.1 200 OK
    Connection: keep-alive
    Content-Type: application/json; charset=utf-8
    Date: Sat, 01 Oct 2016 20:44:48 GMT
    Server: nginx/1.10.0 (Ubuntu)
    Transfer-Encoding: chunked
    cache-control: no-cache
    content-encoding: gzip
    vary: origin,accept-encoding

    {
    "success": true
    }

Scaling up the service is easy, if our API needs more firepower we can scale it up by running the following command on K8 master -

    $ kubectl scale --replicas=4 deployment/hello-hapi

Check it -

    $ kubectl get pods
    NAME                          READY     STATUS              RESTARTS   AGE
    hello-hapi-4099402515-bvkdv   0/1       ContainerCreating   0          7s
    hello-hapi-4099402515-n83av   1/1       Running             0          13s
    hello-hapi-4099402515-pjwpa   1/1       Running             0          13s
    hello-hapi-4099402515-t5kf5   1/1       Running             0          13s

We can also scale down the replicas this way easily. To update the service, when we have made code changes to our HapiJS project, all we need to do is publish the new Docker image and apply it back to the service. It's that simple.

**Downsides**

Our current setup is not perfect, there is only 1 master instance which is also exposed to the internet, even though we can bring a new master up in minutes we do have a single point of failure. Also, we can only administer the cluster via _kubectl_ on the master node. Ideally we want to manage it from our laptop, CI server etc. This is a limitation of the _kubeadm_ tool we used.

**To Do**

We can do some improvements on this setup to use it for serious projects -

1. The whole K8 cluster could be moved into the private subnet, the public subnet would host the web proxy and the SSH bastion only. This would be infinitely more secure and manageable.
2. We should be using a secure private Docker registry, this is an absolute must since most projects cannot publish their application code to a public repository (unless it is an Open Source Project ofcourse).
3. Use some other setup tool to create a multi-master K8 setup.
4. Create a more real-life application scenario. e.g. where we use a RDBMS for example.
5. Show sample CI setup to automate application updates.

**End**

So for now, that's all folks! I hope this was a useful post and will help get you started on K8. I for one cannot imagine working on any other setup now. The container management and scaling capabilities of K8 are unparalleled and what's more it is still a young project with a lot more features coming soon.
