--- 
title: "Ajaxify a Form with Backbone"
tags: JavaScript, Backbone
date: 02/05/2013
---

I have been working a lot with [Yeoman](http://yeoman.io) lately and find it to be absolutely fabulous. It's make web development a real joy. With a few simple commands I can have a Backbone, Require.js and Twitter Bootstrap application ready. Also, instead to manually searching and downloading a JavaScript library it is so refreshing to run "bower install --save jquery-form" and you are done.

Anyways, in this short blog, I want to share a neat trick that I adopted to submit forms via AJAX in a web application. We will be using a few libraries for this most important of which is the [jquery form plugin](http://malsup.com/jquery/form/) which enables us to submit forms via AJAX.

I have a form lets say, which I want to AJAXify -

    <div id="app-home">
      <div class="row">
        <div class="large-4 columns">
          <form action="/greet" method="POST" id="greeting-form" data-ajax="true">
            <input type="text" placeholder="Your name please" name="username">
            <input type="submit" value="Say Hello" class="btn button">
          </form>
        </div>
      </div>
    </div>

Normally the flow looks like the images below -

![Ajax-1](/images/ajax-1.png "Ajax-1")
![Ajax-2](/images/ajax-2.png "Ajax-2")

Now with the help of a little bit of Backbone and jQuery Form plugin I can easily turn this into an AJAX enabled form -

    define ["backbone", "text!apps/home/templates/greetresponse.hbs"], (Backbone, responseTemplate) ->
      'use strict'
      
      class GreetingView extends Backbone.View
        
        el: "#app-home"

        events:
          "submit #greeting-form"  :  "handleSubmit"

        template: Handlebars.compile(responseTemplate)

        handleSubmit: (e) ->
          $form = $(e.currentTarget)
          if $form.data("ajax")
            e.preventDefault()
            $form.ajaxSubmit(success: @handleResponse, error: @handleError)

        handleResponse: (response, status, xhr, form) =>
          $(@el).html(@template(response))

        handleError: (respon![Automate](/images/automate.gif "Automate")se) =>
          alert response.responseText


Let me explain the code, behind the scenes we have initialized our Backbone View shown above and binded the "handleSubmit" function to the form submit event.

The handleSubmit function checks if the form has the "data-ajax" attribute and using the jQuery form plugin's API submits the form via AJAX. 

The server side code can look something like -

    def greet
      if request.xhr?
        render :json => {:name => params[:username]}.to_json and return
      else
        @name = params[:username]
      end
    end

The advantage of this approach is that the application will work even if JavaScript is disabled and also we can easily turn off AJAX by setting the "data-ajax" attribute to false in HTML, no JavaScript needs to change anywhere.

That's it using this simple method you can AJAXify your forms easily.

* Code is available on [Github](https://github.com/rocky-jaiswal/templateapp).