---
title: jQuery flavored CoffeeScript
tags: JavaScript, CoffeeScript
date: 01/12/2011
---

After much discussion, Rails 3.1 included CoffeeScript by default. The inclusion of CoffeeScript in Rails is a testament of the quality and popularity of CoffeeScript.

So in a Rails 3.1 application if you do - 
    bundle exec rails g controller Pages home

You get an output like the following - 
    create  app/controllers/pages_controller.rb
          route  get "pages/home"
          ...
          invoke  assets
          invoke    coffee
          create      app/assets/javascripts/pages.js.coffee

As you can see from the output above Rails will generate a .coffee file for you with the controller.

CoffeeScript is a beautiful language and enables you to write clean code and escape the nuances of JavaScript. 

A function declaration in CoffeeScript is as simple as 

    greeter = -> "Hello World!"

The two keys in CoffeeScript "-" and ">" are enough to declare a function in JavaScript.

With these things in mind, I decided to write jQuery code in JavaScript. After all, if we intend to write JavaScript for our web application there is no escaping jQuery.

Lets say our haml/html is like
    %h1 Hello World!
    = link_to "Click Me", "#", {:id => "click_me_link"}
    .message{:style => "visibility:hidden"}
    	Say hello to my new friend!

Which renders to -
![coffee](/images/hello_coffee.jpg)

Nothing much going on here. To test jQuery, all we need to write is -

    $ -> alert("jQuery works!")

That's it!!

this translates to - 

    $(function() {
        return alert("jQuery Works!!");
      });

So in CoffeeScript, intializing jQuery amounts to writing **"$ ->"**

Now let's write a simple function to make a hidden div visible.

    $ -> $("#click_me_link").click(show_message)
    show_message = -> $(".message").css("visibility", "visible")

this converts to -

    $(function() {
        return $("#click_me_link").click(show_message);
      });

      show_message = function() {
        return $(".message").css("visibility", "visible");
      };

The CoffeeScript code above is pretty clean and self explanatory. The most important thing is that I have just written two lines of **clean** code (it can even be compressed to one), this typically converts to 6 lines of JavaScript (even if we forget the curly braces and the parentheses).

So go forth my friend and write your JavaScript code in CoffeeScript and make your life simpler!
