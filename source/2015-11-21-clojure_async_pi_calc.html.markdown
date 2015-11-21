---
title: "Pi Calculation with Clojure"
tags: Clojure
date: 21/11/2015
---

A while back I wrote a post on using [Akka with JRuby](http://rockyj.in/2012/09/15/akka_with_jruby.html) to calculate the value of pi. Since I am learning Clojure these days I thought it would a good idea to implement the same pi calculation algorithm using Clojure and core.async. The idea of this post is to share how simple and concise Clojure can be and also to get some reviews for my first Github Clojure project (although it is a trivial one). The algorithm is basically -

![Pi calculation formula](/images/pi-formula.png)

We can solve this simple equation with a great degree of concurrency, we can create multiple chunks like (1, -1/3, 1/5) and (-1/7, 1/9, -1/11) and so on where each chunk has a certain number of elements. As these chunks are individually calculated, we just wait for their results and add them up later.

This is reasonably simple with Clojure, to kick off we create a simple project with lein -

    lein new app pi-calculator

Then we need to add the core.async dependency to project.clj -

    [org.clojure/core.async "0.2.374"]

The core logic is actually just 20ish lines (which is ridiculous, compared to our solution earlier) -

    (ns pi-calculator.core
      (:require [clojure.core.async
                  :as a
                  :refer [>! <! >!! <!! go chan]])
      (:gen-class))

    (def chunk-size 400)
    (def sums (chan chunk-size))
    (def results (atom []))

    (defn build-range [start]
      (range (+ 1 (* chunk-size start)) (+ 1 (* chunk-size (+ 1 start)))))

    (defn sum-a-chunk [seq]
      (double (reduce + (map (fn[e] (/ (- 1 (* 2 (rem e 2))) (+ 1 (* 2 e)))) seq))))

    (defn calc-a-chunk [start]
      (go (>! sums (sum-a-chunk (build-range start)))))

    (defn calc []
      (dotimes [n chunk-size]
        (calc-a-chunk n))
      (dotimes [n chunk-size]
        (swap! results (fn[current-state] (conj current-state (<!! sums)))))
      (* 4 (+ 1 (reduce + @result))))

    (defn -main
      "Pi Calculation."
      [& args]
      (println "Starting...")
      (println (calc))
      (println "Done!"))

We choose 400 chunks of size 400, using core.async/go we spawn off 400 independent calculations and wait for their result. Finally, we aggregate the individual results and come up with the value of pi.

The entire code is available on [Github](https://github.com/rocky-jaiswal/pi-calculator). If you think the code can be improved please let me know, I am still new with Clojure (and I already love it).
