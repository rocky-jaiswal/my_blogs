--- 
title: "AngularJS and Browserify"
tags: Rails, JavaScript, CoffeeScript, AngularJS
date: 21/02/2015
---


Angular (and some other JS frameworks) implements two-way data binding. With two way data binding, the view is automatically updated when the model (or data) changes and vice-versa. Although, we can consider it the framework’s job, it is interesting to know how this works under the hood. So let’s do that.

Since Angular is a full fledged framework, it works on the tried and tested MV* paradigm. Model represents the data, View is the HTML template and then there are other concepts such as Controllers and Services. One important aspect mentioned a lot in the Angular world is “scope”. Since we do not want to directly deal with the HTML DOM from the controllers we use scope as the glue between controller and the view. This is because Angular emphasises on is clean separation of concerns, this is important for testing, understanding and scaling code.

What we assign to a property on the scope is available to the view (of-course if it is looking at the right scope). Like I mentioned earlier, Angular also provides two way data-binding which means changing the scope changes the view and vice-versa. How Angular does this internally is really interesting. 

Essentially this boils down to two things, maintaining a list of elements to “watch” and taking appropriate action when they change. In our example, when we added the ng-model directive to our input, Angular behind the scenes adds a watch to its watch list. The watchers also have a callback function that is fired off if the watcher detects a change.

Periodically (like a game or event loop), Angular runs something called the “digest” cycle. When the digest cycle starts, it fires off each of the watchers, which check if the scope model has changed and if yes, they fire off the callback function of the watchers. What if one of the watcher’s callback function changes the model itself? The answer is that the digest loop/cycle doesn’t run just once. At the end of the current loop, it starts all over again to check if any of the models have changed. This is basically the basis of dirty checking, and is done to account for any model changes that might have been done by listener functions. So, the digest cycle keeps looping until there are no more model changes, or it hits the max loop count of 10. 

One of the valuable lesson we learned here by looking into the internals of Angular is that we should try and keep an eye on the number of watchers we create for an application. Programmatically, we can measure the number of watchers and look at ways to bring them down if they exceed a few hundred. On the positive side, this may seem like a lot of work but modern JavaScript interpreters are super fast and the human eye cannot even register all the work happening in the background, we just see the Angular magic and the huge development gains Angular brings. 

Enough of talk, let us build something with Angular. To demonstrate the rich feature set Angular provides, we are going to build an application that fetches some data from a server (can be built with anything that responds with JSON) and shows it on the browser. Lets build a “quizmaster” application, our server will send a few questions to the browser, the user will respond to them and we will tell him if he is right or wrong, then the user will move on to the next question.

One the browser, the application will look something like this -

![Quizmaster](/images/quizmaster.png "Quizmaster")

