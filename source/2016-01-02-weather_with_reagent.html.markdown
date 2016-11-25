---
title: "Weather with Reagent"
tags: Clojure, JavaScript, React
date: 02/01/2016
---

In my [last blog](http://rockyj.in/2015/12/31/react_routers_comparison.html) I talked a bit about React and ClojureScript. In this post we will look at a simple [Reagent](http://reagent-project.github.io/) app that fetches the weather using the [http://openweathermap.org/](http://openweathermap.org/) API. The idea of this post is to show how easily we can develop React apps with Reagent and how simple the code is. Here is how the working app looks (without much CSS as you can imagine) -

![reagent_weather](/images/reagent_weather.gif "Reagent Weather API")


And here is the code -

    (ns weatherman-cljs.core
      (:require [reagent.core :as reagent]
                [ajax.core :as ajax]))

    ;;--------------------------
    ;; Atoms etc.

    (def app-key "GET_IT_FROM_OWM")

    (def city (reagent/atom nil))

    (def matching-cities (reagent/atom nil))

    ;;---------------------------
    ;; XHR Call to OWM

    (defn handler [response]
      (reset! matching-cities response))

    (defn error-handler [{:keys [status status-text]}]
      (reset! matching-cities
              {:name status :main {:temp status-text} :sys {:country "NA"}}))

    (defn make-request []
      (ajax/GET "http://api.openweathermap.org/data/2.5/weather" {:params {:q @city
                                                                           :units "metric"
                                                                           :appid app-key
                                                                           }
                                                                  :handler handler
                                                                  :error-handler error-handler
                                                                  :response-format :json
                                                                  :keywords? true}))

    (defn get-weather [city-name]
      (reset! city city-name)
      (make-request))

    ;; -------------------------
    ;; Components

    (defn matching-cities-table []
      [:table
       [:thead
        [:tr
         [:th "City Name"]
         [:th "Country"]
         [:th "Temperature"]
         [:th "Weather"]]]
       [:tbody
        [:tr
         [:td (get @matching-cities :name)]
         [:td (get (get @matching-cities :sys) :country)]
         [:td (get (get @matching-cities :main) :temp)]
         [:td (get (first (get @matching-cities :weather)) :description)]]]])

    (defn user-input []
      [:div
       [:p "Enter City Name: "]
       [:input {:type "text"
                :on-change #(get-weather (-> % .-target .-value))}]
       [:p "Selected City: " @city]
       [matching-cities-table]])

    ;; -------------------------
    ;; Initialize app

    (defn mount-root []
      (reagent/render [user-input] (.getElementById js/document "app")))

    (defn init! []
      (mount-root))


The best part about Reagent is that any component that uses an __Atom__ is automagically re-rendered when its value changes, so we are not worried about managing DOM ourselves. Also since it uses React we have the shadow DOM built in, so only delta changes are applied to the DOM which makes it super fast. Even without much optimization the code above is blazing fast. 

I am really excited about Reagent, I think it builds upon React (which on its own is pretty good) and makes it even better. If you want the command line version of the above app you can also look at [https://github.com/rocky-jaiswal/weatherman-clj](https://github.com/rocky-jaiswal/weatherman-clj).
