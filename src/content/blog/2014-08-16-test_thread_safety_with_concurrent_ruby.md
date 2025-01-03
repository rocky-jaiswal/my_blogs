--- 
title: "Testing thread safety with concurrent-ruby"
tags: Ruby, JRuby
date: 16/08/2014
---

[concurrent-ruby](https://github.com/jdantonio/concurrent-ruby/) is one of my favorite Ruby gems. It provides numerous utilities that makes writing safe, concurrent and well-performing code easier. Lately, we faced an issue while we were developing a feature using [find_or_create_by](http://api.rubyonrails.org/classes/ActiveRecord/Relation.html#method-i-find_or_create_by) in Rails which appeared to be not thread safe / have race conditions. The question was how could we confirm this, enter CountDownLatch from concurrent-ruby. From the documentation, CountDownLatch is -

A synchronization object that allows one thread to wait on multiple other threads. The thread that will wait creates a CountDownLatch and sets the initial value (normally equal to the number of other threads). The initiating thread passes the latch to the other threads then waits for the other threads by calling the #wait method. Each of the other threads calls #count_down when done with its work. When the latch counter reaches zero the waiting thread is unblocked and continues with its work. A CountDownLatch can be used only once. Its value cannot be reset.

Let us use the CountDownLatch to test if __find_or_create_by__ has thread safety issues. For a Rails 4 project, we can do something like this in the rails console -

    def create_account(cid)
      Account.find_or_create_by(customer_id: cid)
    end

    latch = Concurrent::CountDownLatch.new(1)
    
    t1 = Thread.new { latch.wait; create_account(12345) }
    t2 = Thread.new { latch.wait; create_account(12345) }
    t3 = Thread.new { latch.wait; create_account(12345) }
    
    latch.count_down

The idea here is we initialize three threads but use the latch to keep them in waiting state. As soon as the latch will be released the threads will run and since there are three of them, there is a high probability that two of them will hit "find_or_create_by" simultaneously. What did I get as output -

    ActiveRecord::JDBCError: org.postgresql.util.PSQLException: ERROR: duplicate key value violates unique constraint "index_accounts_on_customer_id"
      Detail: Key (customer_id)=(12345) already exists.: INSERT INTO "accounts" ("customer_id", "created_at", "updated_at") VALUES (12345, '2014-08-16 21:47:59.436000', '2014-08-16 21:47:59.436000') RETURNING "id"

So we conclude that even though find_or_create_by by definition should not raise an error due to row duplication, it does so and we proved that using the wonderful CountDownLatch. Anyways, this was fun, as always we confirmed that we should use threads with care.

p.s. this was of-course JRuby, no idea what would happen with MRI.