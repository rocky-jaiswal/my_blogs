---
title: "ES6 with Babel & Grunt"
tags: JavaScript
date: 24/05/2015
---

The JavaScript ecosystem can get pretty overwhelming at times - multiple build/task runners, numerous transpilers, varied browser/server runtime environments and let's not even talk about frameworks. With [ES6](http://en.wikipedia.org/wiki/ECMAScript#Harmony.2C_6th_Edition) around the corner, I hope that things settle down a bit. So for new projects I believe it may be the right time to switch from my favorite CoffeeScript transpiler to ES6, since that would mean that with time no transpilation will be needed while enjoying most of CoffeeScript benefits (hurray!).

[Babel](https://babeljs.io/) is my preferred tool for dealing with all things ES6. Two of my favorite things about ES6 are modules and classes, with these two changes it gets a lot easier to write clean manageable code. In this post we will look at how we can use Babel and Grunt to use these two features for both the server and the browser.

###Server Side

Most of this post is code, since I assume that Grunt and ES6 are known concepts to you. For a simple gruntified app, you would need something like the following setup -

package.json

    {
      "devDependencies": {
        "grunt": "~0.4.5",
        "grunt-babel": "~5.0.0",
        "load-grunt-tasks": "~3.2.0",
        "mocha": "~2.2.5",
        "grunt-mocha-test": "~0.12.7",
        "chai": "*",
        "grunt-execute": "~0.2.2",
        "grunt-contrib-clean": "~0.6.0"
      },
      "dependencies": {
        "lodash": "~3.9.0"
      }
    }

gruntfile.js

    module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);
    grunt.loadNpmTasks('grunt-execute');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.initConfig({

      clean: ["dist"],

      babel: {
        options: {
          sourceMap: false,
          modules: "common"
        },
        dist: {
          files: [{
            expand: true,
            cwd: 'src',
            src: ['**/*.js'],
            dest: 'dist/src',
            ext:'.js'
          }]
        },
        distSpecs: {
          files: [{
            expand: true,
            cwd: 'spec',
            src: ['**/*.js'],
            dest: 'dist/spec',
            ext:'.js'
          }]
        }
      },

      mochaTest: {
        test: {
          options: {
            reporter: 'spec'
          },
          src: ['dist/spec/*_spec.js']
        }
      },

      execute: {
        target: {
          src: ['dist/src/app.js']
        }
      }

    });

    grunt.registerTask('default', ['clean', 'babel', 'mochaTest', 'execute']);
    };

The main task above is 'babel', since we are writing server side JS we want to use the "commonjs" module system. With Babel we can use both traditional JS modules and ES6 classes without any extra code.

Our entrypoint, app.js -

    import Greeter from "./greeter"
    import adder   from "./adder"

    var greeter = new Greeter("World");
    console.log(greeter.greet());
    console.log(`Did you know that 2 + 2 = ${adder.add(2, 2)}`)


A traditional JS module, adder.js -

    import _ from "lodash";

    var adder = (function(){
    return {
      add: function(...nums){
        return  _.reduce(nums, (memo, num)=>{ return memo + num; }, 0);
      }
    };
    })();

    export default adder;

As you can see, we can also import external libs like lodash in ES6 format.

Our ES6 class, greeter.js -

    export default class Greeter {

      constructor(name){
        this.name = name;
      }

      greet(){
        return `Hello ${this.name}!`;
      }
    }

Use can also simplify our test setup this way.

greeter_spec.js

    import Greeter from "../src/greeter"
    import _       from "lodash";
    import chai    from "chai"

    describe('Greeter', function(){
      var greeter = new Greeter("World");
      var expect  = chai.expect;

      it('greets with a string', function(){
        expect(_.isString(greeter.greet())).to.equal(true);
      });

      it('greets eveyone appropriately', function(){
        expect(greeter.greet()).to.equal('Hello World!');
      });

    });

If we run __grunt__, we get our code above transpiled, tested and executed. Pretty neat, eh?

###Client side

With client side the setup is slightly trickier, we also need to setup require.js since we need a module loading system that works on the browser (browserify may also work if that is your thing).

A minimal AMD / require.js setup could look like -

    <!doctype html>
    <html class="no-js">
      <head>
        <meta charset="utf-8">
        <title>Mazerunner</title>
        <link rel="stylesheet" href="dist/styles/main.css">
      </head>
      <body>
        <div class="container">
        </div>

        <script src="bower_components/requirejs/require.js"></script>
        <script>
          requirejs.config({
            "paths":{
              "jquery":     "bower_components/jquery/dist/jquery",
              "underscore": "bower_components/underscore/underscore"
            }
          });
          requirejs(['dist/src/app'], function (app) {});
        </script>
      </body>
    </html>

app.js -

    import $       from 'jquery';
    import Greeter from './greeter';

    $(function(){
      var greeter = new Greeter("World");
      $(".container").html(greeter.greet());
    });

The gruntfile will need some changes to transpile AMD js modules -


    module.exports = function(grunt) {

      require('load-grunt-tasks')(grunt);
      grunt.loadNpmTasks('grunt-execute');
      grunt.loadNpmTasks('grunt-contrib-clean');
      grunt.loadNpmTasks('grunt-contrib-copy');

      grunt.initConfig({

        clean: ["app/dist"],

        babel: {
          options: {
            sourceMap: false,
            modules: "amd"
          },
          dist: {
            files: [{
              expand: true,
              cwd: 'app/src',
              src: ['**/*.js'],
              dest: 'app/dist/src',
              ext:'.js'
            }]
          },
          distSpecs: {
            files: [{
              expand: true,
              cwd: 'app/specs',
              src: ['**/*.js'],
              dest: 'app/dist/specs',
              ext:'.js'
            }]
          }
        },

        sass: {
          dist: {
            files: [{
              expand: true,
              cwd: 'app/styles',
              src: ['*.{scss,sass}'],
              dest: 'app/dist/styles',
              ext: '.css'
            }]
          }
        },

        copy: {
          main: {
            expand: true,
            cwd: 'app/assets/',
            src: '**',
            dest: 'app/dist/assets/',
            flatten: true,
            filter: 'isFile'
          }
        }

      });

      grunt.registerTask('default', ['clean', 'babel', 'sass', 'copy']);
    };

Run __grunt__ and you have working client side code. We can also add a lot of goodies to our gruntfile to make tranpilation, minification etc. easy and building a kickass ES6 application.
