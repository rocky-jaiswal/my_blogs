--- 
title: "Running Rails on Ruby or JRuby - A Performance Comparison"
tags: Java, JRuby, Ruby
date: 09/09/2012
---

I have been a JRuby fanboy for a while now, in the last few weeks I also saw some really interesting RailsCasts on multi-threading Rails applications and JRuby which piqued me to do some ad-hoc experimentation. I recommend everyone to watch these three episodes -

- [http://railscasts.com/episodes/365-thread-safety](http://railscasts.com/episodes/365-thread-safety)

- [http://railscasts.com/episodes/376-jruby-basics](http://railscasts.com/episodes/376-jruby-basics)

- [http://railscasts.com/episodes/377-trinidad](http://railscasts.com/episodes/377-trinidad)

Now, I am a sucker for performance. I love making performance improvements on applications. So I thought let me run some tests on a simple Rails application on my personal laptop (i7, 8 GB RAM, SSD) and see how well the Ruby implementations and their commonly used servers fare. I will use MRI 1.9.3, JRuby 1.7.0.preview2 and the latest app servers for this experiment.

These tests need to be taken with a pinch of salt as I am no authority in perfomance testing but still the results are quite interesting.

First, we need to setup a Rails app which can be used with both Ruby and JRuby. My Gemfile looks like - 

    source 'https://rubygems.org'

    gem 'rails', '3.2.8'
    gem 'warbler'

    platform :jruby do
      gem 'activerecord-jdbcpostgresql-adapter'
      gem 'jruby-openssl'
      gem 'puma'
      gem 'trinidad'
      gem 'therubyrhino', group: :assets
    end

    platform :ruby do
      gem 'pg'
      gem 'unicorn'
    end

    # Gems used only for assets and not required
    # in production environments by default.
    group :assets do
      gem 'sass-rails',   '~> 3.2.3'
      gem 'coffee-rails', '~> 3.2.1'
      gem 'uglifier', '>= 1.0.3'
    end

    gem 'jquery-rails'

Nothing out of the ordinary here, only thing is that the gems will be loaded according to the Ruby implementation.

I also scaffolded a generic User model and added a few records to my database. Pointed the 'root' of my application to the /users/index page so that the DB is hit everytime someone opens the homepage of the application. I will also use "ab" (apache benchmark) as my testing tool, I also tried this with JMeter and there was not much difference. My command is -

    ab -n 100 -c 10 http://localhost:8080/

This means my app's homepage will be hit by 100 requests with 10 concurrent requests at a time, decent enough for performance testing a small app.

Now lets start the experiment. We will run the experiment on the server in 2 modes, one by not allowing concurrency and the other by allowing concurrency. See tenderlove's awesome post to understand this more - [http://tenderlovemaking.com/2012/06/18/removing-config-threadsafe.html](http://tenderlovemaking.com/2012/06/18/removing-config-threadsafe.html). This is done by commenting / uncommenting this line in production.rb -

    config.threadsafe!

We will also run the "ab" command above a few times so that cache etc is warmed. The results you see below are always for the 5th or 6th run.

Also, we will precompile our assets and serve them from the app server only. We will run the tests in production mode. I have also increased the DB pool size to 15 so that no bottleneck is created there.

Finally, we kick off our experiment with MRI 1.9.3, Unicorn, 3 workers enabled and concurrency off. Let's see the results - 

    RAILS_ENV=production bundle exec unicorn -c config/unicorn.rb

    Requests per second:    549.31 [#/sec] (mean)
    Time per request:       18.205 [ms] (mean)

Now lets us allow concurrency (uncomment the "config.threadsafe!" line) and re-run the tests -

    Requests per second:    525.78 [#/sec] (mean)
    Time per request:       19.019 [ms] (mean)

Not much of a difference. This is because MRI uses a GIL and there is no thread level concurrency in MRI. Also reducing the no of workers reduces the performance drastically, if I use 1 worker -

    Requests per second:    109.46 [#/sec] (mean)
    Time per request:       91.360 [ms] (mean)

Let's switch over to JRuby now and use [puma](http://puma.io) as the server, with these JVM options -

    export JRUBY_OPTS="-J-XX:ReservedCodeCacheSize=100m -J-Xmn512m -J-Xms2048m -J-Xmx2048m -J-server"

Server can be started by -

    RAILS_ENV=production jruby -S bundle exec puma -p 8080

Results with concurrency off - 

    Requests per second:    72.37 [#/sec] (mean)
    Time per request:       138.184 [ms] (mean)

As you can see this is much much slower than Unicorn.

Lets enable concurrency and retest -

    Requests per second:    451.77 [#/sec] (mean)
    Time per request:       22.135 [ms] (mean)

Now we see a huge performance boost, we are getting similar results as Unicorn even though we are running just one server process as opposed to Unicorn's three. One can imagine the performance for a clustered puma setup.

Lets try the same tests with [Trinidad](http://thinkincode.net/trinidad/) -

    RAILS_ENV=production jruby -S bundle exec trinidad -p 8080

Results with concurrency off -

    Requests per second:    287.45 [#/sec] (mean)
    Time per request:       34.788 [ms] (mean)

This is a bit slow, lets enable concurrency and retest -

    Requests per second:    391.74 [#/sec] (mean)
    Time per request:       25.527 [ms] (mean)

We see an improvment now. Although, Puma is a tad faster (ignorable).

Lastly with we will use the warbler gem to generate a war file and deploy it on standard tomcat with concurrency enabled -

    Requests per second:    241.42 [#/sec] (mean)
    Time per request:       41.422 [ms] (mean)

These numbers are a bit higher than Puma and Trinidad.

Finally, here is a summary -

- Unicorn is fast and performance improves as the number of workers are increased (no surprise!!). 
- There is no effect of enabling concurrency on Unicorn as MRI uses GIL (Global Interpreter Lock).
- When using Unicorn you don't have to worry about multithreading.
- Puma is fast but only when concurrency is enabled.
- Trinidad is almost as fast as Puma.
- A cluster of JRuby optimized servers (Puma / Trinidad) will be lightining fast.
- On JRuby servers the response time improves steadily as the server is hit due to JVM optimizations kicking in.
- With concurrency enabled on Puma / Trinidad watch out for thread safety.

I missed testing JRuby with Torquebox which is also a great JRuby server. Maybe I will update the blog later.

Also, with JVM / JRuby / multi-threading, there is big advantage of running jobs in background threads without relying on external processes.

However, with multi-threading enabled, thread safety may be hard to get right. If you have a simple application and you design the application with concurrency in mind (immutable classes, thread safe libraries) then go ahead and use JRuby with Puma / Trinidad / Torquebox. Learn more from a great post here - 

[https://github.com/jruby/jruby/wiki/Concurrency-in-jruby](https://github.com/jruby/jruby/wiki/Concurrency-in-jruby)

__Errata (10-Sep) :__ 

Earlier I tested tomcat with the path http://localhost:8080/testy, this did not hit the application as expected and I reported some wrong numbers. I am really sorry for the error, the url should have been http://localhost:8080/testy/ (with a slash at the end). The numbers / findings have now been updated. Big thanks to Ben Browning and Richard Huang!

__Update for Torquebox (11-Sep):__

Ben Browning (the creator of [Torquebox](http://torquebox.org)) suggested that I try these tests on (yet unreleased) torquebox-lite. We just need to add 'torquebox-lite' to our Gemfile for this. I got an error after this but I easily fixed it by adding the line __xa: false__ to my production database.yml config (as we are running the tests on production mode). More info on this here - [http://torquebox.org/documentation/2.1.1/transactions.html#transaction-configuration](http://torquebox.org/documentation/2.1.1/transactions.html#transaction-configuration). 

First with concurrency disabled, let us start a torquebox-lite instance with three runtimes with this simple command -

    RAILS_ENV=production jruby -S bundle exec torquebox-lite -p 8080 --min-runtimes=3 --max-runtimes=3

Even with consurrency disabled, the numbers here are quite good (although memory consumption is slightly on the higher side due to 3 runtimes and JBoss being a bit heavy) -

    Requests per second:    258.86 [#/sec] (mean)
    Time per request:       38.631 [ms] (mean)

And finally with concurrency enabled and a single torquebox runtime we get -

    Requests per second:    478.19 [#/sec] (mean)
    Time per request:       20.912 [ms] (mean)

The numbers match or are slightly better than Puma and drop even further as the JVM is warmed. For me, this makes a compelling case for using torquebox / torquebox-lite in production. Torquebox has a rock solid base of JBoss with great performance not to mention other awesome Torquebox features which you can see from my earlier blogs / [slideshare](http://localhost:4567/2012/03/26/ruby_conf_india_with_arunagw.html) presentation.

