--- 
title: "Building HTML5 Apps with Yeoman and Backbone"
tags: JavaScript, Backbone
date: 11/05/2013
---

In my last few blogs I talked a bit about [Yeoman](http://yeoman.io). For me, working with Yeoman has been a real pleasure, so in this blog I will talk about building a small single page HTML5 application with Yeoman and [Backbone.js](http://backbonejs.org/).

The software we need for this exercise are -

- Node.js
- NPM
- Ruby
- Sass and Compass Gems for Ruby

Before we start a few words about Yeoman.

![Yeoman](https://raw.github.com/yeoman/yeoman.io/gh-pages/media/toolset.png "Yeoman")

If I were to explain Yeoman in a few words, it is a collection of three tools -

- Yo : for scaffolding apps
- Grunt: The JavaScript build tool
- Bower: Package / dependency management for client side JavaScript libs

So without further ado, let us install these tools -

    sudo npm install -g yo
    sudo npm install -g grunt-cli
    sudo npm install -g bower

If you are on Mac you may / maynot need the "sudo" command prefix.

To generate a backbone.js based application with Yo, we need to install the "backbone-generator"

    sudo npm install -g generator-backbone

There are a few community driven generators (for angular as well) you may want to check them out.

Now let us generate our project

    mkdir <my-app-name>
    cd <my-app-name>
    yo backbone --template-framework=handlebars

Select "Y" for Require.js support and Twitter Bootstrap with sass. And finally inside your application directory run -

    npm install
    bower install

To install all the npm (e.g. mocha) and bower packages (e.g. jquery) needed.

That's it. If your machine and network behaved well, you should have everything setup and you can now run -

    grunt server

The default app which says "Allo! Allo!" should be working now.

Great! We now have the default application up and working. You can go crazy from here or if you want you can read on a bit.

If you look at the index.html file, you can see that require.js loads the main.js file as the main JavaScript file (what a coincidence!) from which other JS files are loaded as required.

If you are a CoffeeScript lover like me you can convert the main.js file to main.coffee (using http://js2coffee.org maybe) to make it much more readable.

Next for our backbone setup, we can create the backbone folder structure in our scripts folder somewhat like this -

    - scripts
      - app
        - models
        - collections
        - router
        - templates
        - views

Since we will be using Handlebars.js for our client side templates, you need to run -

    bower install --save handlebars

That's it, Bower will download and install Handlebars.js in an appropriate location. Add the path for handlebars in the main.coffee file so that it can be used with Require.js. I have install "jquery-form" as well, so my main.coffee looks something like this -

    #global require
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

        handlebars:
          exports: "Handlebars"

      paths:
        jquery: "../bower_components/jquery/jquery"
        jquery_form: "../bower_components/jquery-form/jquery.form"
        backbone: "../bower_components/backbone-amd/backbone"
        underscore: "../bower_components/underscore-amd/underscore"
        bootstrap: "vendor/bootstrap"
        text: "../bower_components/requirejs-text/text"
        handlebars: "../bower_components/handlebars.js/handlebars"

    require ["backbone", "app/router/router"], (Backbone, AppRouter) ->
      router = new AppRouter()
      Backbone.history.start()

That's it! From here you can build your standard Backbone + Require.js application.

One of the main advantages of using Require.js with Yeoman is that once you run -

    grunt

It will create an awesome minified, unified, uglified build for you inside the dist/ directory which you can use in production. The final build has one css and one JS file for the entire application which is awesome.

Also, Grunt provides all the tools needed to test our application while building it(Karma, Mocha, Chai etc.).

One gotcha, by default Grunt will copile coffeescript files in script/ directory but not the coffee files in the sub-directories. To enable compilation of these files change the following lines in Gruntfile.js -

    //in watch/coffee config from - files: ['<%= yeoman.app %>/scripts/{,*/}*.coffee'], to
    files: ['<%= yeoman.app %>/scripts/**/*.coffee'],

    //and in coffee/dist/files from src: '*.coffee', to
    src: '**/*.coffee',

That's it. You have now a great Yeoman + Backbone setup. Code away!

Sample project with this setup is available on [Github](https://github.com/rocky-jaiswal/confi).
