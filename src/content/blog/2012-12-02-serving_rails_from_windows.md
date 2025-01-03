--- 
title: "Serving Rails from Windows"
tags: JRuby, Rails
date: 02/12/2012
---

I was asked to meet quite a "non-standard" requirement lately - the client wanted me to serve a Rails application from a Windows server. The application was not very complicated and has only a handful of users so I agreed to give it a shot. While doing this was relatively simple, I decided to blog about it in case it helps anyone.

I decided to go with JRuby as anything that works on JVM theoretically should run on any OS. So I got hold of a clean Windows machine and installed -

- JDK 1.7
- Postgres-9.1
- Apache Tomcat 7

If you want to run the build on the Windows machine, you would also need -
- JRuby 1.7
- Git 1.8 for Windows

Now if your application is a simple Rails application you don't have to worry too much, any gem written in Ruby would work well on JRuby. Some gems written in C do not work well on JRuby however JRuby has good alternatives for these too, so just check the gems you are using if they have any C extensions (this is rare so I will not go into details). Since we also want to switch to JDBC drivers for JRuby, I added the following to my Gemfile -

    #JRuby specific gems
    platform :jruby do
      gem 'activerecord-jdbcpostgresql-adapter', :git => 'https://github.com/jruby/activerecord-jdbc-adapter'
      gem 'jruby-openssl'
      gem 'jruby-pageant'
      gem 'warbler'
    end

If you are building the application on Windows, you should have Git and JRuby on the server. Open the git bash terminal and run -


    gem install bundler
    git clone <your repo here>
    bundle install

This should run fine. Note the 'jruby-pageant' gem we added to the Gemfile, this was one special gem I installed to get the application working on Windows.

Now run -
    
    bundle exec warble config

This will generate a warble.rb file in you application's config folder. This file has numerous config options, read it to understand more but usually I just change two values -

    # Set JRuby to run in 1.9 mode.
    config.webxml.jruby.compat.version = "1.9"

    # Value of RAILS_ENV for the webapp -- default as shown below
    config.webxml.rails.env = ENV['RAILS_ENV'] || 'production'

This is self explanatory stuff. You can also create a custom environment to deploy to Windows if you want.

Now run -

    bundle exec rake assets:precompile
    bundle exec warble

This will compile your Rails assets and generate a (application-name).war file in your project with all files in the right place. For the non Java folks a .war file is a web archive file that is like a compressed folder that can be copied and deployed to a JEE application server. 

Assuming you have created the DB with the database.yml settings for the production environment, now go to your Tomcat installation directory and within that look for the "webapps" directory.

To keep our lives simple delete the ROOT folder in this directory and copy the .war we created as ROOT.war here. We do this so that the routes we created in our Rails app do not have to deal with an extra context path if we deploy the app with any other name. ROOT folder in webapps maps to the path "http://localhost:8080/" so our application's routes remain intact. Please note that if you do not want to build the application on Windows this is the only step you need to do. 

Run the apache-tomcat/bin/startup script from your favoured terminal and checkout the logs created in apache-tomcat/logs folder. In case you have missed anything the catalina.out logs will tell you the problem.

You can create a proxy for tomcat using Apache HTTP server if you want. Tomcat specific config like the port on which it is running can be found in apache-tomcat/conf/server.xml.

Also the above steps can be put in a script that can be run from cygwin. That is it, this is all you need to serve a Rails application from Windows. To my surprise I found that the response times were also very good.

