--- 
title: "The quest for better code"
tags: Ruby, Scala
date: 30/09/2013
---

I am largely dissatisfied with code that I usually write. Usually I write a working version, then a cleaner working version and then finally a cleaner Object Oriented working version. Obviously this takes some time but more on that later. Lately, I found Sandi Metz's rules to be quite practical and reasonable. These are -

1. Classes can be no longer than one hundred lines of code (I would even say sixty).
2. Methods can be no longer than five lines of code.
3. Pass no more than four parameters into a method. Hash options are parameters.
4. Controllers can instantiate only one object. Therefore, views can only know about one instance variable.

These are great principle and I think if you combine them with [SOLID](http://en.wikipedia.org/wiki/SOLID_(object-oriented_design)) principles and some functional ones (like immutability and no-side effects) you can write great code.

So I try to apply these principles in the code I write now. Being a Scala learner, I am also impressed by it's functional nature and things like [Option](http://www.scala-lang.org/api/current/index.html#scala.Option), which simply put, saves you from null (or nil) checks. For example in Scala -

    case class User(id: Int, name: String, age: Int)

    object UserRepository {
      private val users = List(User(1, "Rocky", 34), User(2, "Annie", 33))
      def findById(id: Int): Option[User] = users.find(u => u.id == id)
    }

    UserRepository.findById(2).map{u => u.name}.getOrElse("Not Found")
    //returns "Annie"
    UserRepository.findById(3).map{u => u.name}.getOrElse("Not Found")
    //returns "Not Found"

So in the example above, I did not have to check that my User returned is null or not.
Usually this will take 2-4 line of code if written in an imperative style. Check for null and do an action and do another action in case a null value is returned.

More on Options [here](http://danielwestheide.com/blog/2012/12/19/the-neophytes-guide-to-scala-part-5-the-option-type.html).

Back to Ruby, this is some code that I wrote lately -

    def get_recent_tweets_from_favorites(current_user)
      tweets = []
            
      if current_user
        favs = current_user.get_favs
      else
        favs = system_favs
      end

      favs.each do |fav|
        tweets << get_last_three_tweets(fav)
      end
      tweets
    end

While this is a relatively simple 4-5 liner method, the actual LoC are 10 when you include the _if_ and _each_. This makes me a sad panda. I wish I had something like Scala's Option to help me. But wait there is [Rumonda](https://github.com/ms-ati/rumonade)! which makes my code above look like -

    def get_recent_tweets_from_favorites(current_user)
      tweets = []
      Option(current_user).map(&:get_favs).get_or_else(system_favs).each do |fav|
        tweets << get_last_three_tweets(fav)
      end
    end

It works! Now we have a simpler method with 4 lines of code (I cheated a bit) and we have used [Monads](http://james-iry.blogspot.in/2007/09/monads-are-elephants-part-1.html), knowingly or unknowingly :) Happy programming!