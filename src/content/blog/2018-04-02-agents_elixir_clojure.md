---
title: 'Asynchronous state management with Agents'
tags: Elixir, Clojure
date: 02/04/2018
---

In my [last](/2018/03/03/macros_elixir_clojure.html) post we compared the implementation of macros in Elixir and Clojure. As I also mentioned, these two languages share a lot of features and terminology. In this post let's look at how we can handle simple asynchronous work and also manage state asynchronously with **Agents**.

To understand these concepts we will write a simple program - we will fetch the price of five cryptocurrencies asynchronously and independently (in separate threads / processes) and once all the prices are retieved we will print them. To manage the state of our results, we will use an "Agent". An agent can be thought of a background thread / process that has it's own state. In both Clojure and Elixir the state of an Agent can be updated independently and asynchronously.

Pictorially, this works like -

![Agent State](/images/agents.png 'Agent State')

To start off, to hand over work in a separate thread in Clojure we use the **future** form wheras in Elixir we use a **Task**. Agents in both the languages work pretty much the same. We initialize the agent with an initial state, then we asynchronously update the agent's state by passing a function that takes the existing state and returns the new state (after some computation).

The code in Clojure -

    (ns statesman.core
      (:require [clj-http.client :as client])
      (:require [clojure.data.json :as json]))

    (def coins ["btc" "eth" "xrp" "bch" "ltc"])

    (def coins-state (agent [])) ;; start off an agent with an empty state

    (defn pretty-print [coin-info]
      (println "")
      (println "Coin Info:")
      (println "----------")
      (doseq [info coin-info]
        (println
          (get-in info ["coin" "ticker"])
          (get-in info ["coin" "usd"]))))

    (defn update-state [state result]
      (when (= 4 (count state))
        (pretty-print (conj state result))) ;; side-effect!
      (conj state result))

    (defn get-price [coin] ;; HTTP call
      (let [resp
        (json/read-str
          (:body (client/get
            (str "https://coinbin.org/" coin) {:accept :json})))]
      (send coins-state update-state resp))) ;; Once the response is retrieved notify the agent

    (defn run [] ;; The entry point
      (doseq [coin coins]
        (future (get-price coin))))

which evaluates to -

    statesman.core=> (run)
    nil
    statesman.core=>
    Coin Info:
    ----------
    bch 663.58
    btc 6988.03
    eth 388.42
    xrp 0.494729
    ltc 118.82

The equivalent code in Elixir -

    # statesman.ex
    defmodule Statesman do

      defp pretty_print(result) do
        IO.inspect(result)
      end

      defp update_state(state, result) do
        state = state ++ [result]
        if (length(state) == 5) do
          pretty_print(state)
        end
        state
      end

      def get_price(coin, agent) do
        resp = HTTPoison.get! "https://coinbin.org/#{coin}"
        Agent.update(agent, fn (state) -> update_state(state, resp) end)
      end

      def get_price_async(coin, agent) do
        Task.async(__MODULE__, :get_price, [coin, agent])
      end

      def run do
        {:ok, agent} = Agent.start_link(fn -> [] end)

        ["btc", "eth", "xrp", "bch", "ltc"]
          |> Enum.each(fn(coin) -> get_price_async(coin, agent) end)
      end

    end

This is pretty cool, both languages provide great constructs to handle work and manage state asynchronously. Clojure also provides additional state management utilities with atoms and refs whereas Elixir provides GenServer. All in all, both languages make it very easy to write highly concurrent code while managing state safely.
