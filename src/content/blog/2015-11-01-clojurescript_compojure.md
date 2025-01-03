---
title: "Get started with Compojure & ClojureScript"
tags: Clojure
date: 01/11/2015
---

Clojure is probably the programming language that has fascinated and intimidated me for the longest time. I tried to pick it up many times and gave up an equal number of times. However, it was getting harder and harder to ignore ClojureScript's rising popularity and its awesome integration with React using [Om](https://github.com/omcljs/om) / [Reagent](http://reagent-project.github.io/). So I tried once again and instead of doing a lot over a single weekend, I tried to take it one step at a time. Some resources that I highly recommend for Clojure beginners are -

- [http://www.braveclojure.com/](http://www.braveclojure.com/)
- [http://4clojure.com](http://4clojure.com)
- [https://github.com/functional-koans/clojure-koans](https://github.com/functional-koans/clojure-koans)
- [https://github.com/gigasquid/wonderland-clojure-katas](https://github.com/gigasquid/wonderland-clojure-katas)
- [http://yogthos.github.io/ClojureDistilled.html](http://yogthos.github.io/ClojureDistilled.html)

Although I am just a noob right now and a little knowledge can be a dangerous thing, this post might help people like me get started with ClojureScript. First, we will create a simple project using [lein](http://leiningen.org/). To get the setup and dependencies right, our __project.clj__ may look like -


    (defproject simple-app "0.1.0-SNAPSHOT"
      :description "a simple app with ring+compojure+cljs"
      :url "http://rockyj.in"
      :min-lein-version "2.0.0"
      :source-paths ["src/clj"]
      :dependencies [[org.clojure/clojure "1.7.0"]
                     [compojure "1.4.0"]
                     [ring/ring-defaults "0.1.5"]
                     [ring/ring-json "0.4.0"]
                     ;;ClojureScript
                     [org.clojure/clojurescript "1.7.122"]
                     [cljs-ajax "0.5.1"]
                     [prismatic/dommy "1.1.0"]
                     ]
      :plugins [[lein-ring "0.8.13"]
                [lein-figwheel "0.4.1"]
                ]
      :ring {:handler simple-app.handler/app}
      :cljsbuild {
                  :builds [ { :id "simple-app"
                             :source-paths ["src/cljs"]
                             :figwheel true
                             :compiler {:main "simple-app.app"
                                        :asset-path "js/out"
                                        :output-to "resources/public/js/app.js"
                                        :output-dir "resources/public/js/out"} } ]
                  }
      :profiles
      {:dev {:dependencies [[javax.servlet/servlet-api "2.5"]
                            [ring/ring-mock "0.3.0"]
                            ]}})
                            
This will setup for us -

- [Compojure](https://github.com/weavejester/compojure)
- Ring with JSON support
- ClojureScript
- [Figwheel](https://github.com/bhauman/lein-figwheel)
- The ability to build our ClojureScript code into JavaScript
- And other ClojureScript libraries which we will discuss later


For this simple application -

- We will serve a simple static HTML5 page using Compojure. 
- We will also have a route than can take in a JSON param and send back a JSON response. 
- On the client side we will make a XHR call to this endpoint and manipulate some DOM with the results.

This is all very simple but good enough to get us started.

On the server side the code looks like __handler.clj__ -

    (ns simple-app.handler
      (:require [compojure.core :refer :all]
                [compojure.route :as route]
                [ring.middleware.json :as middleware]
                [ring.middleware.keyword-params :refer [wrap-keyword-params]]
                [ring.util.response :as response]
                ))

    (defroutes app-routes
      (GET "/" [] (response/resource-response "index.html" {:root "public"}))
      (route/resources "/")
      (POST "/hello" request
            (response/response {:greeting
                                (get-in request [:params :user])}))
      (route/not-found "Not Found"))

    (def app
      (-> app-routes
          wrap-keyword-params
          middleware/wrap-json-params
          middleware/wrap-json-response))
          
__index.html__:

    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Welcome to Clojure!</title>
      </head>
      <body>
        <h1>Hello World!</h1>
        <h1 class="fromServer"></h1>
        <script src="js/app.js"></script>
      </body>
    </html>
          
On the client side, __app.cljs__ -

    (ns simple-app.app
      (:require [simple-app.greet :as greet]))

    (greet/say-hello)

    (.log js/console "Hello Cljs!")

and __greet.cljs__ -

    (ns simple-app.greet
      (:require [ajax.core :refer [GET POST]]
                [dommy.core :as dommy :refer-macros [sel sel1]]))

    (defn handler [response]
      (.log js/console "server responded...")
      (-> (sel1 :.fromServer)
          (dommy/set-text!
           (str "Hello " (aget (clj->js response) "greeting")))))

    (defn error-handler [{:keys [status status-text]}]
      (.log js/console (str "something bad happened: " status " " status-text)))

    (defn say-hello []
      (POST "/hello"
            {:params {:user "from Server!"}
             :handler handler
             :error-handler error-handler
             :format :json
             :response-format :json}))

Two of the most common things we do in JavaScript code are -

- DOM manipulation
- XHR handling

As we see with the code above, this is made easy in ClojureScript with [dommy](https://github.com/Prismatic/dommy) and [cljs-ajax](https://github.com/JulianBirch/cljs-ajax).

The project layout looks like -

    .
    ├── dev-resources
    ├── project.clj
    ├── README.md
    ├── resources
    │   └── public
    │       ├── index.html
    │       └── js
    │           └── app.js
    ├── src
    │   ├── clj
    │   │   └── simple_app
    │   │       └── handler.clj
    │   └── cljs
    │       └── simple_app
    │           ├── app.cljs
    │           └── greet.cljs
    └── test
        └── simple_app
            └── handler_test.clj

Finally, the commands - __lein ring server__ and __lein figwheel__ can be run to get the application working.

Even in this small demo application we can see a few advantages of this stack -

1. We programmed in a single language using the same principles of code organization for the client and server side.
2. We managed all external dependencies of the project in a single file.
3. The build process is simple and clean.
4. We have a REPL for both client side and server side development.

So hope this post will help you to get started with ClojureScript, in the future I will try and look at Om / Reagent.
