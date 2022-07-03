---
title: "Docker Registry with AWS & Let's Encrypt"
tags: Docker, AWS
date: 14/11/2016
---

With pretty much all new projects moving to Docker and Docker managers like Kubernetes, the Docker Registry becomes the first piece of infrastructure that a team needs to setup. Sure there are [public](https://hub.docker.com/) and [private](https://quay.io/) registries available but most project would want to maintain their own setup.

So in this post we will setup a secure private Docker registry with the images backed up on AWS S3 and the free HTTPS certificates provided by [Let's Encrypt](https://letsencrypt.org/). With this configuration we can setup our own secure, private registry at a minimal cost.

In essence running a Docker registry is simply a matter of running a Docker image with the right configuration parameters. Unfortunately, finding the right combination of parameters is difficult. The Registry image is [here](https://hub.docker.com/_/registry/), an exhaustive list of all possible parameters is available here - [https://docs.docker.com/registry/configuration/](https://docs.docker.com/registry/configuration/) and the AWS S3 specific options are here - [https://docs.docker.com/registry/storage-drivers/s3/](https://docs.docker.com/registry/storage-drivers/s3/). As you can imagine this can all get messy quickly so I hope this post will help you to setup your registry in around 15 minutes. Let's get going.

![Docker Registry](/images/docker.png)

The first step would be to setup a new AWS EC2 instance, the type may depend on the amount of traffic you may have to handle but usually t2.small or any medium instance should suffice. I chose AWS Linux as my OS but Ubuntu or RedHat would also be fine. Just make sure you can run a modern version of Docker on the instance and can access S3 by applying the right AWS Role while creating the instance.

With the instance running, next install docker and nginx. Then we need to create a password file, all this could look like -


    $ sudo yum update
    $ sudo yum install docker
    $ sudo service docker start
    $ sudo docker ps
    $ sudo yum install nginx
    $ sudo mkdir -p /etc/nginx/htpass
    $ sudo vim /etc/nginx/htpass/pass


In the pass file above we need to enter a __BCrypted__ user+password pair. We can use a command line tool or use an online service like [this one here](http://aspirine.org/htpasswd_en.html). We just need to add our user entries in the pass file. An entry may look like (for docker/docker@123)-

    docker:$2y$11$MOhVHbeiLRsBR0fk4f4khOL16I5.isDlL3z81gPb.lVnfdw86iVq6

Next, make sure you own a domain and point your domain to the new EC2 instance via your name servers. Also, make sure the DNS name propagation is working. Next up we need to setup Let's Encrypt and get those valuable yet free HTTPS certificates. I recommend the [certbot](https://certbot.eff.org/) option. This could look like -

    $ wget https://dl.eff.org/certbot-auto
    $ chmod a+x certbot-auto
    $ sudo ./certbot-auto --debug
    $ sudo ./certbot-auto certonly --standalone -d registry.foobar.co.com


As you can guess __registry.foobar.co.com__ is my (cheap) domain name so please change the command according to your actual domain name. Certbot will ask a few questions, verify your domain ownership and finally issue you the certificates, please make sure you note the stored certificates' locations.

Well, we are almost there, all we need to do is run the Docker Registry image with the right parameters. So let's create a __config.yml__ file instead of passing 20 parameters as command line arguments to Docker.

    log:
      level: info
      formatter: text
      fields:
        service: registry
        environment: production
    storage:
      s3:
        accesskey: CHANGEME
        secretkey: CHANGEME
        region: eu-central-1
        bucket: foobar-registry #CHANGEME
        chunksize: 5242880
        v4auth: true
        encrypt: false
      delete:
        enabled: false
      redirect:
        disable: false
      cache:
        blobdescriptor: inmemory
      maintenance:
        uploadpurging:
          enabled: true
          age: 168h
          interval: 24h
          dryrun: false
        readonly:
          enabled: false
    auth:
      htpasswd:
        realm: basic-realm
        path: /etc/docker/htpass
    http:
      addr: 0.0.0.0:5000
      secret: foobarbaz #CHANGEME
      relativeurls: false
      tls:
        certificate: /etc/docker/certs/live/registry.foobar.co.com/cert.pem #CHANGEME
        key: /etc/docker/certs/live/registry.foobar.co.com/privkey.pem #CHANGEME

Make sure you have the right AWS access and secret keys, AWS S3 settings and the right path to the certificates. We will mount the certificates from the host as volumes. With the configuration file safely stored, let's run the Container -

    $ sudo docker run -tid -p 5000:5000 --restart=always --name registry
    \ -v /home/ec2-user/config.yml:/etc/docker/registry/config.yml
    \ -v /etc/nginx/htpass/pass:/etc/docker/htpass
    \ -v /etc/letsencrypt:/etc/docker/certs registry:2.5.1


With all settings pointing to the right things we should have our Docker Registry container running. Now let's put a nginx proxy in front of it so that we can have additional security (if we need it) and we don't have to use the 5000 port for connections.

The nginx setup is pretty standard, sample nginx configuration file below -

    # nginx.conf
    user nginx;
    worker_processes 4;
    error_log /var/log/nginx/error.log;
    pid /var/run/nginx.pid;

    # Load dynamic modules. See /usr/share/nginx/README.fedora.
    include /usr/share/nginx/modules/*.conf;

    events {
        worker_connections 1024;
    }

    http {
        log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

        access_log  /var/log/nginx/access.log  main;

        sendfile            on;
        tcp_nopush          on;
        tcp_nodelay         on;
        keepalive_timeout   65;
        client_max_body_size 0;
        types_hash_max_size 2048;

        include             /etc/nginx/mime.types;
        default_type        application/octet-stream;

        include /etc/nginx/conf.d/*.conf;

        index   index.html index.htm;

        server {
            listen       80 default_server;
            listen       [::]:80 default_server;
            server_name  localhost;
            root         /usr/share/nginx/html;
            return 301   https://$host$request_uri;
        }

        server {
            listen       443 ssl;
            listen       [::]:443 ssl;
            server_name  localhost;

            ssl_certificate "/etc/letsencrypt/live/registry.foobar.co.com/cert.pem";
            ssl_certificate_key "/etc/letsencrypt/live/registry.foobar.co.com/privkey.pem";

            chunked_transfer_encoding on;
            add_header Docker-Distribution-API-Version registry/2.0 always;

            # It is *strongly* recommended to generate unique DH parameters
            # Generate them with: openssl dhparam -out /etc/pki/nginx/dhparams.pem 2048
            ssl_dhparam "/etc/pki/nginx/dhparams.pem";
            ssl_session_cache shared:SSL:1m;
            ssl_session_timeout  180m;
            ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
            ssl_ciphers HIGH:SEED:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!RSAPSK:!aDH:!aECDH:!EDH-DSS-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA:!SRP;
            ssl_prefer_server_ciphers on;

            # Load configuration files for the default server block.
            location / {
                proxy_pass                          https://127.0.0.1:5000/;
                proxy_set_header Host               $host;
                proxy_set_header X-Real-IP          $remote_addr;
                proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto  $scheme;
                proxy_read_timeout                  900;
            }
        }
    }


The only main parameter that we need to be careful about is _client_max_body_size_ since the uploaded image sizes can be large (zero is for no check which I use). With nginx running our registry is live!! Test it on your local machine by running -


    $ docker login https://registry.foobar.co.com


If you are lucky the login for one of the users we created in htpass above may work. On Ubuntu/Linux workstations though you may be out of luck. At this point you will realize that Let's Encrypt is not a valid Certificate Authority in your system and you may want to jump out of the window.

But before you take any drastic actions, go to [this page](https://letsencrypt.org/certificates/) and download active root and intermediate certificates in text format and save them as .crt files in __/usr/share/ca-certificates/extra/__. Next run -

    $ sudo dpkg-reconfigure ca-certificates
    $ sudo update-ca-certificates

Make sure the newly downloaded certificates are enabled on your local machine via the commands above and then restart your Docker daemon locally. Logging into the registry should work after that. You can also test the setup by -

    $ curl https://registry.foobar.co.com/v2/ -v

Finally, once login works you can try pushing something to the registry -

    $ docker build -t registry.foobar.co.com/hello-knex-starter:0.0.5 .
    ...
    $ docker push registry.foobar.co.com/hello-knex-starter:0.0.6
    The push refers to a repository [registry.foobar.co.com/hello-knex-starter]
    5a06c9d32de8: Pushed
    4d6c7bc8fd45: Pushed
    b69abf0c970f: Pushed
    720e0e8cdd25: Pushed
    b8c5627db3a0: Pushed
    0766c47c917b: Pushed
    396d0b2e3854: Pushed
    0eb9317dc0bb: Pushed
    4bb0fbbdd887: Pushed
    3c726cce2df9: Pushed
    011b303988d2: Pushed
    0.0.6: digest: sha256:019413d29dc9bc5cecbe224674c5925540a47a82e43038e34e4b62d8041ab103 size: 2623

You can also login into S3 and see the data there.

That's it! Hope this saves you 1-2 days, you can also split the setup on 2-3 machines and run a load balancer for more resilience. Finally make sure you refresh the Let's Encrypt certificates every 90 days since right now the certificates are only valid for that period (you can also automate it via cron).
