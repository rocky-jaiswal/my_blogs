--- 
title: "Testing Angular.js"
tags: JavaScript, CoffeeScript, AngularJS
date: 03/08/2013
---

As an Angular.js developer, I want to test my code, so that I can feel reasonably good about it. This sounds like a "User Story" in Scrum but it's more of a developer quest. So in this blog we will look at ways to test our Angular.js code.

Let's see what we need -

  - We need to write __unit tests__ for our
    - Controllers
    - Services
    - Directives
    - Filters
  - We need to write __end-to-end__ tests so that we can be sure everything is working well together

To kick off things, lets build a simple app which has a -

  - Login page, on which the user enters a username / password
  - Main page, which is shown if the user is successfully logged in
  - On the main page, we fetch data from a server and show it to the user

Simple enough, this would look something like -

![Login](http://rockyj.in/images/ang_login.png "Login")
![Main](http://rockyj.in/images/ang_main.png "Main")

We have 2 controllers and 2 services in this setup -

__controllers/login.coffee__

    'use strict'

    class LoginCtrl

      constructor: (@$scope, @$location, @webService, @helperService) ->
        @setup()

      setup: ->
        @$scope.login = @login

      success: (response) =>
        @helperService.setName "Rocky" #maybe this will come from reponse
        @$location.url "main"
     
      error: (response) =>
        @$scope.message = "Login Failed"

      login: (user) =>
        promise = @webService.login(user)
        promise.then @success, @error

    LoginCtrl.$inject = ["$scope", "$location", "webService", "helperService"]
    angular.module("demoApp").controller "LoginCtrl", LoginCtrl

__controllers/main.coffee__

    'use strict'

    class MainCtrl

      constructor: (@$scope, @webService, @helperService) ->
        @setup()

      setup: ->
        @$scope.name = @helperService.getName()
        
        promise = @webService.getData()
        promise.then @success, @error

      success: (response) =>
        #do something with data
     
      error: (response) =>
        @$scope.message = "Error!"

    MainCtrl.$inject = ["$scope", "webService", "helperService"]
    angular.module("demoApp").controller "MainCtrl", MainCtrl


__services/webservice.coffee__

    'use strict'

    class WebService

      constructor: (@$http) ->

      login: (user) ->
        @$http.post("http://localhost:3000/login", user)

      getData: () ->
        @$http.get("http://localhost:3000/getData")

    angular.module "demoApp.webService", [], ($provide) ->
      $provide.factory "webService", ["$http", ($http) -> new WebService($http)]


__services/helperservice.coffee__

    'use strict'

    class HelperService

      constructor: () ->

      setName: (name) ->
        @name = name

      getName: ->
        @name

    angular.module "demoApp.helperService", [], ($provide) ->
      $provide.factory "helperService", -> new HelperService()

Now, a piece of advice. We must try to keep our controllers lean and move logic in a OO or functional manner to services. As we will see services are easier to test.

Second point worth noting is that to run tests etc. we need a build system. I recommend [Yeoman](http://yeoman.io) which uses the excellent [Grunt](http://gruntjs.com) task runner. So to setup a Yeoman + Angular project, you can check out the [Yeoman](http://yeoman.io) site.

From hereon, I assume that we are using the Yeoman setup. The default Yeoman setup gives us a sample controller unit test in [Jasmine](http://pivotal.github.io/jasmine/), which we can modify to this -

__spec/controllers/main.coffee__

    'use strict'

    describe 'Controller: MainCtrl', () ->

      # load the app module
      beforeEach module 'demoApp'

      MainCtrl = {}
      scope = {}

      # Initialize the controller and a mock scope
      beforeEach inject ($injector, $controller, $rootScope) ->
        scope = $rootScope.$new()
        
        #Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend')
        $httpBackend.when('GET', 'http://localhost:3000/getData').respond({username: 'userX'}, {'A-Token': 'xxx'})

        MainCtrl = $controller 'MainCtrl', {
          $scope: scope
        }

      it 'should set scope properly', () ->
        expect(MainCtrl.scope).not.toBe null

      it 'should get services properly', () ->
        expect(MainCtrl.webService).not.toBe null

Two main things to note are -

  - the use of Angular's dependency injection services which gives us a reference to the __$injector__ itself which we use to mock the HTTP service (which is used by the MainCtrl's constructor) 
  - and a reference to the controller itself

Since we kept our Controllers lean, there is nothing much to test. To test the services is much easier -

__spec/services/helper.coffee__

    'use strict'

    describe 'Service: helperService', () ->

      # load the app module
      beforeEach module 'demoApp'

      helperService = {}

      # Initialize the controller and a mock scope
      beforeEach inject ($injector) ->
        helperService = $injector.get('helperService')

      it 'should get data properly', () ->
        helperService.setName("rocky")
        expect(helperService.getName()).toBe "rocky"

Once again the __$injector__ does the hard work of giving us our service's reference and from there on it's an easy task.

So we are done with writing some unit tests, you can run "grunt test" to test them.

Time to write some end-to-end tests. Unfortunately at the time of writing this blog, Yeoman does not fully support running end-to-end tests out of the box. It gives us a [Karma](http://karma-runner.github.io/0.8/index.html) end-to-end config file but does not provide a mechanism to run it.

To run it, we need to do a few changes to our __Gruntfile.js__ -

Remove the __grunt:test__ task and add these new two tasks

    grunt.registerTask('test:unit', [
      'clean:server',
      'concurrent:test',
      'connect:test',
      'karma:unit'
    ]);

    grunt.registerTask('test:e2e', [
      'clean:server',
      'concurrent:server',
      'connect:livereload',
      'karma:e2e'
    ]);

Then modify the karma task like this 

    ...
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      },
      e2e: {
        configFile: 'karma-e2e.conf.js',
        singleRun: true
      }
    },
    ...

In the karma-e2e.conf.js file, uncomment the last two lines -

    // Uncomment the following lines if you are using grunt's server to run the tests
    proxies = {
       '/': 'http://localhost:9000/'
    };
    // URL root prevent conflicts with the site root
    urlRoot = '_karma_';

We now have two Grunt tasks to run Unit and E2E tests respectively - __grunt test:unit__ and __grunt test:e2e__

Let us write a E2E test -

__test/e2e/smoke.coffee__

    'use strict'

    describe 'SmokeTest', () ->

      it 'should check if login page is working', () ->
        browser().navigateTo("/")
        expect(element('h2').html()).toEqual("Login")

      it 'should allow login', () ->
        browser().navigateTo("/")
        input("user.username").enter("rocky")
        input("user.password").enter("1234")
        element(".btn").click()
        expect(browser().window().hash()).toEqual("/main")

Like I mentioned we can run the E2E tests by running __grunt test:e2e__, this task first starts the test http server and then the tests are run over that.

That's it, we have run our Unit and End-to-End tests successfully. Happy hacking with Angular.js.






