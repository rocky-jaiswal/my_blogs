--- 
title: "Angular.js Hacks"
tags: JavaScript, AngularJS
date: 24/05/2013
---

A couple of good things happened this week, I got a MacBook Pro (Retina Display) from my generous employer (which I setup promptly after the recent pain Linux distros have been giving me) and I got an underground car parking at work. At 45 degrees, walking back to my car from my office was no easy feat and I am glad that now I've got a cool car (literally) waiting for me when I head home.

Also, I have been lucky enough to work on Angular.js for the last two weeks. Initially I was a bit apprehensive to work on it since I have been learning some Backbone.js lately, but then I gave Angular.js one more shot and have been really happy with it.

Since I am a CoffeeScript admirer and Backbone.js played really well with CoffeeScript I tried a bit to make Angular.js also work with CoffeeScript. Technically, anything in JavaScript can be converted to CoffeeScript, but I wanted to write Angular code in a more CoffeeScripty way. So below are a few hacks to write your Angular.js code with CoffeeScript.

###Angular.js and CoffeeScript

####Controllers

    "use strict"

    class NavigationCtrl

      constructor: (@$scope, @$location, @$routeParams, @storageService) ->
        if @storageService.get("token")
          @$scope.logout = @logout
        else
          @$location.url("login")

      logout: =>
        @storageService.clear()
        @$location.url("/")

    NavigationCtrl.$inject = ["$scope", "$location", "$routeParams", "storageService"]
    angular.module("webApp").controller "NavigationCtrl", NavigationCtrl

####Services / Factory

    "use strict"

    class StorageService

      store: (key, value) ->
        localStorage.setItem(key, value)

      get: (key) ->
        localStorage.getItem key

      clear: ->
        localStorage.clear()


    angular.module "webApp.service", [], ($provide) ->
      $provide.factory "storageService", -> new StorageService()

####Directives

    "use strict"

    class MyCurrentTime

      @options : () ->
        link : (scope, element, attrs) ->
          element.html new Date()

    angular.module("webApp").directive "myCurrentTime", MyCurrentTime.options


I am reasonably pleased with the controller and service code. However, the directive code feels very hackish, this is also partly because to the complex nature of directives and the sheer no of options they have.

###Animate a view with Angular 1.0.x

Apart from CoffeeScript, I also wanted to do some cool animations. While Angular 1.1.x (unstable) branch supports animations and I really wanted to use them but I had to stick with the stable 1.0.x branch for my project so I kinda hacked my own directive to load a view / page with an animation. 

I used [animate.css](http://daneden.me/animate/) for effects and tried creating a simple directive. After some research I found that I could extend the ngView directive to load with the views with an animation.

Looking at the code [here](https://raw.github.com/angular/angular.js/v1.0.6/src/ng/directive/ngView.js) I found the part where the HTML was being set (line 130) and from here on copied the code into my own directive added these lines after it -

    element.html(template);
    //animate it!
    var animation = 'animated fadeInRight';
    var childElem = angular.element(element.children()[0]);
    if(childElem.hasClass(animation))
      childElem.removeClass(animation);
    childElem.addClass(animation);

Well, it worked! My page loaded with an animation, all you need is that your partials be wrapped in a div (i.e. one parent element). So I bundled this as my own directive and replaced -

    <div class="container-fluid" data-ng-view></div>

with

    <div class="container-fluid" data-my-animated-view></div>

That's it. Hope these hacks help someone. Have a nice day.