--- 
title: "Unit Testing Backbone.js"
tags: Rails, Backbone
date: 23/11/2013
---

Hello from cold Berlin! After a couple of vagabond weeks it's good to back in my favorite city, hopefully for a long long time.

Back to technology and more specifically JavaScript. I have been talking a lot about organizing / writing better client side code and this discussion would not be complete without writing about client side JS unit testing. While it is definitely useful to write Cukes for overall integration tests of the interface, it is sometimes super useful to run a quick suite of client side JS tests.

Testing the client side JS has two big challenges - the DOM and the Server/HTTP calls as most of client side code is deeply integrated with the two. But the beauty of doing TDD or writing tests is that it takes you down the path of writing loosely coupled code and also you have the power of "mocks".

To explain things we will build a simple Rails app - a library management app. The slice we have is a webpage where the user is presented is with a list of books in the library and if he/she clicks on a book he/she can see its details.

![Berlin](/images/lib_backbone.png "Lib Backbone")

As usual the code for this blog is available on [github](https://github.com/rocky-jaiswal/libman-bb).

As expected we have two backbone views, one for the list of books and one for the details of the book, there is a book model in there somewhere. Lets start testing the JS code.

The first thing we need is a test runner or a setp where we can execute the test code. One option is to setup [Karma](http://karma-runner.github.io/0.10/index.html) for this. While Karma is really good, I found it hard to integrate it with the Rails asset pipeline. If you want to go down the Karma route you may want to ditch the Rails asset pipeline and go with a separate setup for client side code using a Grunt.js project. To serve the most common use case, lets go with the Rails asset pipeline option for this blog.

So for our test setup we will use [Konacha](https://github.com/jfirebaugh/konacha). It uses [Mocha](http://visionmedia.github.io/mocha/) which will be our testing framework and [Chai](http://chaijs.com/) as our assetion library. For mocking we will use the awesome [SinonJS](http://sinonjs.org/) via the 'sinon-rails' gem.

It is a little bit of work to set this all up so I recommend you read the Konacha [documentation](https://github.com/jfirebaugh/konacha) and refer to my github project in case you are stuck.

To start things of we look at a simple test which does not depend on DOM or server -

    #= require spec_helper

    describe "#maths", ->
      it "should know addition", ->
        expect(1 + 1).to.equal(2)

    describe "#mocking", ->
      it "should call the stubbed function", ->
        callback = sinon.stub().returns(42)
        expect(callback()).to.equal(42)

We just need to make [sinon stubs](http://sinonjs.org/docs/#stubs) our friends. Lets look at the test for a simple Backbone model -

    #model class
    class Libman.Models.Book extends Backbone.Model

      urlRoot: "/books"

    #spec for above
    #= require spec_helper

    describe "backbone#book model", ->
      it "returns the correct url root", ->
        book = new Libman.Models.Book()
        expect(book.urlRoot).to.equal("/books")

Simple enough, lastly we look at a complex view which uses the DOM and makes an AJAX call to load some data -

    class Libman.Views.BookListing extends Backbone.View

      el: "#book-listing"

      events:
        "click .show-book": "showBookDetails"

      initialize: ->
        @model.on('change', @showDetails, @)

      showBookDetails: (e) ->
        bookId = $(e.currentTarget).data("book-id")
        @model.set({id: bookId})
        @model.fetch()

      showDetails: ->
        new Libman.Views.BookDetails({model: @model})

This is a pretty standard Backbone view. It gets a model when initialized and on a certain event (clicking the book link) loads some data from the server and then initializes another view when the data in the model is changed.

So to unit test this we write this code -
  
    describe "backbone#book_listing view", ->

      beforeEach ->
        @model   = new Libman.Models.Book()
        @subject = new Libman.Views.BookListing({model: @model})

      it "shows the book details via backbone", ->
        fetchCallback = sinon.stub(@model, 'fetch')
        @subject.showBookDetails(sinon.stub())
        expect(fetchCallback.called).to.equal(true)

      it "makes an ajax call on fetch", ->
        sinon.stub(jQuery, "ajax")
        @model.set({id: 1})
        @model.fetch()
        expect(jQuery.ajax.calledWithMatch({ url: "/books/1" })).to.equal(true)

As evident, we stubbed the __fetch__ method of the model and jQuery's __ajax__ to get this unit test to work. This pretty much looks like server side rspec code and runs super fast from the server or from the command line (thanks to Konacha & PhantomJS). I hope this post will help you setup unit testing for your JS code. Happy programming!