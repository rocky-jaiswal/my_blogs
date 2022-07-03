---
title: "Sieve of Eratosthenes with Elixir"
tags: Elixir
date: 17/02/2018
---

[The sieve of Eratosthenes](https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes) is a simple algorithm for finding all prime numbers up to any given limit. From wikipedia -

  > Works by iteratively marking as composite (i.e., not prime) the multiples of each prime, starting with the first prime number, 2. The multiples of a given prime are generated as a sequence of numbers starting from that prime, with constant difference between them that is equal to that prime. This is the sieve's key distinction from using trial division to sequentially test each candidate number for divisibility by each prime.

In JavaScript this is simple enough -

    // sieve.js
    const num = 100000
    const sqrt = Math.floor(Math.sqrt(num))

    const state = Array(num - 1)
      .fill(null)
      .map((_e, i) => i + 2)
      .reduce((h, e) => {
        h[e] = true
        return h
      }, {})

    const nonPrimes = Array(sqrt)
      .fill(null)
      .map((_e, i) => i + 2)
      .forEach((idx) => {
        if (state[`${idx}`]) {
          let count = 0
          while (true) {
            let n = Math.pow(idx, 2) + (idx * count)
            if (n <= num) {
              state[`${n}`] = false
            } else {
              break
            }
            count = count + 1
          }
        }
      })

    console.log(Object.keys(state).filter((k) => state[k]))

However, in the code above we are manipulating state even as we iterate over it. In a concurrent / functional world this is a big red flag. So to write this code in Elixir we need to isolate the state. Agents provide simple state isolation but we can build on the nicer API provided by GenServer. So the code looks like -

    #primes.ex

    defmodule PrimeState do
      use GenServer

      # Client side
      def start_link(num) do
        state = 2..num
          |> Enum.reduce(%{}, fn (x, acc) -> Map.put(acc, x, true) end)

        GenServer.start_link(__MODULE__, state, name: __MODULE__)
      end

      def get_state(pid) do
        GenServer.call(pid, :get_state)
      end

      def update_state(pid, e) do
        GenServer.cast(pid, {:update_state, e})
      end

      # Server side
      def init(state), do: {:ok, state}

      def handle_call(:get_state, _from, state) do
        {:reply, state, state}
      end

      def handle_cast({:update_state, e}, state) do
        {:noreply, Map.put(state, trunc(e), false)}
      end

    end

    defmodule Primes do

      defp filter_non_primes(x, num, pid, no_check \\ false, count \\ 0) do
        if no_check || Map.fetch(PrimeState.get_state(pid), x) == {:ok, true} do
          n = :math.pow(x, 2) + (x * count)
          if n <= num do
            PrimeState.update_state(pid, trunc(n))
            filter_non_primes(x, num, pid, true, count + 1)
          end
        end
      end

      # the main function
      def prime_sieve(num) do
        {:ok, pid} = PrimeState.start_link(num)

        2..trunc(Float.ceil :math.sqrt num)
          |> Enum.map(fn(e) -> trunc(e) end)
          |> Enum.each(fn (e) -> filter_non_primes(e, num, pid) end)

        new_state = PrimeState.get_state pid

        Map.keys(new_state)
          |> Enum.filter(fn (k) -> Map.fetch(new_state, k) == {:ok, true}  end)
          |> Enum.sort

      end

    end

Wrapping with a GenServer not only provides nicer state isolation but also a clean API (almost like working with a Map). Surprisingly, even though the code does not use many processes to parallelize the calculations the performance is pretty fast.
