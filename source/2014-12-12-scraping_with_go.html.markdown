---
title: "Building a simple scraper with Go"
tags: Go
date: 12/12/2014
---

I have been trying to learn [Go / Golang](https://golang.org) lately and find it really exciting. The things that I find really good about Go are -

- Easy learning curve (with good documentation)
- Rich standard library
- Concurrency is not an after-thought but is dealt with in a right manner (without relying on any external library)
- Excellent performance plus the language is easy on system resources
- Generates executables on builds so easy on ops (you can have a production server with nothing but Linux+SSH installed)
- Fast compilation times

One of the things I struggled a bit with was setting up packages and dependencies. With Ruby this is done by Bundler, with node there is npm and so on. With Go, there is no offical solution there yet, so I looked around and finally I was satisfied with [gmp + gvp](https://github.com/pote/gpm). This means writing a simple file called Godep, running a couple of commands and voila the libraries are installed locally within the project, rather than globally (and thus also avoiding versioning headaches).

To start our project off, we need a couple of libs / packages, so lets create a directory called scrappy with a file called Godep having the contents -

	github.com/daviddengcn/go-colortext
	github.com/PuerkitoBio/goquery

In this directory we need to run -
		
	source gvp
	gpm install

A simple Go program (using an external package) would look like -

	package main

	import (
		"fmt"
		ct "github.com/daviddengcn/go-colortext"
	)

	func main() {
		printWelcome()
	}

	func printWelcome() {
		ct.ChangeColor(ct.Magenta, true, ct.White, true)
		fmt.Println("Welcome to Scrappy!")
		fmt.Println("===================")
	}


We can run this with -

	go build && ./scrappy

Now, we want to build a simple scraper, for demo purposes I will fetch all Bollywood movies released in the last five years from wikipedia. Using [goquery](https://github.com/PuerkitoBio/goquery) this is quite easy.

Go code is organized in packages, a package can have many files, the main package is called (erm..) "main" and you can import other packages as well. If the name of the function starts with a capital letter it is exported, otherwise not. Keeping this in mind we can create a simple scraper -

	package scraper

	import (
		"github.com/PuerkitoBio/goquery"
		"net/http"
	)

	type Scraper struct {
		url      string
		document *goquery.Document
	}

	func NewScraper(url string) *Scraper {
		s := new(Scraper)
		s.url = url
		s.document = s.getDocument()
		return s
	}

	func (s *Scraper) Find(selector string) []string {
		selection := make([]string, 10)
		s.document.Find(selector).Each(func(i int, s *goquery.Selection) {
			selection = append(selection, s.Text())
		})
		return selection
	}

	func (s *Scraper) getDocument() *goquery.Document {
		resp := s.getResponse()
		defer resp.Body.Close()
		doc, err := goquery.NewDocumentFromResponse(resp)
		if err != nil {
			panic(err)
		}
		return doc
	}

	func (s *Scraper) getResponse() *http.Response {
		resp, err := http.Get(s.url)
		if err != nil {
			panic(err)
		}
		return resp
	}

Now we can use this package in our main package -

	package main

	import (
		scraper "./scraper"
		"fmt"
		ct "github.com/daviddengcn/go-colortext"
	)

	func main() {
		printWelcome()

		years := []string{"2009", "2010", "2011", "2012", "2014"}
		for _, year := range years {
			ch := make(chan []string)
			go scrape("http://en.wikipedia.org/wiki/List_of_Bollywood_films_of_"+year, "table.wikitable i a", ch)
			selection := <-ch
			printMovies(selection)
		}
	}

	func scrape(url string, selector string, ch chan []string) {
		scraper := scraper.NewScraper(url)
		selection := scraper.Find(selector)
		ch <- selection
	}

	func printWelcome() {
		ct.ChangeColor(ct.Magenta, true, ct.White, true)
		fmt.Println("Welcome to Scrappy!")
		fmt.Println("===================")
	}

	func printMovies(movies []string) {
		ct.ChangeColor(ct.Blue, true, ct.White, false)
		for _, movie := range movies {
			fmt.Println(movie)
		}
		fmt.Println("___________________")
	}

What is cool about Go is that that starting a light-weight thread (or goroutine) and executing a function is as simple as calling - __go f(x, y)__ instead of the regular f(x, y). Built in construct called channels can help the goroutines synchronize. Remember, _do not communicate by sharing memory, but share memory by communicating_. We use this to scrape each wikipedia page in a separate goroutine and finally sync with the channels.

This is quite similar to the Actor approach Scala and Erlang take. However, the difference between the Actor concurrency approach is that each Actor has its own inbox for communicating, whereas Go uses a central bus / channel for communication. I am really happy with my experiments in Go, whats more it is a very new language and can only improve with each release.
