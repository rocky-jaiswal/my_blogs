---
title: "Classes and patterns Node.js"
tags: JavaScript
date: 30/04/2016
---

This week we had the awesome [Node.js 6.0.0 release](https://nodejs.org/en/blog/announcements/v6-release/)! With the 6.0.0 release Node.js has 93% of the ES6 features implemented. In this short post we will look at few particularly interesting features including "classes in JavaScript", while this aspect is a little bit controversial with the purists it nonetheless allows us to write some clean code.

If you want to install Node.js 6 easily I would recommend [n](https://github.com/tj/n). With __n__ setup, installing it was as easy as running (on a Debian based distro) - 

    sudo /home/rockyj/bin/n stable
    
We can now have a simple npm setup where we will demostrate some new Node.js features like classes, destructuring and default parameters and using them we will create the __Singleton__ and __Factory__ pattern. Here is the code -

_lib/singleton.js_

    class Singleton {
      constructor(initial) {
        this.seed = initial
      }

      increment() {
        return this.seed += 1
      }
    }

    const instance = new Singleton(0);

    module.exports = {
      instance: instance || new Singleton(0)
    }


_test/singleton_test.js_

    const Singleton = require('../lib/singleton')
    const assert = require('chai').assert

    describe('Singleton', function () {

      it('always has one instance', function () {
        const instance1 = Singleton.instance
        assert.equal(1, instance1.increment())
        assert.equal(2, instance1.increment())

        const instance2 = Singleton.instance
        assert.equal(3, instance1.increment())
      });

      it('always has one instance surely', function () {
        const instance3 = Singleton.instance
        assert.equal(4, instance3.increment())
      });

    });
    

_lib/factory.js_

    class Fenster {
      constructor({width = 10, height = 10} = {}) {
        this.width = width
        this.height = height
      }

      area() {
        return this.width * this.height
      }
    }

    function createFenster (options) {
      return new Fenster(options)
    }

    module.exports = createFenster
    
    
_test/factory_test.js_

    const createFenster = require('../lib/factory')
    const assert = require('chai').assert

    describe('Fenster', function () {

      it('creates an instance', function () {
        const f1 = createFenster()
        assert.equal(100, f1.area())
      });

      it('calculates the right area', function () {
        const f2 = createFenster({width: 20, height: 10})
        assert.equal(200, f1.area())
      });

    });
    
As evident with the code, Node.js just keeps getting better and better. One thing to note is ES6 modules/import/export are still not there because that could lead to a tons of npm packages being outdated / needing updates. So for now Node.js will stick to CommonJS module system. Hope this was useful, have a great weekend!
