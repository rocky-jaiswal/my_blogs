--- 
title: "Backbone.js and CoffeeScript - A Perfect Match"
tags: Backbone, JavaScript, CoffeeScript
date: 13/12/2012
---

As I started learning more about JavaScript I was very impressed with CoffeeScript. It felt like JavaScript done right! But with time, as my JavaScript concepts improved I was a bit reluctant to write CoffeeScript. "Why learn one language that produces another when you can write the end product directly?" Also, my head could do without another set of syntax and rules to learn.

However, when I started writing code for [Backbone.js](http://backbonejs.org/) a few months back, it dawned on me that CoffeeScript is a beautiful language and makes writing Backbone.js apps a much more pleasant experience.

But first of all, why did I need Backbone.js? I was happy writing jQuery, it was solving all my problems but then the interface and the callbacks got more complex and one day my JavaScript file had more than 200 lines of code. I was pretty sure this was going to be a maintenance headache no matter how well I name my functions and how many comments I add. So I refactored the code to Backbone.js and had a handful of small, cleanly coded files that were easy to test and modify. So that's that, a one line answer - we use Backbone.js to keep our JavaScript code clean.

Let's take a simple example, assume you have a button, clicking on which makes an AJAX call and displays the result from the AJAX call back in a div. This is a simple use case for a Backbone.js.

The JavaScript and Backbone.js code for this may look like -

    //<div id="container">
      //<input type="button" id="btn1" value="Go!"></input>
    //</div>
    //<span id="message"></span>

    $(function(){

      var ButtonBarView = Backbone.View.extend({

        el: '#container',

        events: {
          "click #btn1":  "makeAjaxCall"
        },

        makeAjaxCall: function(){
          console.log("making an ajax call ...");
          this.options.messageView.render("result from ajax call");
        }

      });

      var MessageView = Backbone.View.extend({

        el: '#message',

        render: function(message){
          var html = "<h3>" + message + "</h3>";
          this.$el.html(html); 
        }

      });

      var messageView = new MessageView();
      var buttonBarView = new ButtonBarView({messageView: messageView});

    });

Nothing much to explain here, we could have done the same thing using just jQuery but things go awry when there are ten such buttons on the screen each with its own AJAX call and DOM to update.

In the example above we create two Backbone views, on an event on the first one we render the second with the returned message.

Same thing written in CoffeeScript looks like this -

    $ ->

      class ButtonBarView extends Backbone.View

        el: '#container'

        events: 
          "click #btn1":  "makeAjaxCall"

        makeAjaxCall: ->
          console.log("making an ajax call ...")
          @options.messageView.render("result from ajax call")

      class MessageView extends Backbone.View

        el: '#message'

        render: (message) ->
          html = "<h3>" + message + "</h3>"
          $(@el).html(html)

      messageView = new MessageView()
      buttonBarView = new ButtonBarView({messageView: messageView})


To me the CoffeeScript code looks much more understandable and cleaner. But wait, do we see a "class" in the CoffeeScript code! How is that possible? And how does the "class" in CoffeeScript convert the code to the one written in JavaScript? Exploring this made me realize CoffeeScript's beauty and brevity.

To answer the first question, we need to understand a bit of JavaScript and CoffeeScript magic. JavaScript is an object oriented language but does not have classes, it uses the prototypal inheritance mechanism to extend objects. CoffeeScript uses this mechanism to give us classes, for example - 

This code -

    class Person

      constructor: (@name) ->

      printName: ->
        console.log("Name: " + @name)

    #rocky = new Person("Rocky")
    #rocky.printName(); 

Gets converted to something like this in JavaScript -

    var Person = (function() {

      function Person(name) {
        this.name = name;
      }

      Person.prototype.printName = function() {
        return console.log("Name: " + this.name);
      };

      return Person;

    })();
    
What this does is it returns us a "constructor" callback which can be used with the __new__ keyword to create objects. CoffeeScript also uses JavaScript's prototype mechanism to add methods to our object. However, the end user creates classes and methods like they do in their server side code. This is an AWESOME CoffeeScript feature that had me completely floored.

Now the second question, how does this -

    class MessageView extends Backbone.View

relate to this -

    var MessageView = Backbone.View.extend({})


To answer this lets see what happens to the CoffeeScript code when it gets converted to JavaScript -

    var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { 
      for (var key in parent) { 
        if (__hasProp.call(parent, key)) child[key] = parent[key]; 
      } 
      function ctor() { this.constructor = child; } 
      ctor.prototype = parent.prototype; 
      child.prototype = new ctor(); 
      child.__super__ = parent.prototype; 
      return child; 
    };

    var MessageView = (function(_super) {

      __extends(MessageView, _super);

      function MessageView() {
        return MessageView.__super__.constructor.apply(this, arguments);
      }

      return MessageView;

    })(Backbone.View);

Once again JavaScript has no built in inheritance support so we fake it using it's functional and prototypical features. The __extends__ function generated and called by CoffeeScript behind the scene enables us to "extend" our class from Backbone's View.

The end result is that Backbone code written in CoffeeScript is much more easier on the eye. In turn Backbone makes our JavaScript code much easier to maintain. So the combination of the two gives us code that is simple, clean and easy to maintain which is every developer's dream come true :)
