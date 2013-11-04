--- 
title: "Working with Angular.js and Rails - 2"
tags: Rails, AngularJS
date: 04/11/2013
---

In my [last](http://rockyj.in/2013/10/24/angular_rails.html) blog I covered setting up a basic Rails + Angular.js webapp with [Rails-API](https://github.com/rails-api/rails-api) and [Yeoman](http://yeoman.io/). As promised in this post we will look at building a simple Authentication and Authorization mechanism on top of our application.

_Plase note, the code shown in this blog is available on [Github](https://github.com/rocky-jaiswal/ebenezer)._

For authentication we will use __Devise__ and for Authorization we will use __Pundit__, which are pretty standard gems used for these purposes.

###Devise

Devise and Rails are pretty easy to setup with the vanilla installations but since we are using rails-api we have a few issues -

- Rails-API has a few middlewares missing which may cause a problem
- We cannot use cookies for API based authentication (middleware are missing and APIs should not rely on cookies)
- Devise 3.1+ removed support for token based authentication which would have been the default choice for API based authentication

For issue one, following the basic Devise installation you will encounter this error -

    NameError (undefined local variable or method `mimes_for_respond_to' for DeviseController:Class):
      devise (3.1.1) app/controllers/devise_controller.rb:13:in `<class:DeviseController>'

This is easily fixable by adding the middleware to our ApplicationController -

    class ApplicationController < ActionController::API
      include ActionController::MimeResponds

Since we cannot use cookies we will setup a simple token based authentication mechanism, which works like this -

1. User enters a username and password and sends a login request to the server
2. Devise authenticates the user, and sends back a token which is also persisted on the server for the particular user
3. We store the returned token on the client side as well (lets say in localStorage / or just in memory using an Angular.js service)
4. Subsequent requests from the client add the token in the request header
5. On receiving a request, the server extracts and matches the token & the user and authenticates the request
6. When the user logs out, we delete the token from the client side and the server side

Please note that this approach is not battle-tested but is pretty standard and should be fine over HTTPS and non-critical applications.

Now devise has removed the out-of-the-box token based auth as mentioned [here](http://blog.plataformatec.com.br/2013/08/devise-3-1-now-with-more-secure-defaults/) so we will have to do some work to set this up. Thankfully José Valim being the nice guy that he is, also pointed us to a possible solution [here](https://gist.github.com/josevalim/fb706b1e933ef01e4fb6). _Plus, I am no genuius, I merely stand on the shoulder of giants._

There is a lot of code to get this all working so I will recommend that you have a look at the related files on Github.

- [Client side controller](https://github.com/rocky-jaiswal/ebenezer/blob/master/public/angular/app/scripts/controllers/login.coffee)
- [Client side web service](https://github.com/rocky-jaiswal/ebenezer/blob/master/public/angular/app/scripts/services/webservice.coffee)
- [Routes file for our custom login / logout paths](https://github.com/rocky-jaiswal/ebenezer/blob/master/config/routes.rb)
- [Application Controller changes for Devise setup](https://github.com/rocky-jaiswal/ebenezer/blob/master/app/controllers/application_controller.rb)
- [Our own custom Devise controller](https://github.com/rocky-jaiswal/ebenezer/blob/master/app/controllers/sessions_controller.rb)
- [A security "concern" for the user](https://github.com/rocky-jaiswal/ebenezer/blob/master/app/models/concerns/security.rb)

With all this in place we will get our desired authentication mechanism working.

###Pundit

To test authorization we will use Pundit and the very original User has many Posts data model. Pundit is pretty easy to setup out of the box since we have done the hard work of setting up rails-api and devise. I pretty much followed the documentation and got it working. You can see the code changes made in [ApplicationController](https://github.com/rocky-jaiswal/ebenezer/blob/master/app/controllers/application_controller.rb) and sample [Post Policy](https://github.com/rocky-jaiswal/ebenezer/blob/master/app/policies/post_policy.rb).

Finally, we want to write a reponse interceptor on the client side so that if the response code from the server is 401 we show the user the login page instead of throwing an error. This is easily done with Angular.js config as done [here](https://github.com/rocky-jaiswal/ebenezer/blob/master/public/angular/app/scripts/app.coffee#l18).

That's it, we now a basic and secure Angular.js + Rails-API application working. All you need to do is to add business logic and you have a fast*, clean working application built in real quick time.

_*I would also throw in Redis for the User / Token based lookup._







