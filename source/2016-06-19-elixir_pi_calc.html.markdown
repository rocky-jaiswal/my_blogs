---
title: "Pi Calculation with Elixir"
tags: Elixir
date: 19/06/2016
---

As a programmer one is always searching for better tools, practices and programming languages. For example, working with Clojure makes me a better programmer, it provides me the ability to write functional, succinct code that runs fast and works on the well-tuned and battle-tested JVM. Looking at Clojure, an ideal modern day programming language for me would be -

- Supporting immutable data structures
- Functional
- Concurrent
- Supporting asynchronous & lazy code execution
- Supporting a fast REPL
- Supporting macros / metaprogramming
- Dynamically typed

Clojure surely checks all of the boxes above but I also heard really good things about Elixir and boy I am delighted with what I have seen. Apart from being very Clojure like, Elixir reads mostly like Ruby and the development experience is a pleasure (e.g. super fast REPL load times and extremely helpful error messages). Also, running on Erlang BEAM the concurrency patterns are astounding. You can actually run thousands of Elixir processes on a modern multi-core laptop. Let's see this in practice.

A while back I wrote a post on using [Akka with JRuby](http://rockyj.in/2012/09/15/akka_with_jruby.html) to calculate the value of pi, and then ran the same expirement with Clojure - [Pi Calculation with Clojure](http://rockyj.in/2015/11/21/clojure_async_pi_calc.html). We will do the same thing with Elixir this time, the formula we will use and parallelize is -

![Pi calculation formula](/images/pi-formula.png)

The code looks something like -

    #pi_calc.exs
    defmodule PiCalculator do
      @chunk_size 10000
      @no_of_chunks 10000

      defp build_chunk(num) do
        last  = num * @chunk_size
        first = case num do
          1 -> 0
          _ -> last - @chunk_size + 1
        end
        first..last
      end

      defp map_chunk(chunk) do
        Enum.map(chunk, (fn(e) -> :math.pow(-1, e) / (2 * e + 1) end))
      end

      defp calc_chunk(num) do
        num
        |> build_chunk
        |> map_chunk
        |> Enum.reduce(fn(e, acc) -> acc + e end)
      end

      def calculate do
        1..@no_of_chunks
        |> Enum.map(&Task.async(fn -> calc_chunk(&1) end))
        |> Enum.map(&Task.await(&1))
        |> Enum.reduce(fn(e, acc) -> acc + e end)
        |> (&(&1 * 4)).()
      end

    end

From the REPL (iex), this can be run as -

    iex(1)> c "pi_calc.exs"
    [PiCalculator]
    iex(2)> PiCalculator.calculate
    3.1415926635897824

The code is pretty simple to understand (and I am just an Elixir beginner), but the main thing to note is the number of parallel processes we could easily run - __10000__! The 10000 parallel processes were run individually and asynchronously, they completed in a few seconds while utilizing all of my CPU cores. So far I have never been able to run so many threads/processes smoothly in any language on my laptop (even on the JVM), Elixir is truly the next generation programming language, color me excited!
