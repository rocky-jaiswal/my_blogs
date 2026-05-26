---
title: 'Simple Apps with Clojure, HTMX and Pipelines'
tags: Clojure, FP, HTMX
date: 26/05/2026
---

In my previous posts I have been going on and on about [functional composition and pipelines](/2023/07/13/state-machine-composed.html) and the ["Result" pattern](/2025/10/25/result-monad.html). This post is no different. Most of the examples I have shown are in TypeScript or Kotlin. In this post I want to show how these ideas translate naturally to Clojure and also make a case for a simple, server-rendered web stack that I think is enjoyable and simple - **Clojure + Hiccup + HTMX**.

## The Modern Web Stacks

Most web application stacks today are complex. On the frontend we have React, a state management library, a bundler, TypeScript configuration and a build pipeline. On the backend we have a framework, an ORM, middleware configuration and a deployment pipeline. Even "simple" apps can easily have 5-6 moving parts and hundreds of lines of configuration before you write a single line of business logic. Not to mention multiple pipelines and deployment artifacts which need to sync up.

I am not saying this complexity is never warranted. For large, team-built, highly interactive applications it often is. But for a lot of web applications - internal tools, dashboards, CRUD apps, side projects - this is overkill. The question is: can we do better?

![Code Complexity](/images/code_complexity.png)

## The Stack

The stack I want to talk about is -

