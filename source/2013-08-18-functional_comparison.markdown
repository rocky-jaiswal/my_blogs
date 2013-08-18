--- 
title: "First Class Functions - Ruby, JavaScript & Scala"
tags: Ruby, CoffeeScript, Scala
date: 18/08/2013
---

This has been a good week, thanks to the public holiday calendar in India I got a six day break by taking a couple of days off in between a weekend and two national holidays.

So I utilized the time and rebuilt [http://biblefind.in](http://biblefind.in) with Scala and Angular.js. I spent a day also building a Ruby gem. The only thing missing was to write a blog to make this a productive holiday.

So in this small post let us look as "first class functions" or passing functions as arguments in the three languages I like __Ruby, JavaScript and Scala__.

Our idea is simple, we want to pass a function, two operands and the function on which will be applied on the operands. So if I pass 2, 3 and a product function I should get 6.

Let's start with Ruby -

    module Calculate
      def self.do(a, b, operation)
        operation.call(a, b)
      end
    end

    #execute it
    Calculate.do(2, 3, ->(a, b){a + b}) #5
    Calculate.do(2, 3, ->(a, b){a * b}) #6

Pretty decent, let's do this in JavaScript or rather in CoffeScript to avoid the prototype syntax -


    class Calculate
      @do: (a, b, operation) ->
        operation(a, b)
    
    #execute it
    Calculate.do(9, 3, (a, b) -> a + b) #12
    Calculate.do(9, 3, (a, b) -> a * b) #27

CoffeeScript and Ruby lambda's "stabby" syntax is quite similar, so similar that is messes with my head. I wish they were exactly same but then I am no authority to complain.

Finally, let's do this in Scala -

    object Calculate {
      def apply(a: Int, b: Int)(operation: (Int, Int) => Int) = {
        operation(a, b)
       }
    }

    //execute it
    def add(a: Int, b: Int) = { a + b }
    Calculate(2, 3)(add) //5

    //can we do better?
    //yes, create a partially applied, anonymous function
    Calculate(2, 3){ _ * _ } //6
    Calculate(2, 3){ _ + _ } //5

So we see Scala provides us more powerful constructs like partially applied functions but makes the code a bit cryptic to new-comers. Scala code is more verbose but then again it provides us with type safety.

Anyways, not to get into any language wars, I think all three languages are fun to work with and have really good frameworks for productivity. Happy programming.

    