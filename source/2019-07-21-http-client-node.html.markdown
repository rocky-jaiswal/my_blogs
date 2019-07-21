---
title: 'HTTP client experiments in Node + JVM'
tags: Node.js, Kotlin
date: 21/07/2019
---

With almost everyone developing on a microservices architecture, HTTP clients are one of the most used libraries in projects. So while developing a service which calls another service, a question arose - **"What if I do an http request without an await in Node.js?"** Is there such a thing as fire-and-forget with http clients? Most of you already know the answer but I wanted to be sure.

So let's start with a small experiment then, if I were to write a simple endpoint which calls another endpoint (without **await**) it would look something like -

    // handler.js
    {
      method: 'GET',
      path: '/nodefast',
      handler: (request, \_) => {
        axios.get('http://localhost:7000/javaslow');
        return { result: true };
      }
    }

This is in itself an endpoint that is fast to respond but it calls another endpoint which is slow. The important thing here is that we have no **await** or **Promise.then**, we just fired a request and do not really care about the result. The endpoint that this service calls is something like -

    // SlowHandler.kt
    object SlowHandler {

        fun get(ctx: Context): Context {
            Counter.incrementAndLogHit()
            Thread.sleep(5000) // <-- I am slow and I sleep for 5 seconds
            return ctx.json(mapOf("message" to "all ok"))
        }
    }

To complete this random, highly unregulated experiment let us hit this Node endpoint with a few requests -

    ab -n 2000 -c 10 "http://localhost:3000/nodefast"

That's 2000 total requests, 10 at a time so nothing too crazy. The good part is that all of these requests are successful in themselves and respond within 1.5 seconds! However how many successful requests you think were made to the slow JVM+Kotlin service. The answer is (based on several runs I did) - less than 1500. **That means over 25% of the requests were lost!** To top it the Node process also crashes in some time with something like -

    Error: socket hang up

This is after having no await, with "await" of-course the test will take ages to run since each request takes at least 5 seconds to respond. So there is some value in not waiting (if applicable), but even if we do not wait Node internally allocates memory and sockets to the requests and since there is no such thing as fire-and-forget in TCP/HTTP the Node internals keep resources allocated until a response is received. This is the **backpressure** problem in Node, a great article on this topic can be [read here](http://engineering.voxer.com/2013/09/16/backpressure-in-nodejs/). So essentially we cannot just make http requests in Node and assume that if we do not "wait" for them they have no cost, Node is not smart enough is manage its resources this way. **A slow endpoint downstream therefore still has the potential to bring down an upstream server.**

With the main experiment done and in the name of science and technology we decide to explore one step further - what if we flip the services around, what if we have a JVM + Kotlin service that calls a slow Node.js service. Is the JVM better at managing its resources and is Node.js a better server than a client? The answer I found to both of these questions seems like a - **yes**.

The sample code is below -

    // FastHandler.kt
    object FastHandler {

        val client = HttpClient.newBuilder().build()
        val request = HttpRequest
                .newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .uri(URI.create("http://localhost:3000/nodeslow")) // Call the slow node endpoint
                .build()

        fun get(ctx: Context): Context {
            Counter.incrementAndLogHit()
            client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
            return ctx.json(mapOf("message" to "all ok"))
        }

    }

And the Node side -

    {
      method: 'GET',
      path: '/nodeslow',
      handler: async (request, h) => {
        await Promise.delay(5000);
        hit += 1;
        await writeFile(`${__dirname}/hits.txt`, hit + '\n');
        return { result: true };
      }
    }

Similar load but this time we hit the JVM service first -

    ab -n 2000 -c 10 "http://localhost:7000/javafast"

After multiple runs I saw that not only the JVM did not crash or consume enormous amounts of memory, the Node server received all 2000 requests and logged them successfully. So the JVM has a better HTTP client + resource managment setup and Node does have a solid HTTP server setup to handle big I/O loads. You cannot say the same about Node HTTP clients though. Hope this was fun, happy coding!
