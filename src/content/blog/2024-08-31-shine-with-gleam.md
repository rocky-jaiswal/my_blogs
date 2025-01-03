---
title: 'Shine with Gleam'
tags: Gleam
date: 31/08/2024
---

I have been programming for almost 22 years now professionally (for fun since 1995 or so) and I still enjoy it. What I also enjoy is finding new tools, exploring new programming languages and exploring new ways of doing things. I have worked on a few programming languages, and more or less as of 2024 I have found I enjoy a certain "golden path" when I program. This is not to say that other ways or tools are bad but for me some things barely work and some things feel more safe and productive.

## Strong opinions, loosely held

To give a quick description of what I enjoy and what I look for in my tooling -

- Separation of code and data

  - I think I have suffered more with the OOP philosophy of mixing functions and data in a class and passing messages around objects to build features, this mostly leads to a complex dependency graph (or call it a mess) and bugs are hard to track and fix. Add in data mutability and it feels that all code is running on some hopes and wishes and a change away from **"BOOM!"**.
  - Just looking at OOP code, most of the time I do not feel confident of what it does.
  - So I prefer a functional style, ideally **immutable** data passed through a series of functions, the functions are small and do a clear thing, they have clear signatures and clear types also help here.
  - With this style, to develop a feature I can compose small functions together, and usually I can look at 1-2 main functions to understand how a code path works.
  - The smaller functions can be unit tested, and the composed function can be integration tested giving a lot of confidence that the codebase works.

