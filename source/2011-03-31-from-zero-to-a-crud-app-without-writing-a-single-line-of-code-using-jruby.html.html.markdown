---
title: From Zero to a CRUD App (without writing a single line of code) using JRuby
tags: JRuby
date: 31/03/2011
---

This blog introduces you to JRuby and Rails. We will create a simple web application with CRUD features and deploy it on Tomcat.

Required Software -
-JDK 6
-Tomcat 6
-MySql
-JRuby

The blog assumes that you have JDK, MySql and Tomcat set up. Download JRuby from the link above and add the {JRUBY_DIR}/bin to your classpath.

Let's run the first command (from any directory) -

    jruby -S gem install mongrel activerecord-jdbcmysql-adapter rails

If the command above complains of lack of jruby-openssl then abort it (using Ctrl+C) and first run "jruby -S gem install jruby-openssl".

This will install mongrel server, activerecord-jdbcmysql-adapter and rails. "gem install" is the Ruby way to install libraries, in Java you download jars and add them to your classpath. Similarly in Ruby you do a "gem install" which does everything for you.

Now run the following command -

    jruby -S rails XLib -d mysql

Here we are using JRuby to tell Rails (a Ruby web application framework) to create a application XLib which uses MySql as the database.

Enter the newly-created "XLib" directory, then modify the config/database.yml. First and foremost, you need to adjust the adapter name, and instead of 'mysql' you should specify 'jdbcmysql'. You might also want to delete the lines starting with 'socket:'. Your development environment config can look like -

    development:
    adapter: jdbcmysql
    encoding: utf8
    reconnect: false
    database: XLib_dev
    pool: 5
    username: root
    password: root


Now let's create our schema (make sure you are in your XLib directory) -

    jruby -S rake db:create:all

The command above runs a rake (like make but for Ruby) task that creates the necessary schema in MySql.

* Please note, there is currently a bug in activerecord-jdbcmysql-adapter due to which first time schema creation may not work. You can create the schema manually (just name it XLib_dev as in config above), this is a one time task so it doesn't hurt too much.

Now lets run  -

    jruby script/generate scaffold book title:string authors:string genre:string quantity:int added_on:date

Scaffolding is one of the main USPs of Rails, it generates the necessary CRUD  for a domain object, in our case a "book".

Now we need to update our database -

    jruby -S rake db:migrate

We're all done, let's start the mongrel server -

    jruby script/server

check out the application at -

__http://localhost:3000/books__

You can add, edit, delete and see a listing of all the books.

We used JRuby (which is the Java implementation of Ruby) so that our application can run on JVM. Since it can run on JVM it can also run on Tomcat. To run it on Tomcat we first need to convert it to a war file. You guessed it, there is a gem for that - 

    jruby -S gem install warbler

Next, run the following (inside XLib directory) -

    warble config

This will generate a config file for warble as warble.rb in your app's config directory

Open this config file and add the following line at the end -

    config.gems += ["activerecord-jdbcmysql-adapter", "jruby-openssl"]

This enables the gems above to be bundled in your war, otherwise Tomcat complains of missing libraries.

Now, run the command -

    warble

This will create XLib.war in you XLib directory, copy this file to your $TOMCAT_HOME/webapps and start Tomcat. This will unzip the war, shutdown Tomcat after a while, check XLibs' web.xml and make sure the environment points to development. Restart Tomcat.

Go to __http://localhost:8080/XLib/books__

And that's it, you have a CRUD application running on Tomcat without even writing a single line of code.
