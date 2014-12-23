---
title: "Dockerize Everything"
tags: Docker
date: 23/12/2014
---

One of the most frustrating things to do is to setup software for new projects. Even within the simple Rails ecosystem, one may need to install PostgreSQL, MySQL, MondoDB, Redis, Memcache, ElasticSearch etc. to get a project running. For complicated projects, Vagrant provides some help such that all software is bundled in a VM and one could just do _vargant up_ and get up and running.

However, with [Docker](http://docker.io) this can be made even easier. In this post, I will walk through what it may take to setup something with Docker. I recently wanted to work on an open-source Rails project that works with MySQL, now I am more of a Postgres guy and do not even have MySQL installed (and I do not want to install it). So lets use Docker to solve our problem.

First we need to find a Docker image that can help us, I found [paintedfox/mariadb](https://registry.hub.docker.com/u/paintedfox/mariadb/) to be quite popular and configurable. So the first thing I need to do is to pull the image -

	sudo docker pull paintedfox/mariadb

You may/may not need to sudo that depending on your docker setup. With the image in place, we need to see what we need for a Rails project, a common database.yml file look like -

	development:
	  adapter: mysql2
	  database: project_dev
	  host: 127.0.0.1
	  port: 3306
	  username: super
	  password: super
	  encoding: utf8

So we need a hostname, port, database user, password and a databases setup (similar setup is needed for the test DB).

With the image we are using we can setup the user and password via environment variables and we can publish the containers port to our host. So our command to run the container would be -
	
	sudo docker run -e USER=super -e PASS=super -p 3306:3306 --name=mymariadb paintedfox/mariadb

With the container running, we will have a MySQL / MariaDB instance available to us on __127.0.0.1:3306__ via the magic of port publishing. So we can just run -

	bundle exec rake db:create

and setup our database/s.

However with this setup, when the container shuts down we will lose our data, while this ok for test / build server environments it is not so nice for development. What we need is to persist the data between the container restart cycles.

By reading some documentation on our container image, we know where the MySQL data is stored. We can then mount a host directory as a volume, so that the data is stored on the host and is not lost. So our command to run the container becomes -

	sudo docker run -e USER=super -e PASS=super -p 3306:3306 -v /opt/docker/mysql:/data --name=mymariadb paintedfox/mariadb

This will ensure that the MySQL data will not be lost when container restarts. Now if you are using SELinux the mounted volumes may not work properly, because of permission issues. To resolve this, add a SELinux rule -

	sudo chcon -Rt svirt_sandbox_file_t /opt/docker/mysql

This will make the container work as desired.

Finally to stop the container, run -

	sudo docker stop mymariadb

And to re-run it again, run -

	sudo docker start -ia mymariadb

That's it! You can do the same dance with any other software just - 

1. Find the right image.
2. Setup the software config with environment variables.
3. Publish the port.
4. Mount a volume 

and you have a clean, portable setup while also not losing any data. Also imagine how easy this makes to setup buildservers which were always the nastiest machines to setup, well not anymore with Docker.
