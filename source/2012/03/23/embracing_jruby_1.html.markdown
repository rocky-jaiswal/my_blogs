--- 
title: "Embracing JRuby - Part 1"
tags: JRuby, Java
date: 23/03/2012
---

There is hardly any doubt that I am really in love with JRuby. It allows me to use the simplicity of Ruby and the power of Java. Highly robust application servers like Torquebox now fill the gap that was missing while deploying Rails application written in JRuby. In this first of a series of articles I will write how one can integrate Java applications with JRuby to create great products quickly and efficiently.

**Calling Java from JRuby**

The simplest example would be -

test_java.rb

    require 'java'
    java_import 'java.lang.System'

    puts System.currentTimeMillis
  
In the code above we have called Java from JRuby. But what if we need to pass params to the Java class? Actually, numbers, strings and other simple types in Ruby are converted to equivalent Java objects. You can also pass basic collections like Arrays and Hashes. Another example would be -

TestJava.java

    public class TestJava {

      public String greet(String name){
        return "Hello " + name;
      }

    }

test_java2.rb

    require 'java'

    test_java = Java::TestJava.new

    puts test_java.greet('Rocky')

To run the above code, place the Java file in the same location as the Ruby file and compile the Java file first before running the Ruby code. To include other libraries make sure they are in the CLASSPATH (standard Java practice).

Lets test out some collections.

TestHash.java

    public String stringify(Map<String, String> map){
        String rep = "";
        for(String key : map.keySet()){
          rep = rep + key + "->" + map.get(key) + ", ";
        }
        return rep;
      }

test_hash.rb

    require 'java'

    test_java = Java::TestHash.new

    puts test_java.stringify({'name' => 'rocky', 'age' => '32'})


So now we have learned how to use Java classes from JRuby. This has some neat practical applications, for example we can write a simple Ruby script to query a database and generate reports using robust Java database drivers and great HTML generating Ruby gems all at once. In the next article we will look at calling JRuby/Ruby code from Java.