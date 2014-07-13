--- 
title: "GruntJS, CoffeeScript and Browserify"
tags: Rails, Backbone
date: 13/07/2014
---

I usually write my JavaScript with CoffeeScript, it makes it look a lot cleaner and CoffeeScript also adds some nice syntactic sugar. Another common issue I face is organizing JS code about which I have written a few blogs already. Lately, I also read about [Browserify](http://browserify.org/) and it seemed like a really interesting way to organize JS code.

In this short blog, I will walkthrough the code / config I wrote to integrate Browserify with my GruntJS + CoffeeScript + Backbone application. First of all, a short introduction to Browserify - when we write server side code with JS, the code organization is nicely maintained with modules which reside in separate files. With CoffeeScript you can use a class per file convention, export it and require it, which is pretty nice.

For example -

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

Now imagine, having the same power available for client side JS, wouldn't that be awesome! Actually, this is what Browserify provides.

Browerify can also be [integrated](https://github.com/jmreidy/grunt-browserify) with GruntJS which is great for building and developing apps. To integrate with a standard Gruntfile one can add something like this -

    browserify: {
      dist: {
        files: {
          '<%= config.app %>/../.tmp/build/app.js': ['<%= config.app %>/../.tmp/scripts/**/*.js'],
        }
      }
    }

My build works like - CoffeeScript files in app/script get transpiled to .tmp/scripts, from where they are picked up by Browserify to be bundled into .tmp/build/app.js. This is the only file I reference in my HTML. One thing we are missing is - watch integration, i.e. whenever I change my CoffeeScript code, I want the transpilation and bundling to happen. We can fix this by integrating the browserify task in the watch -

    watch: {
        bower: {
            files: ['bower.json'],
            tasks: ['bowerInstall']
        },
        coffee: {
            files: ['<%= config.app %>/scripts/{,*/}*.{coffee,litcoffee,coffee.md}'],
            tasks: ['clean:js', 'coffee:dist', 'browserify']
        },
        // and other tasks ...

Please note that Browserify also provides support for CoffeeScript tranpilation but we have used GruntJS for that.

To install packages in a Gruntified project we can do -

    npm install browserify --save
    npm install jquery --save
    npm install backbone --save

NPM also takes care of dependency management. The important thing to note is that we have used server side packages for jQuery / Backbone and installed them via npm and not via Bower.

Finally some working code -

index.html

    <div id='main'>
      <h1>'Allo, 'Allo!</h1>
      <button type="button" id="mainBtn"/>Say Allo!</button>
    </div>
    <script src="build/app.js"></script>

Coffee code -

    #main.coffee
    $        = require('jquery')
    MainView = require('./main_view')

    $ ->
      mainView = new MainView()


    #main_view.coffee
    $           = require('jquery')
    Backbone    = require('backbone')
    Backbone.$  = $

    class MainView extends Backbone.View

      el: $('#main')

      initialize:->
        console.log "view is initialized ..."

      events:
        "click #mainBtn"  :  "sayAllo"

      sayAllo:->
        console.log "you said allo!"

    module.exports = MainView


That is it! We have jQuery, Backbone, Browserify and GruntJS setup. As soon as we change a CoffeeScript file the whole transpilation, bundling just works as we have GruntJS doing the job for us. The code itself is pretty modular, clean and testable. I think Browserify is pretty cool and I plan to use it in my future projects.