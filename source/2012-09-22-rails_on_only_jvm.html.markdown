--- 
title: "Rails on only JVM"
tags: Rails, JRuby, Ruby
date: 22/09/2012
---

Imagine a scenario where an IT operations team is just comfortable with JVM. You also need to deliver a quick five day project and you know that Rails is just the right framework for it. But you do not have the luxury of installing Ruby or even Sqlite on the server.

Don't worry you have JRuby to your resque. You can just ask IT to download the JRuby distribution and set the path to "JRUBY_HOME" and add "$JRUBY_HOME/bin" to the "PATH". Tell them that at the end of the day its just a jar.

Now, we need a DB that just runs on JVM, so we use [http://hsqldb.org/](http://hsqldb.org/). HSQLDB is a fast, ANSI-SQL comliant DB that runs on JVM.

Unzip the downloaded HSQLDB distrib, and start the DB by the following command - 

    java -cp /home/rockyj/Apps/hsqldb-2.2.9/hsqldb/lib/hsqldb.jar org.hsqldb.server.Server --database.0 file:dev --dbname.0 dev

*Change the classpath according to your machine. We have named this DB as "dev".*

Now for our Rails app, we can have the following Gemfile -

    source 'https://rubygems.org'

    gem 'rails', '3.2.8'
    gem 'jquery-rails'
    gem 'anjlab-bootstrap-rails', :require => 'bootstrap-rails'
    gem 'simple_form'

    gem 'activerecord-jdbchsqldb-adapter', :git => "https://github.com/jruby/activerecord-jdbc-adapter"
    gem 'jruby-openssl'
    gem 'puma'

    group :assets do
      gem 'sass-rails',   '~> 3.2.3'
      gem 'coffee-rails', '~> 3.2.1'
      gem 'uglifier', '>= 1.0.3'
      gem 'therubyrhino'
    end

    group :test, :development do
      gem 'rspec-rails', '~> 2.0'
    end

    group :test do
      gem 'cucumber-rails', :require => false
      gem 'database_cleaner'
      gem 'factory_girl_rails'
      gem 'launchy'
      gem 'simplecov'
    end

Main thing to note here is that we are using the master branch for 'activerecord-jdbchsqldb-adapter' as we are using the latest version of HSQLDB server (all AR tests pass for HSQLDB on master with JRuby so we should be safe).

Finally here is our database.yml -

    development:
      adapter: jdbc
      driver: org.hsqldb.jdbcDriver
      url: jdbc:hsqldb:hsql://localhost/dev
      username: SA
      password:

Use a similar setup for test and production DBs and we have a Rails app that needs nothing but a JVM to run. Package your gems inside the Rails app for Production and if need be "warble" the app or just use Puma / Torquebox. Problem solved!