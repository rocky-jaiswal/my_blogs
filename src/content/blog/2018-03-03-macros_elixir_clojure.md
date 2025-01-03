---
title: "Macros in Elixir and Clojure"
tags: Elixir, Clojure
date: 03/03/2018
---

To me Elixir and Clojure seem like sister programming languages. Both are modern, dynamic and functional languages that embrace concurrency and immutability. Both Elixir and Clojure provide rich metaprogramming capabilities through __macros__. To understand macros let us look at how typically code execution works in any language ---

__Code → Lexical Analysis & Parsing → AST → Execution__

When we write normal functions, we usually do not care about how they are evaluated / executed internally. However, with macros we can work with the AST (Abstract Syntax Tree) level directly and manipulate the code there which provides us with unprecedented flexibility to create new language constructs and DSLs.

![AST Transformation](/images/ast_transform.png "AST Transformation")

To see the striking similarities between Clojure and Elixir macros we will take a simple example. We will write a macro in both languages that takes a piece of code and reports the time of execution around it.

To see measurable results we will take an algorithm that is time consuming, nothing better than calculating [Collatz sequences](https://projecteuler.net/problem=14). The problem statement -

  > The following iterative sequence is defined for the set of positive integers:
  >
  >  n → n/2 (n is even)
  >
  >  n → 3n + 1 (n is odd)
  >
  >  Using the rule above and starting with 13, we generate the following sequence:
  >  13 → 40 → 20 → 10 → 5 → 16 → 8 → 4 → 2 → 1
  >
  >  It can be seen that this sequence (starting at 13 and finishing at 1) contains 10 terms. Although it has not been proved yet (Collatz Problem), it is thought that all starting numbers finish at 1.
  >  Which starting number, under one million, produces the longest chain?

The code in both Elixir and Clojure is simple enough -

    defmodule Euler_14 do

      require Timer

      defp calc(num, acc) do
        num = trunc(num)
        dec = num / 2
        inc = (num * 3) + 1
        r = rem(num, 2)
        case { num, r } do
          {1, _} -> length(acc)
          {_, 0} -> calc(dec, [dec | acc])
          {_, 1} -> calc(inc, [inc | acc])
        end
      end

      defp pmap(collection) do
        collection
          |> Enum.map(&(Task.async(fn -> calc(&1, [&1]) end)))
          |> Enum.map(&Task.await/1)
      end

      def collatz do
        1..1_000_000
          |> Enum.chunk_every(100)
          |> Enum.map(fn(arr) -> pmap(arr) end)
          |> List.flatten
          |> Enum.with_index(1)
          |> Enum.max_by(fn(t) -> elem(t, 0) end)
          |> IO.inspect
      end

    end

And in Clojure -

    (ns clj-fun.collatz)

    (defn calc [num]
      (loop [n num acc [num]]
        (let [inc (+ 1 (* n 3)) dec (/ n 2)]
          (if (== n 1)
            {num (count acc)}
            (if (== 0 (rem n 2))
              (recur dec (conj acc dec))
              (recur inc (conj acc inc)))))))

    (defn solve []
      (apply max-key val (into {} (pmap calc (range 1 1000000)))))

Now lets build the timing macro in Elixir -

    defmodule Timer do

      defmacro time_it(name, do: block) do
        quote do
          start_time = Time.utc_now
          result = unquote(block)
          IO.puts "Elapsed time for #{unquote(name)}: #{Time.diff(Time.utc_now, start_time, :milliseconds)} milliseconds"
          result
        end
      end

    end

As mentioned earlier, macros work at the AST level, so a macro gets the AST version of the code and then needs to return the manipulated AST version of the code. In Elixir we can produce the AST easily by __quote__, in example above we inject the code which we need to execute / time and merge it in our custom quoted AST using __unquote__. So to time our collatz function we can write it as (among other ways) -

    def collatz do
      Timer.time_it "collatz" do
        1..1_000_000
          |> Enum.chunk_every(100)
          |> Enum.map(fn(arr) -> pmap(arr) end)
          |> List.flatten
          |> Enum.with_index(1)
          |> Enum.max_by(fn(t) -> elem(t, 0) end)
          |> IO.inspect
      end
    end

or from the REPL -

    Timer.time_it "collatz", do: Euler_14.collatz

which gives us -

    Elapsed time for collatz: 10184 milliseconds
    {525, 837799}

Clojure essentially uses the same concepts but with a slightly different syntax -

    (defmacro time-it [name expr]
      `(let [start# (. System (nanoTime)) ret# ~expr]
          (prn
            (str
              "Elapsed time for " ~name ": "
              (int (/ (- (. System (nanoTime)) start#) 1000000))
              " milliseconds"))
          ret#))

This is essentially the same idea as Elixir, __`__ is the same as __quote__ and __~__ is the same as __unquote__. Plus Clojure provides __#__ to bind values safely within the macro.

Just for fun, the output of the Timer from Clojure is -

    Elapsed time for collatz: 13102 milliseconds
    [837799 525]

That's it. We looked at macros and built a simple one in Elixir and Clojure and studied their similarities. As usual, with great power comes great responsibility, macros are powerful but should only be used when a normal function cannot do the job.