- Support for functional style

  - Of course given the points above, I would prefer a functional language with support to write functions as the main "stars", no need to put them in classes, no need for extra ceremony, it is easy to pass them around, curry them etc.
  - It should be easy to compose functions. I like my function pipes!
  - I also would prefer immutable data and a rich collections library. Just looking at the [Clojure cheat sheet](https://clojure.org/api/cheatsheet) makes me happy and is probably the perfect example. Rich collections and functions on them and yet simple enough to be laid out in 1 readable page.

- Support for structured concurrency

  - I want to do things concurrently, wait for all results or wait for the first result and things like that
  - I want to do concurrency with ease and confidence, no need to worry about deadlocks, data corruption etc. all without much boilerplate
  - I do not care about 2 coloured functions as long as the job can be done as I described above

- Type support

  - Having "Types" on big projects is nice
  - Clear nullable / nil types
  - Having union types, interfaces etc. is super helpful
  - "Container" types like Option, Either etc. are really good to have

- A good build tool

  - Ideally I would just like to have a JSON / YAML / TOML like file to describe my project, add dependencies, declare tasks (which can be written in shell or the same language I am programming in)
  - Support for testing built-in or with a popular library
  - Support for multiple modules, monorepo, workspace etc. would be great
  - It's 2024 and I want a clear opinionated formatter and linter

- Pattern matching

  - Rich pattern matching, FP and immutable data are a great match together

- In-built support for JSON / HTTP

  - It should be easy to parse / generate JSON
  - It should be easy to consume HTTP and build a HTTP server

- LSP support

  - I want to be able to use VSCode, Emacs or NeoVim. I do not want to be tied to any IDE. Between a good text editor and the terminal everything should work.

- Garbage Collection is nice

  - I do not usually program at the system level. I trust people smarter than me to do my memory management.
  - I like the JVM and the V8 based languages since I have been using these for years.

- Last but not least, I want to be paid and build software that is used

  - It would not matter if I learned a great language I am happy with, but struggle to find a job given my nationality, passport and education

Given these strange preferences (& constraints) I can deal with TypeScript, Kotlin, Go and maybe Ruby & Python (for small projects). None of them are perfect though, TypeScript has an immutability problem, Kotlin relies on Gradle + IDE and Go can get ugly at times ... and I can go on. Plus, I do not know enough about Elixir or F# or OCaml or Rust to be a good judge, hopefully in the future this changes.

## Well, hello Gleam!

So when I learned about [Gleam](https://gleam.run/) I was intrigued. It seemed to check most of the boxes and the core language is simple enough to be learned in a week. So I set out to build a simple project which perhaps can teach me and you on why I feel excited for the future of Gleam.

![Shiny pup](/images/gleam_happy_pup.png)

So we will build a small program which ensures we cover some Gleam features and things I mentioned above -

- We have a list of cities in a CSV file
- We will parse the file and for each of the city, call in a HTTP service to get the minimum / maximum temperature
- To save time, we will call this service concurrently for all cities
- We will parse the JSON response
- At the end we will find and print the hottest city

This will cover a few things like file parsing, concurrency, HTTP usage and so on.

Getting started with Gleam is easy, I recommend using [Nix](https://rockyj-blogs.web.app/2024/08/17/deno-nix.html) if you want to keep a clean package setup. Creating, running, testing and adding dependencies is all built-in, check out this [page](https://gleam.run/writing-gleam/) for reference.

My project is [available here](https://github.com/rocky-jaiswal/hello_gleam).

We will focus on the "main" function. Since the smaller functions are easily readable and do simple things like read a file, or sort a list I will not show them in this post.

My first attempt at the main function is messy but perhaps what came naturally given I did not know much.

    pub fn main() {
      io.println("Finding hottest city...")

      // read cities
      // build requests
      // make requests in parallel
      // get hottest city


      let cities = result.unwrap(read_cities_from_file("cities.csv"), [])
      let reqs = build_requests(cities)

      let lst_city_temp = case reqs {
        Ok(lst_res_req) -> {
          make_requests_async(lst_res_req)
        }
        Error(err) -> {
          io.debug(err)
          Error(json.UnexpectedEndOfInput)
        }
      }

      let answer = sort_results(result.unwrap(lst_city_temp, []))


      io.debug("Answer is - " <> answer)
    }

This is our first encounter with [Result](https://hexdocs.pm/gleam_stdlib/gleam/result.html) and [pattern matching](https://tour.gleam.run/flow-control/case-expressions/). Gleam is opinionated, there is a great "Result" type to express things which can work or not, and there is no "if" just a powerful pattern matching feature. So most of the time we can do something and return a result and deal with the result. In this case we parse a CSV file which can of course fail and we deal with the result returned. This first version of code is bad, since sometimes we handle the result in the main function and sometimes in the [smaller functions](https://github.com/rocky-jaiswal/hello_gleam/blob/7a75ec54e250da7348259296caf8d59fb877c483/src/hello_gleam.gleam).

Let's improve it -

    pub fn main() {
      io.println("Finding hottest city...")

      // read cities
      // build requests
      // make requests in parallel
      // parse response
      // get hottest city


      let cities = result.unwrap(read_cities_from_file("cities.csv"), [])
      let reqs = result.unwrap(build_requests(cities), [])
      let responses = result.unwrap(make_requests_async(reqs), [])
      let cities = result.unwrap(parse_responses(responses), [])
      let answer = result.unwrap(sort_results(cities), "")


      io.debug("Answer is - " <> answer)
    }

In the version above, each smaller function returns a clear "Result" and we deal with the result/error using [result.unwrap](https://hexdocs.pm/gleam_stdlib/gleam/result.html#unwrap). This already gives me an idea, this is cleaner code but repetitive. How can we handle these results better? Also note the output of the last function feeds as the input to the next function, this reminds of my favorite thing - "Pipe". The full code is [here](https://github.com/rocky-jaiswal/hello_gleam/blob/69455e4aee8fcb24e060855c2624694973dd1859/src/hello_gleam.gleam).

Let's deal with results better and add pipes.

    pub fn main() {
      io.println("Finding hottest city...")

      // read cities
      // build requests
      // make requests in parallel
      // parse responses into a list of cities and their temperatures
      // get hottest city

      let answer =
        "cities.csv"
        |> read_cities_from_file
        |> result.map(build_requests)
        |> result.flatten
        |> result.map(make_requests_async)
        |> result.flatten
        |> result.map(parse_responses)
        |> result.flatten
        |> result.map(sort_results)
        |> result.flatten
        |> result.unwrap("Error!")


      io.debug("Answer is - " <> answer)
    }

And voila! A single input and a single output all connected with a series of piped functions, ignore the "flattening" and we essentially have -

    let answer =
      "cities.csv"
      |> read_cities_from_file
      |> result.map(build_requests)
      |> result.map(make_requests_async)
      |> result.map(parse_responses)
      |> result.map(sort_results)
      |> result.unwrap("Error!")

    io.print("Answer is - " <> answer)

Full code is [here](https://github.com/rocky-jaiswal/hello_gleam/blob/main/src/hello_gleam.gleam).

**Result#map (or Result#then)** is our piping friend. The code above is expressive, readable, testable and has clear small functions all composed together. Pretty much what I wanted to do, and all do-able with clean typed functions, immutable data, minimum fuss and ceremony.

## Final words

So you can see why I feel happy about Gleam. Of course it is not perfect, the "flattening" above seems unnecessary but I could not avoid it since "Result#map" wraps the Result in another Result (I could not find a flat_map). So there are some rough edges which I am uneducated about.

Gleam works on an Erlang or JavaScript backend, but you have to choose one. I could not easily work with Promises (wrapped in Result) in JS so building a backend with Gleam + JS was not an easy task, you are better off with Gleam + Erlang for backend and Gleam + JavaScript for frontend, which is kind of like the Clojure + ClojureScript situation.

I am also not an Erlang expert so I feel the language is not a "professional" option for me since I will struggle with using the Erlang ecosystem but for now Gleam seems like great language to explore and try new things.