- **Clojure** as the language
- **[Integrant](https://github.com/weavejester/integrant)** for system lifecycle
- **[Reitit](https://github.com/metosin/reitit)** for routing
- **[Hiccup](https://github.com/weavejester/hiccup)** for HTML generation
- **[HTMX](https://htmx.org/)** for interactivity
- **PostgreSQL** as the database (duh!)

### Why Clojure?

Clojure sits on the JVM, so it has access to the entire Java ecosystem. But more importantly for our purposes, it is a functional language with immutable data by default, a phenomenal collections library and the `->` threading macro which is essentially a built-in pipe operator (remember [pipes](https://rockyj-blogs.web.app/2023/07/13/state-machine-composed.html)).

The REPL-driven development workflow is also genuinely different from anything else I use. You start the system once and reload only changed namespaces. There is no "restart the server" cycle. Tight feedback loops without a hot-reload framework.

### Why Hiccup?

Hiccup represents HTML as Clojure data structures (vectors). A `div` with a class and a child paragraph looks like -

    [:div {:class "container"}
     [:p "Hello world"]]

This is not a templating language. It is just Clojure. You can use `map`, `filter`, `when`, `if` - any function - directly inside your view code. You get the full power of the language without learning a separate templating syntax. And since it is just data, it is composable. View components are just functions that return vectors.

### Why HTMX?

HTMX lets you add interactivity to server-rendered HTML by annotating elements with attributes. A button that loads content via AJAX looks like -

    [:button {:hx-get "/items/1" :hx-target "#result"} "Load"]

The server returns a fragment of HTML and HTMX swaps it into the DOM. No JSON, no client-side state management, no Redux. For most CRUD operations this is all you need.

The combination of Hiccup and HTMX means the server always renders full HTML, the client only requests fragments, and all state lives on the server. This dramatically simplifies the mental model of the application.

## The Architecture

The application I built follows a layered architecture -

    HTTP Request
        ↓
    Controller   -> parse request, call command, render HTML
        ↓
    Command      -> orchestrate services using a Result pipeline
        ↓
    Service      -> small, isolated domain functions
        ↓
    Repository   -> database queries

Each layer has one job. Controllers know about HTTP. Commands know about business flows. Services know about domain logic. Repositories know about SQL. Nothing bleeds into anything else.

## One File, One Command

This is something I genuinely appreciate about this stack and it is easy to miss. The entire project is configured in a single `deps.edn` file - dependencies, aliases for dev, test, lint, format and build. No `package.json`, no `webpack.config.js`, no `tsconfig.json`, no separate frontend manifest. One file describes everything.

For development you run -

    make repl

which starts a REPL. Then inside the REPL you type `(go)` to start the server. When you change a file you type `(reset)` and only the changed namespaces are reloaded. No process restart, no hot-reload plugin, no waiting. The feedback loop is as tight as it gets.

For production you build an uberjar -

    make build

and deploy it with -

    java -jar app.jar

That is it. No frontend build step, no asset pipeline, no synchronizing two deployment artifacts. Because Hiccup generates all HTML on the server, there is nothing to bundle. The whole application - routes, views, business logic, database access - ships as a single self-contained JAR. Compare this to a typical React + Node setup where you have a frontend build, a backend build, static asset hosting and a deployment pipeline that coordinates all three.

The simplicity is not just nice to have. It is one less class of production problem to debug at 2am.

## The Pipeline Pattern

[As I wrote before](/2023/07/13/state-machine-composed.html), composing functions is great as long as those functions return a simple value. The moment they can fail, return null or throw exceptions, composing them becomes messy.

The solution I keep coming back to is the **Result** type - a value that is either `{:ok something}` or `{:error reason}`. With a small set of helpers, we can chain any number of functions together and the pipeline short-circuits the moment any step fails. No `if/else`, no `try/catch` scattered through the orchestration code ([see old post](https://rockyj-blogs.web.app/2025/10/25/result-monad.html))

In Clojure the helpers look like this -

    ;; pipeline.clj

    (defn found [v]
      (cond
        (:error v) v
        (nil? v)   {:error :not-found}
        :else      {:ok v}))

    (defn owned-by [result owned?-fn]
      (if (:error result)
        result
        (if (owned?-fn (:ok result))
          result
          {:error :forbidden})))

    (defn valid [result validate-fn]
      (if (:error result)
        result
        (if-let [err (validate-fn)]
          {:error err}
          result)))

    (defn then [result f]
      (if (:error result)
        result
        (f (:ok result))))

Each function checks for an existing error and passes it through untouched. If no error exists, it does its job and returns the next `{:ok ...}` or `{:error ...}`. Clojure's `->` threading macro lets us compose these into a readable pipeline.

## A Real Example

Here is the command for adding an item to a todo list -

    (defn add-item! [ds list-id user-id title]
      (-> (list-service/find-by-id ds list-id)
          pipe/found
          (pipe/owned-by #(list-service/owned-by? % user-id))
          (pipe/valid    #(item-service/validate-title title))
          (pipe/then     (fn [_] {:ok (item-service/create! ds list-id title)}))))

Read this top to bottom -

1. Find the list by id
2. Ensure it exists (`found` returns `{:error :not-found}` if nil)
3. Ensure the current user owns it (`owned-by` returns `{:error :forbidden}` if not)
4. Validate the item title (`valid` returns `{:error "Title cannot be blank"}` if invalid)
5. Create the item and return `{:ok item}`

If any step fails, every subsequent step is skipped. The caller always gets back an `{:ok ...}` or `{:error ...}` - no exceptions, no null checks. The controller then decides how to render the result -

    (defn add-item! [req]
      (let [{:keys [ds session params]} req
            user-id (:id session)
            list-id (parse-long (get-in req [:path-params :id]))
            result  (item-cmd/add-item! ds list-id user-id (:title params))]
        (case (first (keys result))
          :ok    (render-item (:ok result))
          :error (render-error (:error result)))))

The controller is thin by design. It parses the request, calls the command, renders the result.

## Declarative Validation with Malli

For validation we use [Malli](https://github.com/metosin/malli) - a data-driven schema library. Schemas are plain Clojure data, defined once in a dedicated namespace -

    ;; schemas.clj

    (def title-schema
      [:and
       [:fn {:error/message "Title cannot be blank"} #(not (str/blank? %))]
       [:fn {:error/message "Title must be 200 characters or less"} #(<= (count %) 200)]])

    (def registration-schema
      [:and
       [:fn {:error/message "Email is required"}
        (fn [{:keys [email]}] (not (str/blank? email)))]
       [:fn {:error/message "Email must contain @"}
        (fn [{:keys [email]}] (or (str/blank? email) (str/includes? email "@")))]
       [:fn {:error/message "Password must be at least 8 characters"}
        (fn [{:keys [password]}] (>= (count password) 8))]
       ;; ... more constraints
       [:fn {:error/message "Passwords do not match"}
        (fn [{:keys [password confirm-password]}] (= password confirm-password))]])

The schema is pure data. The `first-error` helper in a separate `validation.clj` namespace runs it through Malli and returns the first failing message -

    (defn first-error [schema value]
      (when-let [errors (m/explain schema value)]
        (->> errors me/humanize (remove nil?) first)))

Services call this directly -

    ;; services/todo_item.clj
    (defn validate-title [title]
      (validation/first-error schemas/title-schema title))

    ;; services/user.clj
    (defn validate-registration [params]
      (validation/first-error schemas/registration-schema params))

Adding a new validation rule is a one-line change in `schemas.clj`. Nothing else needs to change.

## Putting It Together

The registration command looks like this -

    (defn register! [ds {:keys [email password] :as params}]
      (-> {:ok params}
          (pipe/valid #(user-service/validate-registration params))
          (pipe/valid #(when (user-service/find-by-email ds email)
                         "Email already registered"))
          (pipe/then  (fn [_]
                        (let [user (user-service/create! ds {:email    email
                                                             :password password})]
                          {:ok {:id    (:users/id user)
                                :email (:users/email user)
                                :role  (:users/role user)}})))))

Compare this to the imperative equivalent with its nested `if` checks and `try/catch` blocks. The pipeline version reads like a description of what should happen - validate the input, check for duplicates, create the user. Each step is independently testable. Each failure path is handled uniformly.

This is [the same idea](/2025/10/25/result-monad.html) as `flatMap` on a `Result` in Kotlin or `chain` on a `TaskEither` in TypeScript - just expressed with Clojure's threading macro and plain maps (and consequently less code).

## Final Thoughts

The stack - Clojure, Hiccup, HTMX - keeps the server as the source of truth and keeps the client dumb. There is no hydration, no serialization boundary, no client state to synchronize. Most web applications do not need more than this, unless you really know you want a complex SPA with a team of developers running it.

The pipeline pattern on top of it keeps the business logic clean. The layering (repository → service → command → controller) gives everything a clear home. Malli schemas as data keep validation declarative and centralized.

The result is an application where you can open any command file and understand the full business flow in 10 lines of code, where adding a feature means adding one function per layer, and where the test surface is small because each function does one thing and one thing only. The DevEx is already so good here that you can focus on operational excellence - logging, metrics, analytics, alerting etc. which will lead to a better end user experience. Not to mention all problems as they arise can be isolated and fixed quickly in a single shot.

A full working project is available on [github.com/rocky-jaiswal/htmx-app](https://github.com/rocky-jaiswal/htmx-app). Have fun!
