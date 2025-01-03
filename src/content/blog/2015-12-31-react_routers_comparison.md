---
title: "React Router Comparison"
tags: Clojure, JavaScript, React
date: 31/12/2015
---

[React](https://facebook.github.io/react/) and [Redux](http://redux.js.org/) are game changing technologies. The architecture principles they are based on seem to be sensible and rock solid. Redux architecture revolves around a strict unidirectional data flow, with a central application state that is functionally mutated by actions to render views, this makes applications easy to reason with and makes it hard for bugs to creep in. 

ClojureScript is also an excellent choice for building React applications since the language imbraces immutability which is one of the fundamental principles of Flux / Redux architecture. In this short post we will not look at Redux though but do a comparison of how simple Routing looks in React + [React-Router](https://github.com/rackt/react-router) and [Reagent](http://reagent-project.github.io/) + [Secretary](https://github.com/gf3/secretary).

For React projects in JavaScript we will need to do the tooling in Webpack or Browserify. Let's look at the actual code -

    //main.js
    import React from 'react';
    import ReactDOM from 'react-dom';
    import { Router, Route } from 'react-router';
    import IndexContainer from './components/index-container';
    import AboutContainer from './components/about-container';
    import PagesContainer from './components/pages-container';

    (function main() {
      ReactDOM.render((
        <Router>
          <Route path="/" component={IndexContainer} />
          <Route path="/about" component={AboutContainer} />
          <Route path="/pages" component={PagesContainer} />
        </Router>),
        document.getElementById('app')
      );
    })();

    //index-container.js
    import React from 'react';
    import { Link } from 'react-router';

    export default class IndexContainer extends React.Component {
      render() {
        return(
          <div>
            <h1>Index</h1>
            <Link to="/about">About</Link><br/>
            <Link to="/pages">Pages</Link>
          </div>
        );

      }
    }

    //about-container.js
    import React from 'react';
    import { Link } from 'react-router';

    export default class AboutContainer extends React.Component {
      render() {
        return(
          <div>
            <h1>About</h1>
            <Link to="/">Home</Link>
          </div>
        );
      }
    }
   

In comparison the ClojureScript + Reagent project does its tooling in Leiningen and the code looks like -


    (ns rerouted.core
    (:require [reagent.core :as reagent :refer [atom]]
              [reagent.session :as session]
              [secretary.core :as secretary :include-macros true]
              [accountant.core :as accountant]))

    ;; -------------------------
    ;; Views

    (defn home-page []
      [:div [:h2 "Home"]
       [:div [:a {:href "/about"} "About"]]
       [:div [:a {:href "/pages"} "Pages"]]])

    (defn about-page []
      [:div [:h2 "About Us"]
       [:div [:a {:href "/"} "go to the home page"]]])

    (defn pages-page []
      [:div [:h2 "Pages"]
       [:div [:a {:href "/"} "go to the home page"]]])

    (defn current-page []
      [:div [(session/get :current-page)]])

    ;; -------------------------
    ;; Routes

    (secretary/defroute "/" []
      (session/put! :current-page #'home-page))

    (secretary/defroute "/about" []
      (session/put! :current-page #'about-page))

    (secretary/defroute "/pages" []
      (session/put! :current-page #'pages-page))

    ;; -------------------------
    ;; Initialize app

    (defn mount-root []
      (reagent/render [current-page] (.getElementById js/document "app")))

    (defn init! []
      (accountant/configure-navigation!)
      (accountant/dispatch-current!)
      (mount-root))

    
One thing that sticks about is that the Cljs code does not have the ugly JSX syntax (well atleast IMHO). In Cljs the DOM is built with pure Clojure data structures. Also the tooling in Clojure although slower is much much simpler and understandble something which I cannot say for Webpack. That's it for now as I try out Redux I will post more experiments soon.