To start building a new Angular app, I recommend using Yeoman’s [http://yeoman.io/](http://yeoman.io/) Angular generator. This also generates a feature loaded Grunt file which aids development. Since this is extensively documented I will leave the setup to the you and assume that you can get a simple Angular app running using Yeoman.

For our app, the main template looks like -

	<body ng-app="quizApp">
	  <div class="container">
	    <div class="header">
	      <ul class="nav nav-pills pull-right">
	        <li class="active"><a ng-href="#">Home</a></li>
	  	<li><a ng-href="#/about">About</a></li>
	      </ul>
	      <h3 class="text-muted">QuizMaster</h3>
	    </div>
	    <div class="main" ng-view=""></div>
	    <div class="footer">
	      <p>Rocky 2015</p>
	    </div>
	  </div>
	  <script src="build/quiz_app.js"></script>
	</body>

The two main Angular directives we see here are ng-app and ng-view. ng-app is used to define the root element of the Angular application, usually it is placed on the <body> tag. ng-view complements the Angular routing service and renders the route’s template into the main layout.

Now let us see the setup / configuration of the Angular application -


	app = angular.module('quizApp', ['ngRoute', 'quizApp.webService'])

	app.config ($routeProvider) ->
	    $routeProvider
	      .when '/',
		templateUrl: 'views/main.html'
		controller: 'MainCtrl'
	      .when '/about',
		templateUrl: 'views/about.html'
		controller: 'AboutCtrl'
	      .otherwise
		redirectTo: '/'

Here we register a module named “quizApp” and pass it a couple of dependencies, one being the angular-routing module itself and one our own service (which we will look at later). Next we setup the routing for the app, so that we can have a controller and template for each route. This also keeps the codebase cleanly partitioned.

Now, in a normal application if we write these JavaScript file we will have to manually add them to our main HTML file, something like this -

	<script src="bower_components/angular/angular.js"></script>
	<script src="bower_components/angular-route/angular-route.js"></script>
	<!-- maybe more script files -->    
	<script src="scripts/app.js"></script>
	<script src="scripts/services/web_service.js"></script>
	<script src="scripts/controllers/main.js"></script>
	<script src="scripts/controllers/about.js"></script>


I find this quite cumbersome, especially when writing a new service or controller. Most of the times I forget to add the file reference to the HTML and then struggle to debug the error. This is actually my only complaint with Angular that despite it being a modern framework, I still have to manage my dependencies by adding <script> tags to the HTML file. Surely, there has to be a better way.

As you may have guessed, there is an answer - Browserify. Browserify enables us to write node.js server style code on the browser. For example with CoffeeScript and Browserify we can do - 

	#file user.coffee
	class User
	  initialize:(@name)->
	    console.log @name

	  sayHi:->
	    console.log "Hello #{@name}"

	module.exports = User

	#file app.coffee
	User = require("./user")

	u1 = new User("abc")
	u1.sayHi()

Browserify can also integrate with Grunt so we can add a Grunt task that will take of building one script for us by using Browerify to manage and load all the dependencies with https://github.com/jmreidy/grunt-browserify. This will enable us to write only one script tag and the whole application will work from there. Also, when we add new controllers / services / directives we do not have to worry about adding them to the HTML file.

One thing to note is that to get Angular to work with Browserify we need to use napa (https://www.npmjs.org/package/napa). This can be easily done by running -

	npm install napa --save-dev

and adding this to package.json -

	{
	  "scripts": {
	    "install": "napa"
	  },
	  "napa": {
	    "angular": "angular/bower-angular",
	    "angular-route": "angular/bower-angular-route"
	  }
	}

Finally run “npm install” to get angular working with Browserify.


With Browerify working our code would look something like this - 

	#app.coffee

	require('angular/angular')
	require('angular-route/angular-route')

	app = angular.module('quizApp', ['ngRoute', 'quizApp.webService'])

	app.config ($routeProvider) ->
	    $routeProvider
	      .when '/',
		templateUrl: 'views/main.html'
		controller: 'MainCtrl'
	      .when '/about',
		templateUrl: 'views/about.html'
		controller: 'AboutCtrl'
	      .otherwise
		redirectTo: '/'

	module.exports = app

Once the Angular base module is setup along with routing, the MainCtrl (short for Main Controller) takes over managing the scope on the root path.

MainCtrl fetches the questions from the backend server and slots them one by one in the scope so that they are displayed one at a time. The code for this looks like - 

	#main.coffee
	'use strict'

	app = require("./../app")
	_ = require("underscore")

	class MainCtrl

	  constructor: (@$scope, @$location, @webService) ->
	    @index = 0
	    @$scope.submitResponse = @submitResponse
	    @$scope.nextQuestion = @nextQuestion
	    @$scope.prevQuestion = @prevQuestion
	    promise = @webService.getQuestions()
	    promise.then @success, @error

	  success: (response) =>
	    @questions = response.data
	    @showQuestion(@index)

	  error: (response) =>
	    console.log response

	  showQuestion:(index)=>
	    @clearResponses()
	    @$scope.question = @questions[index]
	    @$scope.answers  = @questions[index].answers

	  nextQuestion:=>
	    @index = @index + 1 if @index + 1 < @questions.length
	    @showQuestion(@index)

	  prevQuestion:=>
	    @index = @index - 1 if @index > 0
	    @showQuestion(@index)

	  clearResponses:=>
	    @$scope.rightResponse = false
	    @$scope.wrongResponse = false

	MainCtrl.$inject = ["$scope", "$location", "webService"]
	app.controller "MainCtrl", MainCtrl

The lines at the top are particularly interesting as they use Browserify to load our dependencies. Also in the last two lines we use Angular’s in-built dependency injection system to declare our dependencies and finally register our controller.

Note that we are not directly making HTTP calls from the controller, just to main clean separation of concerns that Angular encourages. We use a service we created to make the calls for us.

Let us talk a bit about Angular services, these as the name suggest are the reusable, non-controller, non-dom-interacting components of our application. Angular also takes care that these services are lazily initialized and singletons. Let us look at our service that talks to our backend server to fetch the quiz questions -

	'use strict'

	require('angular/angular')

	class WebService

	  constructor: (@$http) ->
	    @baseUrl = "/api/v1/"

	  getQuestions: () ->
	    @$http.get(@baseUrl + "questions")

	webService = angular.module "quizApp.webService", []
	webService.factory "webService", ["$http", ($http) -> new WebService($http)]


Angular also provides a lot of services like $http out of the box which we inject as dependencies into our service. So how our app works right now is as follows - 

1. On the default route the MainCtrl is loaded
2. MainCtrl uses the web service to fetch questions from the user
3. Only the first question is loaded into the scope and therefore shown on the UI
4. The user can click the next / prev buttons to move between the questions, which are changed by chaging the scope

Finally, let’s add the feature so that the user can submit a response out of the given options and see the result back.

The main template has this code -

	<div class="jumbotron">
	  <h3>{{question.content}}</h3>
	  <li ng-repeat="answer in answers">
	    <input type="checkbox" ng-model="answer.selected">
	    <span>{{answer.answer_content}}</span>
	  </li>
	  <hr/>
	  <button class="btn btn-success" ng-click="submitResponse()">Answer</button>

	  <div class="alert alert-success" data-ng-show="rightResponse">Great! Right answer.</div>
	  <div class="alert alert-danger"  data-ng-show="wrongResponse">Sorry! Try again.</div>
	</div>
	<button class="btn btn-primary" ng-click="prevQuestion()">Prev</button>
	<button class="btn btn-info" ng-click="nextQuestion()">Next</button>

As you can see the “Answer” button uses the ng-click directive to call a function in our controller. Also, “answer.selected” is a scope model that is bound to the user selection. Within the controller, we can check the option selected by the user, and make a call to the backend to see if the selected option was right or not.

This function on the MainCtrl looks like - 

	submitResponse:=>
	  selected = _.filter(@$scope.answers, (a)-> a.selected)
	  selected_ids = _.map(selected, (s)-> s.answer_id)
	  promise  = @webService.postResponse(@questions[@index].id, selected_ids)
	  promise.then @showResult, @error

	showResult:(response)=>
	  @$scope.rightResponse = true if response.data.correct
	  @$scope.wrongResponse = true unless response.data.correct


To tie this all together, we will configure Browserify in our Grunt file with something like -

	browserify: {
	  dist: {
	    files: {
	      '<%= config.app %>/../.tmp/build/app.js': ['<%= config.app %>/../.tmp/scripts/**/*.js'],
	    }
	  }
	}

This will configure Browserify to minify all our JavaScript files into one file (app.js) and this is the only file we need to include in our HTML, which is a huge win over individually adding all the files in. This is specially useful for a medium to large Angular project where there may be around fifty individual files (all controller + services + directives), with Browerify configured you need just to include one and without it the fifty files need to be included manually.

The whole source code for the app is available at - [https://github.com/rocky-jaiswal/quizmaster](https://github.com/rocky-jaiswal/quizmaster). This also includes a Rails backend which provides some DB persistence as well. As you can see we created an application that has a few features and we had to write very little code. The code itself is clean, with nicely separated concerns and can be easily unit or integration tested.

Hope, this was a useful article to help you get to know Angular a bit better and to also use Browserify for dependency management. Together they can help you build performant, great looking application in no time and with clean code.

