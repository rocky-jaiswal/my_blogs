--- 
title: "Structure JavaScript with Backbone"
tags: JavaScript, CoffeeScript, Backbone
date: 19/07/2013
---

These days I find myself saying *"structure the JavaScript code better"* a lot. Also, some of my friends assume that Backbone.js or Angular.js are only good for Single Page Applications. Since most applications work using server side templating and having a JavaScript file or so per page, most developers (including me at one time) consider using a framework an overkill since they don't need things like client templates or "#/" based routing.

However, I think that these days we write more client side code than on the server and while on the server we have all sorts or frameworks to structure our code, our client side code leads a lot to be desired. In fact, most client side code I see is a spaghetti, which is hard to maintain and debug if the original developer is not present.

So to put my money where my mouth is, in this blog I will propose a simple way to structure a jQuery only JavaScript code with Backbone (and Require.js).

Let's say I have an application which has a dozen or so pages each with a simple graph. I begin to write my HTML like this -

    <!doctype html>
    <html class="no-js">
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>Demo</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width">
        <link rel="stylesheet" href="styles/main.css">
        <script src="bower_components/modernizr/modernizr.js"></script>
        <script src="bower_components/jquery/jquery.min.js"></script>
        <script src="bower_components/chartjs/chart.min.js"></script>
        <script src="scripts/jq-only/chart1.js"></script>
      </head>
      <body>
        <div class="container">
          <div class="row">
            <div class="span12">
              <h3>Some Chart:</h3>
              <canvas id="chart-1" width="800" height="600"></canvas>
            </div>
          </div>
        </div>
      </body>
    </html>

My code to draw the graph is written as *chart1.coffee* -

    $ ->

      getMonths = ->
        ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]
      
      getData = ->
        data =
          labels: getMonths()
          datasets: [
            fillColor: "rgba(220,220,220,0.5)"
            strokeColor: "rgba(220,220,220,1)"
            data: [65, 59, 90, 81, 56, 55, 40]
          ,
            fillColor: "rgba(151,187,205,0.5)"
            strokeColor: "rgba(151,187,205,1)"
            data: [28, 48, 40, 19, 96, 27, 100]
          ]

      ctx = $("#chart-1")[0].getContext("2d")
      new Chart(ctx).Bar(getData(),{})

This is all fine and self explanatory, but I have 20 pages like these so there are 20 coffee files, each for a graph. The logic in the graphs keeps getting complex as we (let's say) fetch data from the server and after a while each of these coffee files get big.

Also, one may load all JS file in the index.html page if there is some sort of templating engine being used, which leaves another developer guessing which coffee file is for which graph. A page may need three graphs so one of these coffee files gets crazy and all sorts of problems come up.

To deal with this, we need some sort of structure in place. Can Backbone.js help us? The answer is yes.

Instead of loading many js files in a page, all we need to do is use Require.js and add this line in our HTML -

    <script data-main="scripts/main" src="bower_components/requirejs/require.js"></script>

In our main.coffee file, we setup the Backbone and jQuery shims -

    "use strict"

    require.config
      shim:
        underscore:
          exports: "_"

        backbone:
          deps: ["underscore", "jquery"]
          exports: "Backbone"

        bootstrap:
          deps: ["jquery"]
          exports: "jquery"

      paths:
        jquery: "../bower_components/jquery/jquery"
        backbone: "../bower_components/backbone-amd/backbone"
        underscore: "../bower_components/underscore-amd/underscore"
        bootstrap: "vendor/bootstrap"

    require ["./app"], (App) ->
      $ ->
        App.init()

Now, some magic happens in app.coffee -

    define ["../scripts/backbone/chart1view", "../scripts/backbone/chart2view"], (Chart1View, Chart2View) ->
      'use strict'

      class App

        config = 
          "#chart-1": Chart1View
          "#chart-2": Chart2View

        @init: () ->
          for selector, view of config
            if $("body").has(selector).length isnt 0
              view = new view({el: selector})
              view.render()

Here we check if the body has a particular selector and initialize the Backbone view accordingly.

The Backbone view utilizes the jQuery code we created earlier -

    define ["jquery", "underscore", "backbone"], ($, _, Backbone) ->
      'use strict'
      
      class Chart1View extends Backbone.View
        
        initialize: ->

        getMonths: ->
          ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]

        getData: ->
          data =
            labels: @getMonths()
            datasets: [
              fillColor: "rgba(220,220,220,0.5)"
              strokeColor: "rgba(220,220,220,1)"
              data: [65, 59, 90, 81, 56, 55, 40]
            ,
              fillColor: "rgba(151,187,205,0.5)"
              strokeColor: "rgba(151,187,205,1)"
              data: [28, 48, 40, 19, 96, 27, 100]
            ]

        render: ->
          ctx = @$el[0].getContext("2d")
          new Chart(ctx).Bar(@getData(),{})

That's it. Now to add a chart, all we need to do is to add it's configuration in app.coffee and create it's Backbone view. To me this simple design change makes the code much more maintainable / clean and we have used Backbone to add structure to our JavaScript successfully. Mission accomplished.