--- 
title: "Future Matters"
tags: Ruby, Scala
date: 15/10/2013
---

Last weekend I was successfully able to launch the MVP of [StatusBoard](https://statusboard.in). While I really love Rails, I sometimes miss doing things asyncronously, for example when a user signs up, ideally the email confirmation should be sent by a separate thread. This enables the sign-up process to be snappy since sending emails is time consuming and requires no user feedback / intervention.

Scala [Futures](http://docs.scala-lang.org/overviews/core/futures.html) provide a nice abstraction of working with things in a non-blocking way without dealing with the headache of manually managing threads.

Let us take an fictitious example - as I am sitting and thinking about how to buy GTA5 and Batman: Arkham Origins by December, my "manager" comes to me and asks me to parse a large log file and count the errors and warnings in it. Let us assume counting the words "error" and "warning" in the file will give me what the manager wants and I can go back to my calculations.

Being a Linux n00b I quickly write a Ruby script to do the job -

    def count_word(word)
      count = 0
      File.open("/home/rockyj/log").each_line do |line|
        line.split.each { |w| count = count + 1 if w.downcase == word }
      end
      count
    end


    ["error", "warning"].each do |word|
      puts "Count of " + word + " = " + count_word(word).to_s
    end

The file is 1MB. The script runs in a couple of seconds and I sit back with a cup of coffee. Soon enough, my manager sends me another file to parse and this one is a big __150 MB__ monster. My Ruby script gets the job gets done but takes 20 seconds.

But now I wonder, my CPU has 4 cores, technically I could calculate the word occurences in two separate threads and cut my computation time in half (or somewhere close to half).

Enter Scala Futures. My new code is -

    import scala.io.Source
    import scala.concurrent.Future
    import scala.concurrent.ExecutionContext.Implicits.global

    object Counter extends App {

      def getWordCountInLine(word: String, line: String): Int = {
        line.split(" ").filter(w => w.equalsIgnoreCase(word)).length
      }

      def getLinesInFile(path: String) = {
        Source.fromFile(path).getLines()
      }

      def getCountFuture(word: String) = {
        Future {
          val lines = getLinesInFile("/home/rockyj/log")
          lines.foldLeft(0)((count, line) => count + getWordCountInLine(word, line))
        }
      }

      getCountFuture("error") onSuccess {
        case txt => println("Count error = " + txt)
      }

      getCountFuture("warning") onSuccess {
        case txt => println("Count warning = " + txt)
      }

    }

And it works! The method __getCountFuture__ returns a "Future" which is an object holding a value which will be available in the erm.. future. Using callbacks I can execute some code when the value is available. Now my calculations are done asyncronously, in parallel and I did not have to deal with threads at all. Some day I will talk more on Actors, Futures and Promises. Till then, code on!