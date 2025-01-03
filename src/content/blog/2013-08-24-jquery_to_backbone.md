--- 
title: "From jQuery sphagetti to Backbone MV*"
tags: Backbone, JavaScript, CoffeeScript
date: 24/08/2013
---

My current project is exciting, it is for enterprises but it has a potential to be a big hit. Sadly, I inherited PoC level code and had to make it production ready.

The Rails code is well written and tested but the client side code was a complete mess (parts of it still are). For example -

- All jQuery selectors for all pages in one file, 1000+ lines long, check. 
- A single Util JS file with 100 functions, 1000+ lines long, check. 
- Monkey patched core JS Objects, check.
- JS inline in HTML file, check.
- Ajax calls inside JS manifest files (Rails), check.

Me and my team could not have fixed the entire codebase in one go. So we followed the boy scout rule, leave the codebase cleaner than before, every time you visit it.

So here are a few stories worth sharing from this ongoing journey.

Like I mentioned, we had all jQuery selectors written in one file. It felt like a huge cost that every single page was firing or checking for hundreds of selectors of which it probably needed only one. 

So my first plan of action was to check if a selector was present and then take the necessary action. For example we had -


    $( "#something" ).click(function() {
      //do something here
    });

    $( "#somethingElse" ).click(function() {
      //do something else here
    });

and hundreds of selectors like this in one file. So we refactored the code so that the entire application's client side code has a single point of entry -

    window.MyApp =
      Models: {}
      Collections: {}
      Views: {}
      Routers: {}
      Utils: {}

      init: ->
        mapping =
          "#something":           MyApp.Views.SomeView
          "#somethingElse":       MyApp.Views.AnotherView
        
        for selector, view of mapping
          if $("body").has(selector).length isnt 0
            view = new view()

    $(document).ready ->
      MyApp.init()

In this case each selector gets a view. Inside the view we have all the Backbone power to manage the DOM, handle events and structure code.

The view itself could look something like (in a separate file, ofcourse) -

    #some_view.coffee
    class MyApp.Views.SomeView extends Backbone.View

      el: ".container"

      events:
        "click a.#something":    "handleAdd"

      initialize: ->


      handleAdd: (e) ->
        #do something here

Similarly, an AJAX call like this -

    $('.item_select').change(getComponent);

    function getComponent(){
      $.ajax({
        url: $(this).attr('data-url'),
        data: {
          unit_id : $(this).val()
        }
      }).done(doSomething);
    }

Becomes -
    
    #Model File
    class MyApp.Models.SomeItem extends Backbone.Model

    #Collection File
    class MyApp.Collections.SomeItems extends Backbone.Collection

      model: MyApp.Models.SomeItem

    
    #View File
    class MyApp.Views.ItemSelectionView extends Backbone.View

      el: ".container"

      events:
        "change .item_select":    "handleChange"

      initialize: ->
        url = $(".item_select").data("url")
        id = $(".item_select").val()
        @coll = new MyApp.Collections.SomeItems({}, {url: url})
        @model = new MyApp.Models.SomeItem({id: id}, {collection: @coll})

      handleChange: (e) ->
        @coll.fetch({success: @handleSuccess})

      handleSuccess: (collection, response, options) =>
        #do something here

All these changes make the code more structured, maintainable and dryer. My plan is to move the selectors from the big JS file to approprite views, extract reusable components and refactor the big Util JS file to manageable chunks. Let's see how it goes.