--- 
title: "Accessing server data from a native Android app"
tags: Android, JavaScript, Rails, Phonegap, Backbone
date: 26/08/2012
---

This was a quite relaxing weekend, there was heavy rain in the Delhi region so there was not much to do. So I picked up a Scala book and read a few chapters. Soon enough, my hands started itching to write some code. I wanted to build something in Scala but ended up experimenting on Android.

Back at work, I finished my first iPad optimized jQuery Mobile and Rails app web application. I am mostly satisfied with the end result but somehow felt that a native app would have provided a better experience to the user. The question then comes is how to make a native app communicate with the server when most of the data needs to be fetched from the server itself.

So to build on this idea, I started making an Android application that fetches JSON data from a Rails server. To express myself clearly I wanted data to be accessible from a mobile app and a web app, like shown below -

![Mobile](/images/mobby_mobile.png "Mobile Version")
![Mobile](/images/mobby_web.png "Web Version")


The web app is a fully featured Mongoid enabled Rails application for which I have scaffoled a simple book model. I wanted the mobile version to also access the same data (in JSON format) and just display it in a Phonegapped native application. You can already see the end result in the images above. Lets look at the steps required to build this -

The first and the biggest problem you are bound to face is -

    XMLHttpRequest cannot load http://localhost:3000/books.json. Origin null is not allowed by Access-Control-Allow-Origin.

This is because the Android application is not running on the same server as the Rails application in fact it is not running on any server at all. Rails will interpret the incoming request and reject it as it assumes it is from a malicious source (remember CSRF).

To solves this problem we have to use [JSONP](http://en.wikipedia.org/wiki/JSONP). 

To organize our mobile application's JavaScript code we will use Backbone.js. Here is how the code looks like -

    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Mobby</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="js/libs/jquery-1.7.1.js"></script>
        <script src="js/libs/cordova-2.0.0.js"></script>
        <script src="js/libs/underscore.js"></script>
        <script src="js/libs/backbone.js"></script>
        <script src="js/libs/bootstrap.js"></script>
        <script src="js/plugins.js"></script>
        <script src="js/app.js"></script>
        <link rel="stylesheet" href="css/bootstrap.css">
        <link rel="stylesheet" href="css/bootstrap-responsive.css">
        <link rel="stylesheet" href="css/style.css">
      </head>
      <body>
        <header>
          <div class="navbar navbar-fixed-top">
            <div class="navbar-inner">
              <div class="container">
                <a class="brand" href="/">Mobby</a>
              </div>
            </div>
          </div>
        </header>
        <div class="container" style="padding-top: 50px">
          <p>Books</p>
          <div id="book"></div>
          <button class="btn btn-primary" type="button" id="btnRefresh" style="margin-top: 20px">Refresh</button>
        </div>
      </body>
    </html>  

And the JS code -

    $(function(){

      var Book = Backbone.Model.extend({
      });

      var BookList = Backbone.Collection.extend({
        model : Book, 
        url: 'http://10.0.2.2:3000/books.jsonp?callback=?', //Line 9
        parse: function(response) {
          return response;
        }
      });

      var books = new BookList();
      books.fetch();

      var BookView = Backbone.View.extend({
        el : $('#book'),
        render: function() {
          var bookList = '<ui>';
          _.each(this.model.models, function(book){
            bookList = bookList + '<li>' + book.get('title') + '<\/li>';
          });
          bookList = bookList + '<\/ul>';
          $(this.el).html(bookList);
          return this;
        }
      });

      books.on("reset", function() {
        var view = new BookView({model: books});
        view.render();
      });

      $("#btnRefresh").click(function() {
        books.fetch();
      });

      // Wait for Cordova to load
      document.addEventListener("deviceready", onDeviceReady, false);

      // Cordova is loaded and it is now safe to make calls Cordova methods
      function onDeviceReady() {
      }

    });

This is standard Backbone stuff, see my [older](/2012/05/25/intro_to_backbone_jQuery.html) post to get an introduction to Backbone. 

The important thing is on Line number 9. We are doing 2 things there, firstly using __10.0.2.2__ instead of __localhost__ beause that is how the emulator can access the host machine where the Rails server is running. Secondly, we are not doing a simple JSON request to the Rails server but doing a JSONP request.

Now, on the Rails side to need to deal with this new type to request and also wrap JSON back in a callback. Doing so for every individual request can be a pain but fear not there is a Gem available for this -

    gem 'rack-jsonp-middleware'

As the name suggests, this is a Rails middleware (consider it as a request filter if you are from the Java world) and to enable it we need to add this in application.rb -

    config.middleware.use Rack::JSONP

Our controller is untouched now -

    # GET /books
    # GET /books.json
    def index
      @books = Book.all

      respond_to do |format|
        format.html # index.html.erb
        format.json { render json: @books }
      end
    end

Rest of the magic is all on Backbone's side. Now if we make a change on the web application and hit the "Refesh" button on the mobile application we will get the updated data on the mobile view.

In my next blog (hopefully) I will cover editing of data on the mobile even when you are offline with eventual sych to the server and using "Cross-origin Resource Sharing" which is an essential security feature when accessing site data from multiple interfaces.
