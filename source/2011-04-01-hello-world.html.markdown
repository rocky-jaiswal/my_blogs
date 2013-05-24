---
title: Integrating JRuby and Java to create a mini rules engine
tags: JRuby
date: 01/04/2011
---

Ruby is a beautiful language, but that is just me saying it. A thing of beauty has to be experienced on its own by someone. A major reason behind the slow adoption of Ruby in the enterprise is infrastructure / installation and speed. Although, personally I have never seen Ruby as slow (specially 1.9), but asking someone to run Ruby code on his/her machine is a problem as they need to install Ruby and other associated 'gems' used by my program. Enter <a href="http://www.jruby.org" target="_blank">JRuby</a> - it is a 100% pure Java implementation of the Ruby Programming Language, so in effect you can run a JRuby program on any machine that has a JVM. Just include a jar and you are good to go.

JRuby also integrates very easily with Java (both run on JVM) and helps you solve some pain areas in Java. I used it today in my project to dynamically (Ruby being a dynamic and interpreted language) generate and execute rules. Imagine a scenario on a website where you want to find a Customer's class from the loyalty points he has in his account. So lets say, if the customer has upto 1000 loyalty points he is "BRONZE" member, between 1000 and 2000 he is "SILVER" member and so on and so forth.

If this is done in pure Java, you can create these rules in your code but you cannot implement changes easily. For example, adding a new customer class will involve code change and server restart. Using a database, properties files or a rules engine will still not offer you a lot and will be difficult to setup and maintain and one can be assured that they will need to restart the server sooner or later as rules become complex. 

However, if we implement this logic in JRuby we will have reasonably clean code and logic can be delegated to a clean and dynamic language like Ruby which even a business manager can maintain.

So lets get started. First let us add the JRuby jar to our project (through Maven) - 

    <dependency>
        <groupId>org.jruby</groupId>
        <artifactId>jruby-complete</artifactId>
        <version>1.5.6</version>
    </dependency>

Now, let us create a simple Ruby script that will contain the logic -

    class CustomerClassSelector
      def choose_class(points)
        return "BRONZE" if (0..999).include?(points)
        return "SILVER" if (1000..1999).include?(points)
        return "GOLD" if (2000..2999).include?(points)
        return "PLATINUM"
      end 
    end

Save it as customer_class_selector.rb at a place where your project config lies. The code itself is pretty easy to understand even if you don't know Ruby syntax. The "(0..999)" is a Range in Ruby and it has a method "include?(param)" that returns true if the param lies in the Range.

Now for calling this code from Java -
    
    String getCustomerClass(int loyaltyPoints) {
		ScriptingContainer container = new ScriptingContainer(LocalContextScope.THREADSAFE);
		container.setLoadPaths(Arrays.asList("/home/rocky/mysite/config"));
		container.runScriptlet("require 'customer_class_selector'");
		Object greeter = container.runScriptlet("CustomerClassSelector.new");
		String customerClass = container.callMethod(greeter, "choose_class", loyaltyPoints, String.class);
		return customerClass;
	}

- In this method, we initiate a Scripting container (package org.jruby.embed) that is available through our Maven dependency / jar added above. We pass it an argument so that container is not loaded as a singleton and the script is run every time its invoked.
- Then through this container we load the path where JRuby scripts / libraries are (like classpath in Java).
- We then load the scriptlet we saved earlier.
- Next we intantiate the class defined in the Ruby script above.
- Finally, we call the method choose_class passing the loyalty points and registering the return value type as String.

We now can play with the rules inside the Ruby script as much as we want. Anyone can change the Ranges and add/remove Customer classes but we will never need to restart our web application or modify the Java code. That is the power of dynamic languages in action! Simple and powerful, ain't it :).
