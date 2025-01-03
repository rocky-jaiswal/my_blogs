---
title: "Runit in Docker"
tags: Docker, JRuby, Ruby
date: 05/04/2015
---

While [Docker](http://docker.io) containers can themselves be run as daemons, I really want my applications to run as monitored services inside (or outside) Docker. This gives me the peace of mind that if the container is running, my app would be running and it is being monitored actively by another service.

[Runit](http://smarden.org/runit/) is my preferred supervisor software. We all know there are multiple process managers out there like systemd, upstart, supervisord etc. what I like about runit is that is super simple and has hardly any overhead. In this blog post we will see how we can monitor a simple service inside a Docker container with runit.

For our demo, we will have a very simple Sinatra app with three simple files -

Gemfile

    source 'https://rubygems.org'

    gem 'sinatra'
    gem 'json'
    gem 'thin'

app.rb

    require 'sinatra'
    require 'json'

    get '/greet/:name', :provides => :json do
      { greeting: "Hello #{params['name']}!" }.to_json
    end


config.ru

    require './app'

    run Sinatra::Application

We can now run our app locally as -

    bundle exec thin -R ./config.ru start

The question now is how can we run the thin server as a monitored service with runit inside a Docker container. The answer lies in first choosing the right base image which has [the right setup](http://phusion.github.io/baseimage-docker/). With the right base image which has runit properly setup our own Dockerfile now simply looks like -

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

    # Setup our server with runit
    USER root
    RUN mkdir /etc/service/thin
    ADD thin.sh /etc/service/thin/run

    EXPOSE 3000

    # Clean up APT when done.
    RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

The main file that we need resides in /etc/service/thin/run. The file looks like -

    #!/bin/bash

    cd /home/app/hello-sinatra
    exec chpst -u app:app ./bin/thin -R ./config.ru start >>/var/log/thin.log 2>&1


That is it! The file above when copied inside the Docker container ensures that our server runs as a runit monitored service. Also, note that our Dockerfile has no CMD or ENTRYPOINT because we know if the container is running runit will ensure that our server is up. The cherry on top is that the logs are now easily accessible in '/var/log/thin.log'.
