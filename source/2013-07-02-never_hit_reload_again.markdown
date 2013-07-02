--- 
title: "Never Hit Reload Again"
tags: JavaScript, GruntJS
date: 02/07/2013
---

Imagine a nice world where you have a dual monitor setup for web development. On one monitor you have your favorite editor open and in another the browser, even in a less than perfect world if you have a single screen with a good resolution you can have two windows open side by side.

Heck, even on a basic Dell laptop, you make a change in HTML or JS file, press Ctrl+S then Alt-Tab and Refresh you browser to see the change. __What if you can avoid this pain?__ :O

Now, that I have you interested, have I told you that I really like Grunt.js. It's an awesome task runner (kinda like make, rake etc.) built on top of node.js. Now, most of us don't use node.js as our server side platform but don't worry, you can still benefit from the awesomeness of Grunt.js.

Consider this, I am working on a Rails application (or a Java / .NET web application). Let's setup Grunt.js with minimum config.

First install node.js and npm (I think most of us have that).

Now install grunt-cli

    npm install -g grunt-cli

Now in your web application's root folder (Rails / Java / .NET), create a __package.json__ file with the following contents -

    {
      "name": "demo-app",
      "version": "0.0.0",
      "dependencies": {},
      "devDependencies": {
        "grunt": "~0.4.1",
        "grunt-contrib-watch": "*"
      },
      "engines": {
        "node": ">=0.8.0"
      }
    }

Simple enough, a couple of development dependencies, if you want you can put this in your .gitignore file.

Now do -

    npm install

This will download the node pacakges in a folder __node_modules__, gitignore it if you want.

Now create a file called __Gruntfile.js__ with the following contents -

    'use strict';

    module.exports = function (grunt) {

      grunt.loadNpmTasks('grunt-contrib-watch');

      grunt.initConfig({
        watch: {
          coffeefiles: {
            files: ['app/assets/javascripts/*.coffee'],
            options: {
              livereload: true,
            }
          },
          erbfiles: {
            files: ['app/views/{,*/}*.erb'],
            options: {
              livereload: true,
            }
          }
        }
      });
    }

This is a sample file for a Rails project. All I am saying is, create a __watch__ task so that if a *.coffee file or a *.erb file changes in a certain folder run __livereload__. For a Java or .NET project adjust the paths as you want.

In you main layout.html file or index.html file include this line of JavaScript -

    <script src="http://localhost:35729/livereload.js"></script>

Finally open a terminal and run -

    grunt watch

That's it, get back to your development process and __Never Hit Reload Again!__

