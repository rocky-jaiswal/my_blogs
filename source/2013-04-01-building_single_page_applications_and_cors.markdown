--- 
title: "Building Single Page Applications and CORS"
tags: Scala, Play, JavaScript, CoffeeScript, Require.js, Backbone
date: 01/04/2013
---

A while back I promised some insight on CORS [here](/2012/08/26/accessing_server_data_from_a_native_android_app.html) and it's about time I delivered. Few things have changed since then, I worked a bit on the Play framework and found it to be quite nice and also a lot of project requests in my day job now ask for a web application and a "native" mobile application (atleast one that works well on tablets).

Building web applications that also work on tablets can be done in many ways but over a period of time I have realized it's good to create separate applications for server side and client side logic. While the server side serves JSON (and talks to the data store) the client side takes care of rendering the UI. 

While both of these jobs can be done in a single Play / Rails application the advantage of the two component approach is that the client side app can be easily packaged later into a PhoneGap application and served as a native app. It also makes sure that the app is written cleanly and the sepraration of concerns is maintained. Ofcourse, this approach has it's disadvantages as it is not a very scalable way to write code but if the requirement is to create simple "Single Page Applications" it works well.

So in this blog we will talk about such an application which uses Scala + Play on the server side and on the client side we will use my favorite stack of Require.js and Backbone.js.

[Yeoman.io](http://yeoman.io) is a collection of tools which makes building client heavy application easy. It takes care of creating, building, minifying our client side code among other things. You can head over to [Yeoman.io's site](http://yeoman.io) to learn to create a simple web application and can easily add libraries like Backbone by running the following command -

    bower install --save backbone

As evident, adding libraries / components with Yeoman is trivial and the application it builds out the box uses Require.js etc. which makes life easy. Once you run "grunt server" it serves your application through a node.js server and developing and testing the app is also simplified due to node.js's speed and automatic refresh.

Moving back to the server side (Play) we want our server to just send over JSON so our controller could look something like -

    def data = Action {
      Ok(Json.obj("message" -> ("Hello World!") )) // Or get data from DB backed model etc.
    }

With the correct routing added if we go to __http://localhost:9000/data__ we get a JSON greeting (our Play application runs on port 9000).

Now on our client side, which is running on the Node.js server (and can later be packaged in PhoneGap) we need to access this data and maybe display it. Without going into the details of Backbone we can define our model as -

    define ["jquery", "underscore", "backbone"], ($, _, Backbone) ->
      'use strict'
      
      class RemoteModel extends Backbone.Model

        url: ->
          "http://localhost:9000/data"

And for the Backbone View -

    define ["jquery", "underscore", "backbone", ], ($, _, Backbone) ->
      'use strict'
      
      class RemoteView extends Backbone.View
        
        el: ".remote-message"

        render: ->
          @model.fetch({async: false})
          $(@el).html(JSON.stringify @model)

Now when we do -

    require(['remoteview', 'remotemodel', 'jquery', 'bootstrap'], function (RemoteView, RemoteModel, $) {
        'use strict';

        $(function () {
            var model = new RemoteModel();
            new RemoteView({model: model}).render();
        });
    });

We should see the JSON from the server on our client application. Ofcourse, this won't work as the Node.js server is different from the Play server and security policies do now allow cross-origin requests. These restrictions prevent a client-side Web application running from one server from obtaining data retrieved from another server (which is a good thing) but in our case we want this to be allowed.

So we head over to [W3C site](http://www.w3.org/TR/cors/) to see how this can be enabled. All we need to do is to add this header to our Play server's response -

    ACCESS_CONTROL_ALLOW_ORIGIN: "http://localhost:8000"

We allow requests from "http://localhost:8000" since our client side application is running there, in case we have to PhoneGap the app there is no server on the client side so we will need to allow the "null" origin as well (trivial to do). 

Now to add this header to our Play application, we could do something like this -

    def data = Action {
      Ok(Json.obj("message" -> ("Hello from Play!") )).withHeaders(ACCESS_CONTROL_ALLOW_ORIGIN -> "http://localhost:8000")
    }

Of course, adding the header to each and every Action is a pain so we can simply do this in our Global class -


    object Global extends GlobalSettings {

      /**
       * Global action composition.
       */
      override def doFilter(action: EssentialAction): EssentialAction = EssentialAction { request =>
        action.apply(request).map(_.withHeaders(
          ACCESS_CONTROL_ALLOW_ORIGIN -> "http://localhost:8000"
        ))
      }
    }

That's it! Our server side JSON can now be used on our client app.

![Yeoman and Play](/images/yeoman_and_play.png "Yeoman and Play")

Now, for the production setup, we can serve our client side application from plain NGINX (after buiding it from Yeoman/Grunt) and the same code can be served in a PhoneGap application as well in case we want a more "native" application. The Play server meanwhile serves both these application from a sigle (or clustered) instance and we get awesome [speed](http://www.techempower.com/blog/2013/03/28/framework-benchmarks/) as well.

p.s. Play here can be substituted with Rails as well.
