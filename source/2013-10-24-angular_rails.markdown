--- 
title: "Working with Angular.js and Rails"
tags: Rails, AngularJS
date: 24/10/2013
---

If you put me in a corner today and ask me to build a project I would choose __Rails + Angular.js__. It is just an awesome combination to build clean apps quickly. However, a few of my friends have lately asked me how to properly setup Angular.js with Rails. One way is the standard [Yeoman](http://yeoman.io/) / [Grunt](http://gruntjs.com/) way which is awesome and creates a nice minified build for you but how do you integrate it with Rails cleanly? Another way is to use the Rails asset pipeline which works well but causes problems when you are using require.js among other stuff.

I find the Yeoman Angular generator really awesome, it generates the skeleton code for an Angular.js project and a great Grunt file which has livereload, cssmin, htmlmin, imagemin etc. working out of the box.

So, how could one use Rails with the Yeoman generated Angular project without tearing one's hair out. I tried a lot of things but finally found this clean way of working. _Plase note, the code shown in this blog is available on [Github](https://github.com/rocky-jaiswal/ebenezer)_

What we will be building is a pure JSON spewing Rails backend and a pure Angular.js frontend.

First things first, let us not use Rails. __WAT!__ Instead we will use [rails-api](https://github.com/rails-api/rails-api), which is Rails with some middlewares removed so that our application is optimized for building APIs. Being a performance geek, I feel happy using the bare minimum of any framework / library. This may cause issues later but let's run with it.

###Kickoff

Create a Rails-API project with the command -

    rails-api new <appname> -S -T

The "-S" options removes the sprockets stuff, we dont need it since we will use Grunt for our frontend code. "-T" is because I use RSpec (don't kill me please). Have a look at the Gemfile, there should be the rails-api gem there, add other gems that you usually use like rspec, thin etc.

Go to the <appname>/public directory and delete everything. Create a new folder called "angular" here and cd into it. If you have Yeoman and Grunt installed as usual, run -

    yo angular --coffee

You now have a nice skeleton Angular.js project here. As usual, run __grunt server__ to test things out.

###The issues

Our Yeoman / Grunt project and Rails app work perfectly in isolation but we want them to talk to each other for getting / posting data. There are two problems here - 

- We are running our Rails app on port 3000 and the Grunt app on port 9000. We will face problems with CORS to exchange data, this is easily fixable with some middleware thrown in.
- The second problem is that in Production, there will be no grunt connect server which we use in development, we will just serve our frontend code from Apache/ Nginx, so we should not be hardcoding the full Rails URL in our frontend code e.g. __http://localhost:3000/api/v1/sayHello__. This is a tricky situation.

###Frontend Setup

Let us fix the second problem first. We will use the awesome [grunt-connect-proxy](https://github.com/drewzboto/grunt-connect-proxy) plugin. This will make sure that any calls that start with __/api/v1__ are sent to the Rails backend. Simple! Please see my [Gruntfile](https://github.com/rocky-jaiswal/ebenezer/blob/master/public/angular/Gruntfile.js) and read the documentation for the plugin to get started.

Here is how my webservice Angular code looks like.

The service -

    'use strict'

    class WebService

      constructor: (@$http) ->
        @baseUrl = "/api/v1/"

      getGreeting: () ->
        @$http.get(@baseUrl + "greet")

    angular.module "ebenezerApp.webService", [], ($provide) ->
      $provide.factory "webService", ["$http", ($http) -> new WebService($http)]

The controller -

    'use strict'

    class MainCtrl

      constructor: (@$scope, @webService, @storageService) ->
        @setup()

      setup: ->
        @$scope.awesomeThings = [
          'HTML5 Boilerplate'
          'AngularJS'
          'Karma'
        ]
        @getData()

      getData: ->
        promise = @webService.getGreeting()
        promise.then @success, @error

      success: (response) =>
        @$scope.message = response.data.message

      error: (response) =>
        @$scope.message = "Error!"


    MainCtrl.$inject = ["$scope", "webService", "storageService"]
    angular.module("ebenezerApp").controller "MainCtrl", MainCtrl

This is good because now even in production where there is no second server running, I have to make no change to my code.

###Backend Setup

In development mode, the frontend code runs on port 9000 and our Rails backend runs on port 3000. This causes CORS problem, to solve it simply add the gem __'rack-cors'__ in your Gemfile's development group and add this config to your development.rb config file -

    config.middleware.use Rack::Cors do
      allow do
        origins 'localhost:9000'
        resource '*', :headers => :any, :methods => [:get, :post, :options, :delete]
      end
    end

Bundle and restart your Rails server, now your Grunt server can talk to the Rails server.

Sample controller -

    module Api
      module V1
        class PagesController < ApplicationController
      
          def greet
            render :json => {message: "Hello World!"}.as_json
          end

        end
      end
    end

Sample route file -

    Ebenezer::Application.routes.draw do
      namespace :api, defaults: {format: 'json'} do
        namespace :v1 do
          get "/greet" => "pages#greet", :as => 'greet'
        end
      end
    end

Your development environment is all set now -

![Rails_Angular](/images/yeoman_and_rails.png "Rails_Angular")

###Production

Run Rails as usual in production, all you need to do is run the __grunt__ task in your public/angular directory and copy the contents of the created __dist__ folder two levels up to public. You can do this with a shell script, rake task or grunt task.

###All Done

Enjoy your new awesome setup of Rails + Gruntified Angular.js with a single codebase and no changes needed for production. In my next blog we will setup some Authentication and Authorization for our backend API and integrate it with our Angular app, I found this part to be quite tricky yet essential.