--- 
title: "Angular.js - Sharing data between controllers"
tags: JavaScript, CoffeeScript, AngularJS
date: 29/07/2013
---

A lot of times my friends ask me - *"How do we share data between controllers in Angular.js?"*

Since services in Angular.js are injectable singletons, they seem like a good choice for sharing mutable data. But nothing is worth anything without some code. So here goes -

__some.html__

    <div class="row">
      <div class="span12" ng-controller="MainCtrl">
        <h2>Hello {{name}}!</h2>
      </div>
    </div>

    <div class="row" ng-controller="AnotherCtrl">
      <div class="span12">
        <h2>Greetings from {{name}}!</h2>
      </div>
    </div>

__main.coffee__

    'use strict'

    class MainCtrl

      constructor: (@$scope, @helperService) ->
        @$scope.name = "World"
        @helperService.setName("Coffee")

    MainCtrl.$inject = ["$scope", "helperService"]
    angular.module("demoApp").controller "MainCtrl", MainCtrl

__another.coffee__

    'use strict'

    class AnotherCtrl

      constructor: (@$scope, @helperService) ->
        @$scope.name = @helperService.getName()

    AnotherCtrl.$inject = ["$scope", "helperService"]
    angular.module("demoApp").controller "AnotherCtrl", AnotherCtrl

Finally, the __helper.coffee__

    'use strict'

    class HelperService

      constructor: () ->

      setName: (name) ->
        @name = name

      getName: ->
        @name

    angular.module "demoApp.helperService", [], ($provide) ->
      $provide.factory "helperService", -> new HelperService()

It works! QED :)

![AngularJS Controllers](/images/angular_c.png "AngularJS Controllers")