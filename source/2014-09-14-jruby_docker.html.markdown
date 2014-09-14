---
title: "Build great JRuby apps with Docker"
tags: Docker, JRuby
date: 14/09/2014
---

[Docker](http://docker.io) is an exciting piece of technology. You can build a ready to use Linux containers by just just writing all your dependencies / packages declared in an easy to read text file.

Since a lot of sites have Docker introduction covered we will start right off with a Dockerfile to setup a JRuby + Rails app. You can put this file in your Rails project so that it is version managed like the rest of the code.

    FROM phusion/baseimage:0.9.13

    # Set correct environment variables.
    ENV HOME /root

    # Use baseimage-docker's init system.
    CMD ["/sbin/my_init"]

    #Install Oracle JDK 8 and Node.js
    RUN sudo add-apt-repository ppa:webupd8team/java
    RUN sudo add-apt-repository ppa:chris-lea/node.js && sudo apt-get update
    #This absurdity exists so that JDK is installed without prompting for license
    RUN echo oracle-java8-installer shared/accepted-oracle-license-v1-1 select true | sudo /usr/bin/debconf-set-selections

    RUN sudo apt-get install -y --no-install-recommends oracle-java8-installer
    RUN sudo apt-get install oracle-java8-set-default
    RUN sudo apt-get install -y nodejs
    RUN sudo apt-get autoremove -y && apt-get clean

    ENV JRUBY_VERSION 1.7.15
    #Get JRuby
    RUN curl http://jruby.org.s3.amazonaws.com/downloads/$JRUBY_VERSION/jruby-bin-$JRUBY_VERSION.tar.gz | tar xz -C /opt

    ENV PATH /opt/jruby-$JRUBY_VERSION/bin:$PATH

    RUN echo gem: --no-document >> /etc/gemrc

    RUN gem update --system
    RUN gem install bundler

    #Add user
    RUN addgroup --gid 9999 app
    RUN adduser --uid 9999 --gid 9999 --disabled-password --gecos "Application" app
    RUN usermod -L app
    RUN mkdir -p /home/app/my_app
    ADD . /home/app/my_app
    RUN chown -R app:app /home/app/

    USER app

    #JRuby options
    ENV PATH /opt/jruby-$JRUBY_VERSION/bin:$PATH
    RUN echo compat.version=2.0 > /home/app/.jrubyrc
    RUN echo invokedynamic.all=true >> /home/app/.jrubyrc

    #Get Rails running
    WORKDIR /home/app/my_app
    ENV RAILS_ENV staging
    RUN bundle exec rake db:reset
    RUN bundle install --deployment --without test development
    ##################################################################
    #Remove these lines when using fig since fog will start the server
    ##################################################################
    RUN bundle exec rake db:reset
    EXPOSE 3000
    ENTRYPOINT bundle exec rails server

The file is pretty self explanatory. To get the craziness that is called Oracle Java 8 working, you also need an additional Rails initializer in your project with the following code which I plucked from StackOverflow -

    require 'java'
    java_import 'java.lang.ClassNotFoundException'

    begin
      security_class = java.lang.Class.for_name('javax.crypto.JceSecurity')
      restricted_field = security_class.get_declared_field('isRestricted')
      restricted_field.accessible = true
      restricted_field.set nil, false
    rescue ClassNotFoundException => e
      # Handle Mac Java, etc not having this configuration setting
      $stderr.print "Java told me: #{e}n"
    end

To get a Docker image from this file run -

    sudo docker build --rm=true --no-cache=false -t rockyj/app_name .

Now you have a Docker image that you can run as a container -

    sudo docker run -tid -p 3000:3000 --name app_name --link db:db rockyj/app_name

This will get you a running Rails app as long as you use a DB like sqlite. To run this on PostgreSQL we need another container running Postgres and we need to link the app and db containers together.

To do this we will use [Fig](http://www.fig.sh/) which makes our lives super easy. First let us write a Dockerfile for our Postgres image -

    FROM phusion/baseimage:0.9.13

    # Set correct environment variables.
    ENV HOME /root

    # Use baseimage-docker's init system.
    CMD ["/sbin/my_init"]

    ENV DEBIAN_FRONTEND noninteractive

    RUN apt-get update -qq

    RUN apt-get install wget -qq

    RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ trusty-pgdg main 9.3" > /etc/apt/sources.list.d/pgdg.list

    RUN gpg --keyserver keys.gnupg.net --recv-keys ACCC4CF8

    RUN gpg --export --armor ACCC4CF8|apt-key add -

    RUN apt-get update

    # If you use another language, change the package. e.g. language-pack-es
    # and run update-locale with language variable.
    RUN apt-get install language-pack-en -y

    RUN update-locale LANG=en_US.UTF-8 LC_MESSAGES=POSIX

    RUN apt-get install postgresql-9.3 postgresql-client-9.3 postgresql-contrib-9.3 -y

    RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/


    USER postgres

    RUN  /etc/init.d/postgresql start &&\
        psql --command "ALTER USER postgres with password 'foobar';"

    RUN echo "host all  all    0.0.0.0/0  md5" >> /etc/postgresql/9.3/main/pg_hba.conf

    RUN echo "listen_addresses='*'" >> /etc/postgresql/9.3/main/postgresql.conf

    EXPOSE 5432

    VOLUME  ["/etc/postgresql", "/var/log/postgresql", "/var/lib/postgresql"]

    CMD ["/usr/lib/postgresql/9.3/bin/postgres", "-D", "/var/lib/postgresql/9.3/main", "-c", "config_file=/etc/postgresql/9.3/main/postgresql.conf"]

Build the Docker image for this as well -

    sudo docker build --rm=true --no-cache=false -t rockyj/postgres .

Now with fig, let us link the two containers, in RAILS_PROJECT/fig.yml -

    db:
      image: rockyj/postgres
      ports:
        - "5432"
    web:
      image: rockyj/app_name
      command: bundle exec rails s
      ports:
        - "3000:3000"
      links:
        - db

With fig installed, now all you need to run is -

    sudo fig build
    sudo fig up
    #in another terminal window
    sudo fig run web bundle exec rake db:create
    sudo fig run web bundle exec rake db:migrate
    #when you want to stop
    sudo fig stop

That is it! You now have two containers, running Rails and PostgreSQL talking to each other. The Rails container runs on JDK8 and the latest JRuby (with invoked-dynamics on). Finally, as some homework you can persist the data of the Postgres container so that it survives restarts (using Docker volumes). Enjoy super easy JRuby+Rails deployments with Docker.