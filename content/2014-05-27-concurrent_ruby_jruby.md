--- 
title: "Concurrent Ruby on MRI / JRuby"
tags: Ruby, JRuby
date: 27/05/2014
---

Truth be told I am a big fan of Ruby, it is a clean, easy to pick and productive language. Rails is also by far the most feature rich web application framework available. However, Ruby misses a few (modern) language features, most of them involving "Concurrency". JRuby solves some of those problems and with the rising popularity of the [concurrent-ruby](https://github.com/jdantonio/concurrent-ruby/) gem I am happy the direction the Ruby community is taking.

This is a small blog post about the difference of behavior between MRI and JRuby when using the concurrent-ruby gem. Concurrency is important today as most modern hardware has multiple cores. However, because of the GVL, MRI cannot utilize all the processor cores with the same process. JRuby however can, so let's see how concurrent-ruby behaves when we execute multiple asynchronous tasks.

Our code is simple -

    require 'concurrent'

    class PrimeWorker

      def is_prime?(num)
        return false if (2...num).any?{ |i| num % i == 0 }
        true
      end

      def get_prime_at(pos)
        count = 0
        num = 2
        loop do
          count += 1 if is_prime?(num)
          break if count == pos
          num += 1
        end
        num
      end

    end

    futures = []
    futures << Concurrent::Future.execute{ PrimeWorker.new.get_prime_at(4000) }
    futures << Concurrent::Future.execute{ PrimeWorker.new.get_prime_at(4000) }
    futures << Concurrent::Future.execute{ PrimeWorker.new.get_prime_at(4000) }
    futures << Concurrent::Future.execute{ PrimeWorker.new.get_prime_at(4000) }

    while (futures.any? {|p| p.state != :fulfilled})
      sleep 2
      puts "waiting..."
    end

    puts futures.map(&:value)


This is a simple CPU intensive program that I often use for testing. We find out the prime number at the 4000th position (which is 37813 btw) and we do it on four asynchronous tasks.

With MRI 2.1.2, this takes around 25 seconds on my machine. The CPU usage is as shown below -

![Concurrency-MRI](/images/conc-mri.png "Concurrency MRI")

As evident, not all cores are utilized fully.

__The same code on JRuby takes 20 seconds but most importantly uses all the cores.__

![Concurrency-JRuby](/images/conc-jruby.png "Concurreny JRuby")

Also worth mentioning is that JRuby startup times are high. However in server environments this time is much lower as the JVM is already warmed up so the 20 seconds would be much lower if this code was executed in a server environment.

Well, this small experiment proved that concurrent-ruby is a pretty awesome gem and when used on JRuby it automatically uses all the CPU cores without any code change, which is even better news.