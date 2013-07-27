--- 
title: "Angular.js with Scalatra"
tags: JavaScript, CoffeeScript, AngularJS, Scala
date: 27/07/2013
---

Angular.js is pretty much my favorite way to develop web applications as of now. For building simple applications with Angular.js I look for a basic backend through which I can add persistence or do some heavy lifting. 

Node.js is a one possible backend which does the job and is pretty fast, Rails / [Rails-API](https://github.com/rails-api/rails-api) is another good option. However, being a Scala admirer, I thought of building a backend in Scala. A type safe, compiled language does offer speed and scalability as a backend service. 

With Scala as my choice I was left with two options - Play framework or [Scalatra](http://scalatra.org/). Play framework with Reactive Mongo is a good combination to "play" with but I went for Scalatra as it is lighter and fits the description of a JSON spewing backend well.

With my Scalatra backend, I want to use MongoDB for persistent and to finally make things spicier use [Akka](http://akka.io) to make the HTTP calls asynchronous. 

After installing and reading the Scalatra documentation, I was on my way. The documentation although good, does leave some gaps, so hope this blog helps someone.

To get the persistence with MongoDB working we need to setup Casbah (the mongo Scala driver). This is simple enough -

    libraryDependencies ++= Seq(
        "org.mongodb" %% "casbah" % "2.6.0", //add this line in project/build.scala

Similarly, to serialize our response to JSON we add a few dependencies -

    libraryDependencies ++= Seq(
        "org.mongodb" %% "casbah" % "2.6.0",
        "org.scalatra" %% "scalatra-json" % "2.2.1",
        "org.json4s"   %% "json4s-jackson" % "3.2.4",

Since I am using Scala 2.10.2, there is no need to add any lib for Akka since Akka is built in.

Now, in our Scalatra BootStrap class we setup Akka and Casbah -

    import in.rockyj.hello._
    import org.scalatra._
    import javax.servlet.ServletContext
    import com.mongodb.casbah.Imports._
    import _root_.akka.actor.{ActorSystem, Props}

    class ScalatraBootstrap extends LifeCycle {

      val system = ActorSystem("ScalatraSystem")
      
      override def init(context: ServletContext) {
        val mongoClient =  MongoClient()
        val mongoColl = mongoClient("casbah_test")("test_data")
        context.mount(new AppServlet(mongoColl, system), "/*")
      }
      
      override def destroy(context:ServletContext) {
        system.shutdown()
      }
      
    }

Simple enough, we setup a *casbah_test* DB and a simple *test_data* collection. We also initialize the Akka Actor system and pass these references to a Scalatra servlet.

The Scalatra servlet looks like this -

    package in.rockyj.hello

    //Scalatra
    import org.scalatra._
    import scalate.ScalateSupport
    import org.scalatra.{FutureSupport, Accepted, ScalatraServlet}
    import org.scalatra.json._
    import org.scalatra.CorsSupport
    // MongoDb-specific imports
    import com.mongodb.casbah.Imports._
    // JSON-related libraries
    import org.json4s.{DefaultFormats, Formats}
    //Akka
    import _root_.akka.actor.{ActorRef, Actor, Props, ActorSystem}
    import _root_.akka.util.Timeout
    import _root_.akka.pattern.ask

    case class Query(key: String, value: String, mongoColl: MongoCollection)

    class AppServlet(mongoColl: MongoCollection, system:ActorSystem) extends MyScalatraWebAppStack with JacksonJsonSupport with FutureSupport with CorsSupport {

      val myActor = system.actorOf(Props[MyActor])

      protected implicit val timeout = Timeout(10)
      protected implicit val jsonFormats: Formats = DefaultFormats
      protected implicit def executor = system.dispatcher
      
      options("/*") {
        response.setHeader("Access-Control-Allow-Headers", request.getHeader("Access-Control-Request-Headers"));
      }
      
      get("/") {
        contentType="text/html"
        layoutTemplate("/WEB-INF/templates/views/index.jade")
      }
      
      /**
       * Insert a new object into the database:
       *curl -i -H "Accept: application/json" -X POST -d "key=hello&value=world" http://localhost:8080/insert
       */
      post("/insert") {
        val key = params("key")
        val value = params("value")
        val newObj = MongoDBObject(key -> value)
        mongoColl += newObj
      }
      
      /**
       * Query for the first object which matches the values given.
       * try http://localhost:8080/query/hello/world in your browser.
       */
      get("/query/:key/:value") {
        contentType = formats("json")
        val q = Query(params("key"), params("value"), mongoColl)
        myActor ? q
      }
      
    }


    class MyActor extends Actor {

      def receive = {
        case Query(key, value, mongoColl) => {
          val q = MongoDBObject(key -> value)
          val res = mongoColl.findOne(q).getOrElse(Map("not found" -> true))
          sender ! res
        }
      }

    }

Nothing really complicated, we can seed some data using CURL at the available POST end point. Since we will be calling these services from a Angular.js app running on a different server I needed to add CORS support via this line -

    options("/*") {
      response.setHeader("Access-Control-Allow-Headers", request.getHeader("Access-Control-Request-Headers"));
    }

The whole Scalatra app is available on [github](https://github.com/rocky-jaiswal/hello-scalatra).

On the Angular.js side, we will consume this service and display the data on a web page.

    #app.coffee
    'use strict'

    angular.module('demoApp', ["demoApp.webService"])
      .config ($routeProvider) ->
        $routeProvider
          .when('/', {templateUrl: 'views/main.html', controller: 'MainCtrl'})
          .otherwise(redirectTo: '/')

    #webservice.coffee
    "use strict"

    class WebService

      constructor: (@$http) ->

      getGreeting: () ->
        promise = @$http.get("http://localhost:8080/query/hello/world")

    angular.module "demoApp.webService", [], ($provide) ->
      $provide.factory "webService", ["$http", ($http) -> new WebService($http)]


    #main.coffee
    'use strict'

    class MainCtrl

      constructor: (@$scope, @webService) ->
        promise = @webService.getGreeting()
        promise.then @success, @error

      success: (response) =>
        @$scope.response = response.data
     
      error: (response) =>
        #do something

    MainCtrl.$inject = ["$scope", "webService"]
    angular.module("demoApp").controller "MainCtrl", MainCtrl

That is it for this weekend's hack. I ran some tests with Apache benchmark on my Scalatra server in a single core VM and the average response for - __ab -n 200 -c 4 http://localhost:8080/query/hello/world__ came to be 14ms which is pretty good.