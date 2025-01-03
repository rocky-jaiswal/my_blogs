---
title: 'JRuby with JBang'
tags: JVM, Java, JRuby
date: 22/12/2024
---

Well, it is that wonderful time of the year where we are at home for a few days enjoying the company of our family and feasting on all kinds of tasty treats. So first of all I would like to wish you a **Merry Christmas!** As the days melt into each other and us developers find some free time and venture into [Advent of Code](https://github.com/rocky-jaiswal/advent-2024) and similar shenanigans, I stumbled upon [JBang](https://www.jbang.dev/) which allows us to run Java (or Kotlin / Groovy) programs with one command. Officially JRuby is not supported, though I was intrigued.

I was a Ruby developer a while back (these days it's mostly TypeScript, and if I get lucky some Kotlin) but being a Java developer from around 2002-2010, I always found JRuby to be an exciting technology. Simply put, it holds the promise of JVM performance and the productivity and pleasure of developing in Ruby (Kotlin is the only language that comes close to this). I will not go into the details of JRuby but I always wanted to use something like [Javalin](https://javalin.io/) with JRuby. However while JRuby has good support for the Ruby ecosystem dependency management tools (like Bundler) it is a bit lacking on the JVM side, which has complex tooling like Gradle and Maven.

So while a small JRuby program like below should work in principle -

    require 'java'

    java_import 'io.javalin.Javalin'

    Javalin.create()
      .get('/') { |ctx| ctx.result("hello jruby") }
      .start(7070)

It is a pain to manually download Javalin "jars" and their dependencies, and as you add / need more libraries it is futher painful to download moar dependencies (and their own dependencies) manually and keep them updated etc. So I shelved the idea of using Java ecosystem libraries with JRuby, even though this setup holds a lot of horsepower under the hood specially with recent innovations like Virtual Threads on the JVM.

But we need the power of the JVM and the readability / productivity of Ruby, it is almost 2025 after all!

![Futuristic racer](/images/future_racer.png)

When I read about JBang and the simple dependency management it provides, there was some hope. Dependencies in JBang are very simply declared in a "script" like file [as seen here](https://www.jbang.dev/documentation/guide/latest/dependencies.html). But since there is no official support for JRuby, how can I integrate the dependency and scripting magic of JBang and the ease and productivity of writing code in JRuby?

Well, turns out the answer is quite simple, a little bit of perusal of JBang code and I saw the system works for "groovy" (for example) with the power of Java's "ProcessBuilder". So we can use JBang for the dependency management and spin up a JRuby process thereafter from the JBang's Java program. Do not worry, we will look at some code in a moment. First to keep our life simple, let us start with a Dockerfile.

    FROM amazoncorretto:21

    RUN mkdir -p /opt/app

    WORKDIR /opt/

    RUN yum update -y
    RUN yum install -y wget unzip

    RUN wget https://repo1.maven.org/maven2/org/jruby/jruby-dist/9.4.8.0/jruby-dist-9.4.8.0-bin.zip
    RUN wget https://github.com/jbangdev/jbang/releases/download/v0.122.0/jbang-0.122.0.zip

    RUN unzip jruby-dist-9.4.8.0-bin.zip
    RUN unzip jbang-0.122.0.zip

    RUN mv /opt/jruby-9.4.8.0 /opt/jruby
    RUN mv /opt/jbang-0.122.0 /opt/jbang

    ENV PATH="/opt/jruby/bin:/opt/jbang/bin:$PATH"

    WORKDIR /opt/app/

    COPY . .

    EXPOSE 7070

    CMD ["jbang", "RunJRuby.java", "hello_javalin.rb"]

Nothing complicated here, we start with a JDK base image and download JRuby and JBang and set them up in the `PATH`. With JBang's help we run a Java program passing it an argument.

The meat of this silly experiment is a simple Java file -

    // RunJRuby.java
    ///usr/bin/env jbang "$0" "$@" ; exit $?

    //DEPS org.slf4j:slf4j-simple:2.0.16
    //DEPS com.fasterxml.jackson.core:jackson-databind:2.17.2
    //DEPS io.javalin:javalin:6.4.0

    import static java.lang.System.*;

    import java.io.IOException;

    public class RunJRuby {

        public static void main(String... args) throws IOException, InterruptedException {
            out.println("executing jruby script ...");
            out.println("--------------------------");
            // out.println(getProperty("java.class.path"));

            var processBuilder = new ProcessBuilder();
            processBuilder.inheritIO();

            var environment = processBuilder.environment();
            environment.put("CLASSPATH", getProperty("java.class.path")); // set classpath

            processBuilder.command("jruby", args[0]); // run jruby program
            var process = processBuilder.start();

            int exitCode = process.waitFor();

            out.println("--------------------------");
            out.println("Exit code - " + exitCode);
        }
    }

I have added some code at the top of this Java program to download dependencies and with some **CLASSPATH** magic set, we can invoke the "jruby" binary and run a simple script like -

    # hello_javalin.rb
    require 'java'

    java_import 'io.javalin.Javalin'

    Javalin.create()
      .get('/') { |ctx| ctx.json({ message: "hello jruby" }) }
      .start(7070)

If you build and run this Docker image, you should see Javalin running on port 7070 and accepting HTTP requests on route "/".

Well, this is a huge deal, now we can combine the forces of Ruby and Java ecosystem libraries. We can use HTTP and JDBC libraries for the "heavy lifting" IO part and Ruby gems for our other code. So here is an example where use [JDBI](https://jdbi.org/) for the DB access, SLF4J for logging and [ruby-jwt](https://github.com/jwt/ruby-jwt) for some JWT management. We create and use a SQLite DB so we have an end-to-end CRUD like API.

Let's update the Dockerfile a bit -

    FROM amazoncorretto:21

    RUN mkdir -p /opt/app

    WORKDIR /opt/

    RUN yum update -y
    RUN yum install -y wget unzip

    RUN wget https://repo1.maven.org/maven2/org/jruby/jruby-dist/9.4.8.0/jruby-dist-9.4.8.0-bin.zip
    RUN wget https://github.com/jbangdev/jbang/releases/download/v0.122.0/jbang-0.122.0.zip

    RUN unzip jruby-dist-9.4.8.0-bin.zip
    RUN unzip jbang-0.122.0.zip

    RUN mv /opt/jruby-9.4.8.0 /opt/jruby
    RUN mv /opt/jbang-0.122.0 /opt/jbang

    ENV PATH="/opt/jruby/bin:/opt/jbang/bin:$PATH"

    RUN gem install jwt

    WORKDIR /opt/app/

    COPY . .

    EXPOSE 7070

    CMD ["jbang", "RunJRuby.java", "javalin.rb"]

We have simply added a "gem" for JWT management and pointed JBang to a larger JRuby application.

We then add some more Java depedencies in our Jbang / Java file  -

    // RunJRuby.java
    ///usr/bin/env jbang "$0" "$@" ; exit $?

    //DEPS org.slf4j:slf4j-simple:2.0.16
    //DEPS com.fasterxml.jackson.core:jackson-databind:2.17.2
    //DEPS io.javalin:javalin:6.4.0
    //DEPS org.jdbi:jdbi3-core:3.47.0
    //DEPS org.jdbi:jdbi3-sqlite:3.47.0
    //DEPS org.xerial:sqlite-jdbc:3.47.0.0

    import static java.lang.System.*;

    import java.io.IOException;

    public class RunJRuby {

        public static void main(String... args) throws IOException, InterruptedException {
            // same as before
        }
    }

Finally we have a Javalin CRUD like app with some JWT auth also thrown in -

    require 'java'
    require 'jwt'

    java_import 'io.javalin.Javalin'
    java_import 'org.slf4j.LoggerFactory'

    require './app/controllers/users_controller'

    logger = LoggerFactory.getLogger('javalin app')

    hmac_secret = 'my$ecretK3y'

    app = Javalin.create() do |config|
            config.useVirtualThreads = true
          end
        .start(7070)

    logger.info('application started ...')

    app.before("/api/*") do |ctx|
      logger.info('received request ...')
      
      auth_header = ctx.header('Authorization')
      raise StandardError.new 'No Authorization header found' if auth_header.nil?
      
      JWT.decode(auth_header.slice(7..(auth_header.size)), hmac_secret, true, { algorithm: 'HS256' })
    end

    app.get('/token/') do |ctx|
      ctx.json({ token: JWT.encode({ role: 'admin' }, hmac_secret, 'HS256') })
    end

    app.get('/api/users/') do |ctx|
      users = UsersController.new.find_all
      ctx.json({ users: users })
    end

    # users_controller.rb

    require './app/models/user'

    class UsersController

      def find_all
        User.new.find_all
      end

    end

    # user.rb

    require 'java'

    java_import 'org.jdbi.v3.core.Jdbi'

    class User

      attr_reader :jdbi

      def initialize
        @jdbi = Jdbi.create("jdbc:sqlite:db.sqlite")
      end

      def find_all
        users = []
        jdbi.useHandle do |handle|
          users = handle.createQuery("SELECT * FROM users").mapToMap.list()
        end
        users
      end

    end

And all this hackery does work! We have a Docker container with JRuby running Javalin with JBang's help, we even have an API which queries a SQLite DB and spits out JSON. To top it, the performance on my modern Ryzen 7 CPU was not bad at all.

See sample output below -

    ❯ docker run -it -p 7070:7070 rockyj/jbang-jruby-javalin
    [jbang] Resolving dependencies...
    [jbang]    org.slf4j:slf4j-simple:2.0.16
    [jbang]    com.fasterxml.jackson.core:jackson-databind:2.17.2
    [jbang]    io.javalin:javalin:6.4.0
    [jbang]    org.jdbi:jdbi3-core:3.47.0
    [jbang]    org.jdbi:jdbi3-sqlite:3.47.0
    [jbang]    org.xerial:sqlite-jdbc:3.47.0.0
    [jbang] Dependencies resolved
    [jbang] Building jar for RunJRuby.java...
    executing jruby script ...
    --------------------------
    [main] INFO io.javalin.Javalin - Starting Javalin ...
    [main] INFO org.eclipse.jetty.server.Server - jetty-11.0.24; built: 2024-08-26T18:11:22.448Z; git: 5dfc59a691b748796f922208956bd1f2794bcd16; jvm 21.0.5+11-LTS
    [main] INFO org.eclipse.jetty.server.session.DefaultSessionIdManager - Session workerName=node0
    [main] INFO org.eclipse.jetty.server.handler.ContextHandler - Started o.e.j.s.ServletContextHandler@486dd616{/,null,AVAILABLE}
    [main] INFO org.eclipse.jetty.server.AbstractConnector - Started ServerConnector@206bd7a0{HTTP/1.1, (http/1.1)}{0.0.0.0:7070}
    [main] INFO org.eclipse.jetty.server.Server - Started Server@8167f57{STARTING}[11.0.24,sto=0] @2105ms
    [main] INFO io.javalin.Javalin - 
          __                  ___           _____
          / /___ __   ______ _/ (_)___      / ___/
    __  / / __ `/ | / / __ `/ / / __ \    / __ \
    / /_/ / /_/ /| |/ / /_/ / / / / / /   / /_/ /
    \____/\__,_/ |___/\__,_/_/_/_/ /_/    \____/

          https://javalin.io/documentation

    [main] INFO io.javalin.Javalin - Javalin started in 80ms \o/
    [main] INFO io.javalin.Javalin - Listening on http://localhost:7070/
    [main] INFO io.javalin.Javalin - You are running Javalin 6.4.0 (released December 17, 2024).
    [main] INFO javalin app - application started ...
    [JettyServerThreadPool-Virtual-12] INFO javalin app - received request ...
    [JettyServerThreadPool-Virtual-10] INFO javalin app - received request ...


And some hacky performance testing with apache-benchmark (ab) tool -

    ❯ ab -n 1500 -c 25 -H 'Authorization:Bearer eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.7kgFUPogfLqftn7F34TnM9LzU_ZbqwYfkk5ZAJsUMEE' http://localhost:7070/api/users/

    Percentage of the requests served within a certain time (ms)
    50%      5
    66%      5
    75%      6
    80%      7
    90%      8
    95%      9
    98%     11
    99%     13
    100%    34 (longest request)

So 95% of the 1500 requests with a concurrency of 25 were handled in under 10 milli-seconds, which is pretty good! Not to mention the code is pretty minimal and clean. With the latest version of Javalin we also served all requests with Jetty and Virtual Threads which is known to be pretty performant. So we finally have the promised combination of performance and productivity.

Here is the [github repo](https://github.com/rocky-jaiswal/jbang-jruby-javalin). Sadly, this is only a hacky setup and not meant to be taken seriously but I hope you had some fun reading this. Have a great holiday!
