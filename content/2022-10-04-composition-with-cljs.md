---
title: 'Function composition with ClojureScript & Node'
tags: FP, Clojure, Nodejs
date: 04/10/2022
---

We have talked a lot about functional composition in the last few posts. As I look at Clojure I feel it captures the best of what we hold dear in functional programming. If you ignore the lack of "types", Clojure comes pretty close to the perfect language if you want to compose software using small functions. I was also very impressed by the book - [https://www.learn-clojurescript.com/](https://www.learn-clojurescript.com/), it captured some important ideas really well, for example -

"_We can think about functional programming as a description of data in motion. Unlike imperative code that makes us think about algorithms in terms of statements that assign and mutate data, we can think of our code as a description of how data flows through our program. Functions are the key to writing such declarative programs. Each function has zero or more input values (argument), and they always return some output value._"

ClojureScript for JS devs [here](https://clojurescript.org/guides/faq-js) is also a great read in general.

In functional programming the most important values are composability, functional purity, and immutability (and of-course first class functions with currying). Clojure excels in all of these areas (JS on the other hand has no immutablity out-of-the-box). So I tried to build an small "feature" using Clojure, however since I mostly use Node.js I did not want to jump into the deep end with JVM but try something simple with [shadow-cljs](https://shadow-cljs.github.io/docs/UsersGuide.html) and [Fastify.js](https://www.fastify.io/) (so technically this is all ClojureScript).

I also looked at [NBB](https://github.com/babashka/nbb) which is great for starting up or building scripts in ClojureScript. In the node world, the main issue is composition of "async" and normal functions, I tried to build that bridge with [promesa](https://github.com/funcool/promesa) which is from the NBB world.

So let us look at a simple feature -

1. With HTTP as in interface
2. We receive some payload, say a simple user registration data (email, password etc.)
3. We validate the payload
4. We make a remote HTTP call, to enrich the data
5. We insert a record in the DB
6. We return a response

So this is pretty simple, we have some sync and some async functions in there. We model this in a way that each request is handled by a "handler", the handler has a state that is modified with each function as we process the request. So in essence it looks like -

    (ns app.web.controllers.users
        (:require [clojure.string :as str]
                    [promesa.core :as p]
                    ["node-fetch" :as fetch]))

        (def base-state {:email ""
                        :password ""
                        :password-confirmation ""
                        :location ""
                        :valid false
                        :created false
                        :some-db-conn {}
                        :some-http-client {}
                        :response {}})

        (def handler-state
            (atom base-state))

        (defn reset-to-base-state! []
            (reset! handler-state base-state))

        (add-watch handler-state :watcher
                (fn [_key _atom old-state new-state]
                    (prn "-- handler-state changed --")
                    (prn "old-state" old-state)
                    (prn "new-state" new-state)))

        (defn validate [email password password-confirmation]
            (->>
                [(str/includes? email "@") (> (.-length password) 5) (= password password-confirmation)]
                (every? true?)))

        (defn fetch-uuid-v1 []
            (p/let [response (fetch "https://httpbin.org/uuid")]
                (.json response)))

        (defn init-state [req-body]
            (reset-to-base-state!)
            (swap! handler-state assoc :email (get req-body "email"))
            (swap! handler-state assoc :password (get req-body "password"))
            (swap! handler-state assoc :password-confirmation (get req-body "password_confirmation"))
            handler-state)

        (defn validate-request [state]
            (let [st @state valid (validate (:email st) (:password st) (:password-confirmation st))]
                (if valid (swap! state assoc :valid true) (throw (js/Error. "Bad input!"))))
            state)

        (defn enrich-data [state]
            (p/->>
                (p/delay 100) ;; assume we do some service invocation here
                (swap! state assoc :location "de")
                (p/promise state)))

        (defn insert-in-db [state]
            (p/->>
                (p/delay 200) ;; assume we do some DB invocation here
                (swap! state assoc :created true)
                (p/promise state)))

        (defn set-response [state]
            (p/->>
                (fetch-uuid-v1)
                ((fn [resp] (swap! state assoc :response (js->clj resp))))
                (p/promise state)))

        (defn create [req-body]
            (p/->> req-body
                    (init-state)
                    (validate-request)
                    (enrich-data)
                    (insert-in-db)
                    (set-response)
                    (:response @handler-state)))

In the last 8 lines, we have our main "composition". In each of these state modifiers / functions we get a state and return a modified state. In ClojureScript global state is very cleanly expressed and encapsulated in an aptly named **"atom"**, on top of everything an atom also provides hooks to add watchers and validations to it.

Secondly, using "promesa" we can write some async code easily with the **"p/->>"** macro, the only thing I had to keep in mind was wrapping the state in "p/promise" when returning from an "async" function. The whole project is available on my [github](https://github.com/rocky-jaiswal/cljs-fastify) repo.

Well, this is it. This code setup is quite readable, scalable and can work for any sort of web service with each "handler" written this way. The final built code is also pretty fast, you can expect the same kind of performance that Fastify.js would give you with native JS. The advantage here is that we have written clean code with immutable data and functional composition.
