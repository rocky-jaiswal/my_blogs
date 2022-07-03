---
title: And then there was Closure
date: 26/07/2011
tags: Ruby
---

A while back when I introduced Ruby to a few fellow Java developers they were intrigued by Closures / Lambdas. For most Java developers its difficult to understand what the hullabaloo around Closures and Functional programming is. What more, one might be a Ruby programmer for years and write code without ever creating Closures and doing functional programming. With the Object Oriented way of thinking, data is stored in fields and operations on this data is done by methods. Why in this wide world does one need Closures? I thought for a long time about the answer to this question and as I started learning JavaScript I realized the beauty of Closures and functional programming.

Below is a simple code problem written in Java and Ruby which I hope will help some of the Java developers understand Closures and also help us answer the question - Why we need Closures?


The problem is simple, I have a User class which has many fields like name, age, department code etc. I want to sort a list of users based on any of the fields it contains. 

Below is the sample User class in Java and Ruby.

    //Java Code
    class User {
        
        private String name;
        private Integer age;

        public User(String name, Integer age) {
            this.name = name;
            this.age = age;
        }
        
        public Integer getAge() {
            return age;
        }

        public void setAge(Integer age) {
            this.age = age;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        @Override
        public String toString() {
            return "User " + this.getName() + " - " + this.getAge();
        }
        
    }

Ruby
    class User
      attr_accessor :name, :age

      def initialize(name, age)
        @name = name
        @age = age
      end

      def to_s
        "User #{name} - #{age}"
      end

    end

Simple enough. 

To sort a list of Users based on a parameter that is passed, Java will have code somewhat like this -
    
    public class Sorter {
        
        public static void main(String args[]) {
            Sorter sorter = new Sorter();
            
            User user1 = new User("Rocky", 31);
            User user2 = new User("Aditya", 30);
            User user3 = new User("Sukhpal", 32);
            List<User> users = Arrays.asList(user1, user2, user3);
            
            if(args[0].equals("name")) {
                sorter.sortOnName(users);
            }
            if(args[0].equals("age")) {
                sorter.sortOnAge(users);
            }   
            System.out.println(users);
        }
        
        List<User> sortOnName(List<User> users) {
            Collections.sort(users, new Comparator<User>() {
                @Override
                public int compare(User o1, User o2) {
                    return o1.getName().compareTo(o2.getName());
                }
            });
            return users;
        }

        List<User> sortOnAge(List<User> users) {
            Collections.sort(users, new Comparator<User>() {
                @Override
                public int compare(User o1, User o2) {
                    return o1.getAge().compareTo(o2.getAge());
                }
            });
            return users;
        }
        
    }

So in the main method we are creating a few users just for testing (yes I could have done this in a test case) and then we are invoking the sorting code based on a parameter. To sort we are using the "sort" utility method provided in Collections class which expects the list and a Comparator object. We are creating the Comparator object inline and passing it.

In comparison, to do the same thing in Ruby we have to do this -

    user1 = User.new("Rocky", 31)
    user2 = User.new("Aditya", 30)
    user3 = User.new("Sukhpal", 32)
    user4 = User.new("Rohan", 25)

    users = [user1, user2, user3, user4]

    sorter = ->(user_x, user_y){ user_x.name <=> user_y.name } if(ARGV[0] == "name")
    sorter = ->(user_x, user_y){ user_x.age <=> user_y.age } if(ARGV[0] == "age")

    puts users.sort(&sorter)

The first thing that strikes you about the Ruby code is how small it is. If we ignore creation of the test data this code is merely 3 lines, as compared to around 20 lines in Java (assuming we are trying to do some clean coding). Moreover adding a new "sortable" field in Java is around 8-10 lines of code and in Ruby its just one line!

Lets try and understand what Ruby is doing. Line 8 is where the magic happens, simply speaking Closures are methods that can be passed around as values. So you can store a function in an array, retrieve it by the array's index and execute it. So in this line we are creating a function that expects two parameters (inside the two parentheses) and has the body (inside the curly braces) where we are doing comparison (using Ruby's <=> operator). Of course, since Ruby is a dynamic language, there are no types associated with the variables.

So in this logic we define our closure based on the parameter passed (lines 8 and 9) and hold it's reference in the variable "sorter".

Finally we call the Array.sort method which expects a code block / closure that does the comparison. In our case we pass the sorter's reference and we are all done.

Now the question comes why are we doing all this. As mentioned earlier, the number of lines of code in the Ruby solution is drastically less which means lesser lines to test and lesser lines to maintain and consequently the code has lesser chances of breaking. One still might argue that for an end user or my non-technical manager it only matters that a job is done, no matter how. But even for them functional programming brings added robustness to software and scales well too (e.g. adding a new "sortable" field). For a developer, its also about software craftsmanship and improving the way we code day in and day out.

Finally, if you think that Ruby's dynamic typing is too much for you and you miss type safety, generics etc. and you still want to do functional programming try __Scala__. It is an Object Oriented yet Functional, type safe programming language which runs on JVM. More on it later :).
