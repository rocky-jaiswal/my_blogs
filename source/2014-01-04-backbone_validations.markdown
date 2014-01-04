--- 
title: "Client side validation with Backbone.js"
tags: Rails, Backbone
date: 04/01/2014
---

Happy 2014 everyone! May the new year bring you great happiness and lots of programming fun. I myself had an eventful 2013 and really hope that 2014 is less dramatic and more relaxing, now that I am in a great [city](http://www.visitberlin.de/en) and a very nice country (which was my dream for a long time).

Back to technology, client side validation is a nice little feature that improves the user's experience and saves some valuable bandwidth. To kick things off in the new year we will look at how we can use Backbone.js to add some simple client side validation.

For our experiment, the code for which is available on [github](https://github.com/rocky-jaiswal/experimento) we have a simple user registration form. We want to ensure that the -

- user has entered a valid email
- the password is atleast 6 characters long and 
- the password confirmation matches the password entered earlier.

![sign_up](/images/sign_up.png "Sign Up")

Backbone out of the box does provide us two methods that we can use for validation (__validate__ and __isValid__). Let us see the code of the form's Backbone view -

    'use strict'
    define ["jquery", "underscore", "backbone", "../models/user"], ($, _, Backbone, User) ->
      class SignInView extends Backbone.View

        events:
          "submit #sign-up-form"  : "handleSubmit"

        initialize: () ->
          @model = new User()
          @model.on("invalid", @handleError) 

        handleSubmit: (e) ->
          e.preventDefault()
          user = 
            email: $("#user_email").val()
            password: $("#user_password").val()
            password_confirmation: $("#user_password_confirmation").val()
          @model.set(user)
          e.currentTarget.submit() if @model.isValid()

        handleError: (model, error) =>
          $(".validation-error").html("✗ " + error.msg)

And the model itself -

    'use strict'
    define ["jquery", "underscore", "backbone"], ($, _, Backbone) ->
      class User extends Backbone.Model

        validate: (attrs, options) ->
          return {msg: "Email is not valid"} unless((attrs.email).match(/@/))
          return {msg: "Password has to be 6 characters long"} unless(attrs.password.length > 5)
          return {msg: "Password confirmation does not match"} unless(attrs.password_confirmation is attrs.password)

Basically, all we needed to do was to override the validate method of the model and check if the model is valid before submitting the form. If the model is invalid, an "invalid" event is triggered which we can listen to and take desired action.

This is reasonably good but can we do better, I guess two things that can be improved are -

1. Make the validations more declarative, not the if/else/unless mess.
2. More reusable validations like Rails.

Luckily, there is a Backbone plugin that can help us - [Backbone Validation](http://thedersen.com/projects/backbone-validation/). Let's see how the code looks after using this plugin.

    'use strict'
    define ["jquery", "underscore", "backbone", "../models/user", "backbone_validation"], ($, _, Backbone, User, BackboneValidation) ->
      class SignInView extends Backbone.View

        events:
          "submit #sign-up-form"  : "handleSubmit"

        initialize: () ->
          @model = new User()
          Backbone.Validation.bind(@, {invalid: @handleInvalid}) 

        handleSubmit: (e) ->
          e.preventDefault()
          $(".validation-error").html("")
          user = 
            email: $("#user_email").val()
            password: $("#user_password").val()
            password_confirmation: $("#user_password_confirmation").val()
          @model.set(user)
          e.currentTarget.submit() if @model.isValid(true)

        handleInvalid: (view, attr, error, selector) =>
          $(".validation-error").append("✗ " + error + "<br/>")


And now the model has its validations declared as config -

    'use strict'
    define ["jquery", "underscore", "backbone"], ($, _, Backbone) ->
      class User extends Backbone.Model

        validation:
          email:
            pattern: 'email'
          password:
            length: 6
          password_confirmation:
            equalTo: 'password'

This is a bit better, we have a set of reusable / built-in validations and we have avoided the if/then/unless mess. So that is all folks, have a great year ahead.