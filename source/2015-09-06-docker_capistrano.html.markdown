---
title: "Docker + Capistrano = Warp Speed"
tags: Docker, Ruby, DevOps
date: 06/09/2015
---

Needless to say that Docker is pretty awesome. This blog itself is now powered by Docker + Capistrano and I can deploy a new post simply by doing __bundle exec cap deploy__. What's more with Docker, I can move to any hosting provider and setup everything in 10 minutes. Also, gone are the days when I had to fiddle to Chef/Puppet scripts to try and setup servers only to find a new Ruby/JDK/Node.js version is out so I need to modify those scripts again. With Docker all you need to install on a new server is probably -

- Git and
- Docker

And maybe setup a user with whom you will deploy the application.

If your mind is not blown already, allow me to demonstrate with an application. Let's say we have a web application, maybe it is a Rails application, all we need is a Dockerfile (for example) -

    # Dockerfile

    FROM phusion/passenger-ruby22:0.9.17
    MAINTAINER Rocky Jaiswal "rocky.jaiswal@gmail.com"

    # Set correct environment variables.
    ENV HOME /root

    # Use baseimage-docker's init system.
    CMD ["/sbin/my_init"]

    # Expose Nginx HTTP service
    EXPOSE 80

    # Start Nginx / Passenger
    RUN rm -f /etc/service/nginx/down

    # Remove the default site
    RUN rm /etc/nginx/sites-enabled/default

    #Enable env vars
    ADD ./app-env.conf /etc/nginx/main.d/app-env.conf

    # Add the nginx site and config
    ADD ./webapp.conf /etc/nginx/sites-enabled/lehrer_webapp.conf

    # Add the Rails app
    RUN mkdir /home/app/lehrer
    WORKDIR /home/app/lehrer
    ADD . /home/app/lehrer
    RUN bundle install --binstubs --deployment --without test development
    RUN bundle exec rake assets:precompile

    RUN chown -R app:app /home/app

    # Clean up APT and bundler when done.
    RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

And a capistrano deploy script -

    #production.rb

    server 'AA.BB.CC.DD', user: 'app', roles: %w{docker}

    namespace :custom do
      task :setup_container do
        on roles(:docker) do |host|
            image_name = "lehrer" #we use this for container name also
            puts "================Starting Docker setup===================="
            execute "cp /home/app/database.yml #{deploy_to}/current/config/database.yml"
            execute "cp /home/app/secrets.yml #{deploy_to}/current/config/secrets.yml"
            execute "cd #{deploy_to}/current && docker build --rm=true --no-cache=false -t rockyj/#{image_name} ."
            execute "docker stop #{image_name}; echo 0"
            execute "docker rm -fv #{image_name}; echo 0"
            execute 'docker run -tid -p 80:80 -e "PASSENGER_APP_ENV=production" -e "RAILS_ENV=production" --name lehrer rockyj/lehrer'
            execute "docker exec -it lehrer bundle exec rake db:migrate"
        end
      end
    end

    after "deploy:finishing", "custom:setup_container"

For the Dockerfile, the base image (phusion-passenger-docker) does a lot of groundwork for us so all we need to is setup the code and some configuration. You can test the image build and container locally to your heart's content before deploying. __The capistrano script in the end Git clones our code, builds the docker image for our code and runs a container based on the image. All with one command -__

    bundle exec cap production deploy

Once your deployment finishes, you have a working application and all you installed on your server was Docker and Git. That is pretty awesome IMHO! Code for this sample application is available on [Github](https://github.com/rocky-jaiswal/lehrer).

##Database Setup

Some of you might say, I pulled a fast one and did not talk about the database. I think there are two options for that -

- Run the database itself as a container. In this case you need to install docker-compose for the two containers to talk to each other.
- Run the database on the host / separate machine on the network. I like this option personally since unlike the application code, the database is a pretty static and stable piece of software. In this case you need to install PostgreSQL as usual and configure it so that it allows access from the Docker container. This is pretty standard for any application.

__Database on the Docker host__

Simple applications / test setup usually has the application server and the database server running on the same machine. To enable a Docker container to connect to the PostgreSQL instance on the Docker host you will need to change two files.

- sudo vim /etc/postgresql/9.3/main/postgresql.conf
  Add the line - __listen_addresses = 'localhost, 172.17.42.1'__
- sudo vim /etc/postgresql/9.3/main/pg_hba.conf
  Add the line - __host    all             all             172.17.0.0/24          md5__

Then restart PostgreSQL. These two changes allow connections to PostgreSQL from the Docker container. Basically we allow the Docker's internal network's bridge and IP to connect to PostgreSQL. If your container's bridge and IP differ, please update the two files. You can find these two by running __ifconfig__ inside the container and on the host machine.


