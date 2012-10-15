--- 
title: "Why does JavaScript require Require.js"
tags: JavaScript, CoffeeScript
date: 15/10/2012
---

Around a week back I started learning about Require.js after someone recommened it to me. When I looked at the [website](http://requirejs.org/) I was not very impressed. My initial reaction was "**what is require.js trying to solve / why should I use it / how will it make my life better?**"

I simply moved on, but I also realized that as we are writing more and more JavaScript these days, we need to organize it better. In OO languages such as Java and Ruby we organize code by putting it in classes and maybe having a policy of one class per file, then we load the classes in other classes via dependency loading mechanisms built into the language (like import / require).

JavaScript although being OO has no classes, via CoffeeScript we can still create classes in JavaScript by leveraging the prototype mechanism in JavaScript (but that is perhaps another blog topic) but as our JS code gets bigger how do I organize it and manage dependencies. So I started searching the web for ways to do so. My search led me [here](http://addyosmani.com/largescalejavascript).

To summarize the article, one of the most common ways to orgainize JS code is through object literals -
    //apple.js
    var apple = {
      type: "macintosh",
      color: "red",
      getInfo: function () {
          return this.color + ' ' + this.type + ' apple';
      }
    }
    //console.log(apple.color)

Put a literal in a file and load it in your html. This is the stating point for most developers. Another popular mechanism which kind of builds upon this is Modules -

    var basketModule = (function() {
      var basket = []; //private
      return { //exposed to public
        addItem: function(values) {
          basket.push(values);
        },
        getItemCount: function() {
          return basket.length;
        },
        getTotal: function(){
          var q = this.getItemCount(),p=0;
          while(q--){
            p+= basket[q].price; 
          }
          return p;
        }
      }
    }());

The advantage of the module pattern is that unlike literals you can expose certain things (what is returned) while some things can be private (like the basket array in example above).

Cool so we have some basic ways to organize our JavaScript, however how do we load these JavaScripts and how do we manage the dependencies. Usually we do it this way -

    <script src="Module1.js"></script>
    <script src="Module2.js"></script>
    <script src="Module3.js"></script>
    <script src="Module4.js"></script>
    <script src="Module5.js"></script>
    <script src="Module8.js"></script> <!-- want to use 6 in 8... -->
    <script src="Module6.js"></script>
    <script src="Module7.js"></script>
    <script src="Module8.js"></script>
    <script src="app.js"></script>

This is horrible, we load the JavaScript files in HTML and manually order them. If tomorrow things change we have to manually change the order or add or remove files. This is definitely not the way to build good software. Rails asset pipelining tries to solve this but there is still no way to manage JS dependencies.

**Require.js** addresses this exact problem. 

[AMD](https://github.com/amdjs/amdjs-api/wiki/AMD) is a specification which JavaScript developers created and proposed so that the JavaScript dependency management and loading problem is addressed across all JS libraries. Require.js is an impelementation of this specification. We create modules like above but we follow certain syntax to load the dependencies -

    //my shirt.js now has some dependencies, a cart and inventory
    //module in the same directory as shirt.js
    define(["./cart", "./inventory"], function(cart, inventory) {
        //return an object to define the "my/shirt" module.
        return {
          color: "blue",
          size: "large",
          addToCart: function() {
            inventory.decrement(this);
            cart.add(this);
          }
        }
      }
    );

define() is the main function require.js provides, we use it to define a module, we first pass an array of dependencies for the module then a function to define the module. We also follow the one module per file policy

Another simple example (in CoffeeScript) would be to place the following code in a file common.coffee

    define [], ->
  
      # What is the enter key constant?
      ENTER_KEY: 13

Now whenever you want to use the "common" module just include it as a dependency (like cart in example above).

Finally in our HTML we need to just reference one JavaScript file (please see comments in code below) -

    <head>
        <title>My Sample Project</title>
        <!-- data-main attribute tells require.js to load scripts/main.js after require.js loads. -->
        <script data-main="scripts/main" src="scripts/require.js"></script>
    </head>

In your main.js file you can use require() function to load the JavaScripts. Example Backbone setup -

    require([
      'views/app',
      'routers/router'
    ], function( AppView, Workspace ) {
      // Initialize routing and start Backbone.history()
      new Workspace();
      Backbone.history.start();

      // Initialize the application view
      new AppView();
    });

That is it! After this the other modules will load their dependencies on their own (since they are "defined" via require.js).

Finally since some libs are not using define() like jQuery / Backbone how do we load them. The answer lies in [shims](http://requirejs.org/docs/api.html#config-shim).

For a sample project that uses Require.js, Backbone.js, jQuery and CoffeeScript see - [this](https://github.com/rocky-jaiswal/todo-js).
