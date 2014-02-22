--- 
title: "Celluloid experiment with MRI / JRuby"
tags: Ruby, JRuby
date: 22/02/2014
---

While running a CPU intensive process I wanted to check Sidekiq's performance on MRI vs JRuby. Since Sidekiq internally uses Celluloid, I investigated CPU core usage on Ruby(MRI) and JRuby for a simple prime number generator which uses Celluloid. Code for this looks like - 

READMORE

    require "celluloid/autostart"

    module Itworks
      class PrimeWorker
        include Celluloid #this just avoids using / syncing threads manually

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
    end

To test this we have this spec -

    def work(pos)
      w = Itworks::PrimeWorker.new
      w.future.get_prime_at(pos)
    end

    # 1 worker
    it "calculates the correct prime number at 4000th pos" do
      f = work(4000)
      expect(f.value).to eq(37813)
    end

    # 8 workers
    it "works hard" do
      futures = 8.times.map do
        work(4000)
      end
      puts "this should be printed ..."
      futures.each { |f| expect(f.value).to eq(37813) }
   end


####With MRI - 

With 1 worker, the test run takes 4.6 secs for prime number at position 4000. 

With 8 workers (threads) running in parallel (see code above) on my 8 core CPU, it takes 39.3 secs while using only a maximum of 12.5% CPU (which makes sense since 1 / 8 = 0.125). So it only uses 1 core out of 8 irrespective of the number of threads / workers spawned.

![CPU Usage](/images/mri_cpu.png "CPU usage on MRI")



####With JRuby -

With the same code and 1 worker, the test run takes 4.7 secs for pos = 4000. 

With 8 workers (threads) running in parallel, it takes 12.5 secs while using a maximum of ~90% CPU, also it uses all cores.

![CPU Usage](/images/jruby_cpu2.png "CPU usage on JRuby")



####Conclusion - 

MRI uses one core per process irrespective of number of threads spawned (due to GVL restrictions). JRuby scales the work to use all cores automatically. 

To use all CPU cores with MRI, we need to start more processes, with JRuby there is no such need.

This also has implication for background processing systems like Sidekiq. With MRI starting Sidekiq processes with many workers (for a CPU intensive job) has negative impact. In this case Sidekiq should be started as many processes as CPU cores with 1-2 workers on each process to use all the cores while not starving the individual workers. With JRuby just one process with many workers can be started, this consumes lesser memory and utilizes all the cores of the CPU efficiently.