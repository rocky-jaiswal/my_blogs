--- 
title: "Custom Fetcher for Sidekiq"
tags: Rails
date: 16/02/2014
---

Lately I have been working a bit on Sidekiq. IMHO, it should be one of the default gems for Rails projects, one of the reasons being it also includes [Celluloid](https://github.com/celluloid/celluloid). When used, the combination of these two awesome libs in conjunction with JRuby can provide a big performance boost to any Rails project.


For example, doing things asynchronously with Sidekiq / Celluloid can be as simple as -

    UserMailer.delay.welcome_email(@user.id)

In this blog we will look at how to write a custom fetcher for Sidekiq. I won't go into the basics of how Sidekiq works. You can see the wiki [here](https://github.com/mperham/sidekiq/wiki) for more info. What we want to tinker with is the __fetcher__, which is used to pull a job from the Redis queue so that it can be processed by the workers.

The default fetcher uses redis' BRPOP command which pops an element from the tail of the list. Elements are inserted at the head so this makes sense. We want to write a fetcher that pops elements from the head of the list or even pops an element randomly.

To test our setup we could do something like this -

    class SimpleWorker
      include Sidekiq::Worker
      
      def perform(num)
        puts "==========>"
        puts num
        puts "==========>"
      end

    end

Which is called by -

    class AsyncHelper

      def self.submit_jobs
        args = 100.times.map do |num|
          [num]
        end
        Sidekiq::Client.push_bulk({'class' => SimpleWorker, 'args' => args})
      end

    end

When the Sidekiq process is run the output is more or less sequential printing of 0 to 99 (not 100% sequential because of concurrency). 

Now lets say we want to pop the jobs in reverse order i.e. from the head. For this we need to create a custom fetcher which uses BLPOP -

Let's create a fetcher using "blpop" -

    
    require 'sidekiq'
    require 'sidekiq/fetch'

    module Sidekiq
      class CustomFetch < Sidekiq::BasicFetch
        
        def retrieve_work
          work = Sidekiq.redis { |conn| conn.blpop(*queues_cmd) }
          UnitOfWork.new(*work) if work
        end

      end
    end


And we need to register this with Sidekiq (in config/initializers/sidekiq.rb) -

    require "lib/sidekiq/custom_fetch"

    Sidekiq.configure_server do |config|
      Sidekiq.options[:fetch] = Sidekiq::CustomFetch
    end

That is it. We have written our fist custom Sidekiq fetcher. The output from our sample worker generates numbers from 99 to 0.

Now let's write a more complex fetcher, which fetches items randomly -

    require 'sidekiq'
    require 'sidekiq/fetch'

    module Sidekiq
      class RandomFetch < Sidekiq::BasicFetch

        @@semaphore ||= Mutex.new
        
        def initialize(options)
          queues = options[:queues]
          raise ArgumentError, "Randomized fetch only works with exactly one queue." if queues.size != 1
          @queue =  "queue:#{queues.first}"
        end
        
        def retrieve_work
          @@semaphore.synchronize do
            work = random
            UnitOfWork.new(*work) if work
          end
        end

        def random
          work = nil
            Sidekiq.redis do |conn|
              length = conn.llen(@queue)
              if length < 2
                work = conn.brpop(@queue)
              else
                random_index = (0...length).to_a.sample
                item = conn.lindex(@queue, random_index)
                conn.lrem(@queue, 1, item)
                work = [@queue, item]
              end
            end
          work
        end

      end
    end

As evident this will only work when we have one sidekiq process and one queue because of synchronization issues (threads!!). To solve this we can write a LUA script to do this random fetch since the LUA script execution by Redis is atomic (maybe I will write a gem for this some day). Anyways, hope this was useful, have a nice day.