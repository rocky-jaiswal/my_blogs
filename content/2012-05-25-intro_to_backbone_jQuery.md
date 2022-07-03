--- 
title: "A gentle introduction to Backbone with jQuery"
tags: JavaScript, Backbone
date: 25/05/2012
---

Backbone is a great JavaScript framework, I am sure most developers would have heard about it. I spent some time learning Backbone and want to share the little I have learned so far.

When you go to the backbone.js [page](http://backbonejs.org) it gives you a very nice view of Backbone's api and a very small introduction. This was a problem was for a thick guy like me, the Backbone introduction was not good enough and most importantly it didn't answer when and why should I use backbone.

After some Google searches, I learned that Backbone is good for organizing your JavaScript. As web developers we tend to do a lot of jQuery these days and more often than not jQuery can be pretty clean and decent. So why does one need Backbone? To answer this question lets build a small application in pure jQuery and then in Backbone + jQuery to see when and where Backbone helps.

Our app is very simple. I have made a Rails application and scaffolded a model called User with fields of name, age etc. For those of you who are not familiar with Rails, basically I have created CRUD operations on a model User and exposed them RESTfully.

I then created a few entries for the User model so that I have some data. Now to get started using jQuery, I built a form which has autocomplete so that it shows me the list of users as I type in a few characters in a text field. See image -

![jQuery UI Autocomplete](/images/autocomplete.png "Autocomplete")
![jQuery UI Autocomplete](/images/autocomplete_selected.png "Autocomplete")

I have used jQuery, jQueryUI and underscore.js libraries to do this. Here is the code -

    <h1>Find Users</h1>
    <form action="find" method="get">
      <input type="text" placeholder="Enter Name" id="user-input"/>
    </form>
    <div id="user-selection" style="margin-top:10px;"></div>

    <script>
      $(function() {
        function getNames() {
          var users = $.ajax({url : "/users.json", async: false});
          var names = _.map(JSON.parse(users.responseText), function(user){return user.name});
          return names;
        }
        
        var names = getNames();
        
        $("#user-input").autocomplete({
          source : names,
          minLength : 2,
          select: function(event, ui){
            $("#user-selection").html("Selected: " + ui.item.value);
          }
        });
      });
    </script>

Here we are basically using jQuery UI's autocomplete function and passing it the data source as a variable named "names", which we populate through an AJAX call (with Rails we get the server code free when we scaffold). Since the /users.json call retuns other associated data in the JSON we need to clean it up (it contains other fields such as age, last_updated_at etc.).

So we use the very good underscore.js library to convert this 

    [{"name":"rocky", "age:32", ...}, {"name":"annie", "age:31", ...} ...] 

to 

    ["rocky", "annie" ...] 

using the ["map"](http://underscorejs.org/#map) function. Please note that this is not the most efficient method for autocomplete as we are using AJAX to load all users in a JSON in one go but for our little experiment we will keep it this way.

Finally when the user makes a selection we give some feedback and display the selected value in a div using jQuery.

-----------------------------------------------

Now lets use Backbone to rewrite this code. With Backbone we get a MVC kind of structure to our application. Here is the new code

    <h1>Find Users</h1>
    <form action="find" method="get">
      <input type="text" placeholder="Enter Name" id="user-input"/>
    </form>
    <div id="user-selection" style="margin-top:10px;"></div>

    <script>
      $(function() {
        var User = Backbone.Model.extend({}); //Line 9

        var UserList = Backbone.Collection.extend({ //Line 11
          model: User,
          url: '/users.json',
          parse: function(response) {
            return response;
          }
        });

        var SelectionView = Backbone.View.extend({ //Line 19
          el : $('#user-selection'),
          render: function() {
            $(this.el).html("You Selected : " + this.model.get('name')); //Line 22
            return this;
          },
        });

        var users = new UserList(); //Line 26
        users.fetch({async: false});
        var userNames = users.pluck("name");

        $("#user-input").autocomplete({ //Line 30
          source : userNames,
          minLength : 2,
          select: function(event, ui){ //Line 33
            var selectedModel = users.where({name: ui.item.value})[0];
            var view = new SelectionView({model: selectedModel});
            view.render();
          }
        });
      });
    </script>


Don't worry if this looks too complicated. In 5 minutes, you will understand everything.

Firstly, there is no change in HTML. I have delibrately kept it that way.

- Lets start at line 9 - As evident our Model in MVC is User. We just declare a basic - Backbone Model.

- Line 11 - Backbone added a Collections object to MVC because most of the time we are dealing with a collection of Models. Here extend a Collection, give it the model User as it will be a collection of model User we declared above. We give it a 'url' from where this collection will be loaded and we provide a 'parse' function. This parse is called whenever we fetch data from the server which we do on line 27 and saves us any JSON cleanup.

- Line 19 - We declare a view here. For now ignore the code in there.

- Line 26 to 28 - Intialize the collection, load the data through AJAX and pluck the "name" field out from JSON. In our pure jQuery implementation we used underscore's "map" for this.

- Line 30 to 33 - No change from our pure jQuery implementation.

- Line 34 - Here using Collection.where function we fetch the model that was selected. The user selects a string so we have to do this.

- Line 35 - We instantiate our view and assign it the selected model.

- Line 37 - We render our view.

Let's now analyze our render function on line 22. this.model.get('name') will give you the selected model's name. We create a string by appending it with "You Selected : ".

We all know what $("#some-id").html() will do. So what is "el"? Basically, all Backbone Views have an el property which is the DOM element it is binded to. If not specified it is a 'div'. So we have binded our View to a div using a jQuery selector.

Talking of views we have manually set a string to be our HTML, this is ok for now but for more HTML Backbone also provides you with "templates" that can be compiled and added to your Views.

That's it, now our code is better and much more modular. I can see that you may not be impressed. In my example there is not a huge benefit by using Backbone. But imagine an app that loads multiple models on a page, uses AJAX to sync them and maybe listens to events and executes callbacks, all this leads to spaghetti code which is ugly and unmaintainable. That is where the benefit of MVC will kick in.

Also, if I had taken a bigger example it would have been difficult to explain it in one blog post. Probably that is why you don't see many simple examples of Backbone on the web.

We really have scratched the surface of Backbone here. For example, since our event was triggered by autocomplete we could not programmatically bind it for re-rending the view. But in case of clicking a button or a link (which are the most common events on the web) we could have easily saved some code by declartively binding the click of a button to a view's rendering.

I hope I have given you a small introduction to get started with Backbone. Please leave your comments for a better blog post next time.
