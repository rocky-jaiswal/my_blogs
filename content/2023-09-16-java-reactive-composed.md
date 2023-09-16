---
title: 'Reactive composition in Java using Spring / Micronaut'
tags: FP, Java
date: 16/09/2023
---

### Introduction

Back in the day I did a lot of Java (2002-2010), it was the de-facto technology for building applications specially since there was not a lot of competition (apart from C#, but let’s stick to the Open Source ecosystem).

Then Ruby on Rails came into the scene for me, it offered so many features and ease of development that it made Java look like a primitive technology. Of-course people later realized that Ruby itself had some problems, it was slow and hard to scale. All of these languages anyways have changed in 2023 but the basic premise still remains, for a limited number of concurrent users RoR will help you build a web application pretty quickly but the Java application will provide more control / scalability.

Then came Node.js, around 2015-16 things started to take off, it sort of provided the speed of development of Ruby but on top with the “async” model it provided tremendous scalability. A small Node.js server running on 1 CPU and 512 MB RAM can take on some serious load. I personally have built a few Node.js services which take on millions of request a day and are running on 3-5 micro instances on AWS.

It seems now lately Java has improved a lot, Java 17 has closed a lot of gap between languages like Kotlin (which is what I loved working on in my free time) and also with the introduction of “Virtual Threads” the future of Java looks bright. Spring Boot allows developers to avoid a lot of boilerplate (in exchange of “magic” like Rails does) and offers a seriously good platter of features. So perhaps it is time to have a re-look at Java.

But since I like a little bit of FP, Async style of code let us look at some ways to do this in modern Java using Spring / Micronaut.

### Blocking is wasteful

Copy-Pasta below from [Quarkus Guides](https://quarkus.io/guides/getting-started-reactive) -

\*In the traditional and imperative approach, frameworks assign a thread to handle the request. So, the whole processing of the request runs on this worker thread. This model does not scale very well. Indeed, to handle multiple concurrent requests, you need multiple threads; and so your application concurrency is constrained by the number of threads.

In addition, these threads are blocked as soon as your code interacts with remote services. So, it leads to inefficient usage of the resources, as you may need more threads, and each thread, as they are mapped to OS threads, has a cost in terms of memory and CPU.\*

The 2 paragraphs above for me are the “Achilles heels” of server-side Java, each request is processed by a “Thread”. Threads somehow relate to the number of CPUs, each thread can also be wasting it’s time waiting on I/O, so in worst case scenario - you have many concurrent users and heavy I/O, then Java can be a bad choice since you will need to throw hardware to solve performance issues while at the same time the CPUs are not fully utilized. We do not want this in 2023 since we have to pay “cloud bills”.

One main thing to note here is that this problem kicks in when we have heavy I/O since the request handling thread is just waiting while at the same time requests are piling up. This waiting can be due DB calls, or network requests etc. In a world where there are a lot of services calling each other (microservices) this problem is very common.

But worry not the folks at Java say - we have a “Reactive” model. All major Java frameworks acknowledge this problem and provide a solution (like Spring Webflux). Also see [Asynchronicity to the Rescue?](https://projectreactor.io/docs/core/release/reference/index.html#_asynchronicity_to_the_rescue)

![interconnected pipes](/images/pipes_16092023.png)

### Experiment with Spring & Micronaut

So let's get started with a simple example. We will create a request handler that will -

- Do a simple request validation
- Then query the DB for the users emails and some other details
- Another DB query to get the "cities of interest" of this user
- For each of these cities we will call a remote service to get the weather (min / max temperature)
- Finally, we aggregate all this data and send back a response to the user

The main thing to note here is that ideally the DB queries and the HTTP calls should be made in parallel. Let us assume that things are bad and querying the DB takes 2 seconds and getting the weather for a city takes 3 seconds. So if we do this in a traditional main thread linear style we are looking at 2 (DB query for email) + 2 (DB query for cities) + 2 \* 3 (assuming there are 2 cities and HTTP call for each takes 3 seconds) = 10 seconds of total response time (at-least).

If we were to do this in async style we can do all this in 5 seconds since the DB calls and the HTTP call can be made in parallel. This saves us a huge 5 seconds in response time just for this example. Not to mention the server can handle new requests while it is waiting on I/O.

Also in the Java world there is no such thing as "async / await" like Node.js and we do not want our "reactive / async" code to look very different from the normal linear code. If we were to do this in a callback / [CompletableFuture](https://www.baeldung.com/java-completablefuture#bd-Combining) style this can be done without any library but the code would be an eyesore (like Node.js with the callback style of 2004). To solve this problem we use [Project Reactor](https://projectreactor.io/docs/core/release/reference/index.html). I will not go into the details of Mono / Flux since there is enough documentation out there.

So without much ado, here is the main "controller" code -

    @Controller("/v1/user-settings")
    @AllArgsConstructor
    public class UserSettingsController {

        protected final UserService userService;
        protected final UserValidationService userValidationService;
        protected final WeatherService weatherService;

        @Get("/{userId}")
        public Mono<UserSettings> getUserPreferences(String userId) {
            return userValidationService
                    .isValidUserId(userId) // --> 1
                    .flatMap((var userIdUUID) -> {
                        var monoOfUser = userService.findByUserId(userIdUUID); // --> 2a
                        var monoOfUserPreferences = userService.findPreferencesByUserId(userIdUUID); // --> 2b
                        var fluxOfUserCities = userService.findCitiesByUserId(userIdUUID); // --> 2c

                        return Mono.zip(monoOfUser, monoOfUserPreferences, fluxOfUserCities.collectList()); // 3
                    })
                    .flatMap((Tuple3<User, UserPreference, List<UserCity>> tuple) -> {
                        var cities = tuple.getT3();
                        var fluxOfWeather = Flux
                          .fromIterable(cities)
                          .flatMap((var city) -> weatherService.getWeather(city.getCityName())); // --> 4

                        return Mono.zip(Mono.just(tuple.getT1()), Mono.just(tuple.getT2()), fluxOfWeather.collectList());
                    })
                    .flatMap((Tuple3<User, UserPreference, List<Weather>> tuple) -> {
                        var userSettings = new UserSettings(
                                tuple.getT1().getEmail(),
                                tuple.getT2().isMember(),
                                tuple.getT3());

                        return Mono.just(userSettings); // --> 5
                    });
        }
    }

Now with this style the first major win we have is that the code is composed of small functions, the business logic is written in the smaller "service" classes and at the controller level we just aggregate the calls/data.

Let's quickly look at the code.

1. We make a simple check that the user id is valid or not.
2. This feeds into a function which -

- a. Queries the DB for user details
- b. Queries the DB for user preferences
- c. Queries the DB for user cities
- d. The code is written in very linear style (no callback hell)
- e. Yet all of these queries are made in parallel

3. We "zip" this data up for the next step / stage
4. We have the cities now, we create a "Flux" to request the weather for these cities

- Again all of these calls are made in parallel, we do not have to write some special code

5. We simply aggregate this data and send it back.

So we see our code style is very similar to the synchronous style but we are easily doing things asynchronously. The main catch is this style of coding takes some getting used to (having some experience in Node.js or flatmapping Monads helps) and most importantly if we were to introduce any "blocking" code in this pipeline we will be in bad bad place (pretty similar to Node.js).

### Spring vs Micronaut

I did this experiment both in Spring Webflux and Micronaut since why not 😄

[Spring Code](https://github.com/rocky-jaiswal/spring-api)

[Micronaut Code](https://github.com/rocky-jaiswal/micronaut-api)

Some things I observed -

- Spring Webflux is of-course more mature and has more documentation
- Spring Webflux however uses R2DBC while Micronaut works on the more standard Hibernate Reactive library
- The startup time of Micronaut is much faster since most of the DI magic happpens at compile time
- The runtime performance of both the frameworks is similar and both have a "Reactive" HTTP client (Micronaut might win on memory usage at runtime)

So that is it, I hope you now better understand the advantages and pitfalls of Reactive Java. It is surely powerful but takes some getting used to.
