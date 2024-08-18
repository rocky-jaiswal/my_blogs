---
title: 'Why Kotlin?'
tags: Kotlin
date: 27/04/2024
---

This is another short post simply because this is an opinion and not a huge topic. I am working with Java again for a while and Java 21 does make me happy but I miss some things from Kotlin so I thought I should put my thoughts in a post.

Programming language preferences are quite subjective so I have tried to divide this post in two sections - one which I consider "objective" or clear advantages and one section of "subjective" or personal preferences.

Let's start with what I consider objective or clear advantages of using Kotlin over Java.

![Kotlin Java](/images/kotlin_java.png)

## Null safety

Often referred to as a "billion dollar mistake", null pointer exceptions (NPEs) are common in Java. For a language that is very strong on "types" there is still a huge problem with "null". Java on its part has tried to solve it with [Optional](https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html) and some annotations (JSR-380) but the problem is not properly addressed and there is no consensus in the community.

Kotlin on the other hand, has clear types and solutions for null out-of-the-box -

    var str: String = "abc" // cannot be set to null
    var str: String? = "abc" // can be set to null

Then, you have some syntax sugar on top -

    val b: String? = null
    b?.length // safe operator
    val l = b?.length ?: 0 // the Elvis operator :)

With these simple changes, we see a huge benefit in day-to-day code and fewer unexpected nulls. If we are careful we can detect & eliminate a lot of NPE at compile time.

## Immutability

After "null" this is perhaps the most important feature for me. Kotlin's clear `val` based declarations are not only concise but give the peace of mind that a variable cannot be mutated. With a little bit of care, we can use immutable fields, parameters, collections and **data classes** with "vals"

    data class User(val name: String, val age: Int) // cannot change fields once created

All this makes immutability easy and with some care we can always deal with immutable objects, parameters and fields unless needed. Mutability is still possible when needed but Kotlin makes it easy to isolate, identify and minimize it.

## Structured Concurrency

This is also a big one. Java has a good multi-threading story but when it comes to "asynchronous" operations the developer experience is not so great. You either go with "CompletableFuture" or "Reactive" programming models for example, both of which are good enough but not so easy to use / setup. Kotlin on the other hand has in-built Coroutines, which makes async programming much easier.

Let's take an example - A user signs up, we insert a record in the DB, then there are few things which we need to do but can be done in the background, let's say - send the user an email and send a request to a CRM system. The last two calls can also be done in parallel.

The Kotlin code for doing things in the background and/or in parallel is simple and does not need a lot of lines. The example requirement above can be written as -

    private fun <T> runVirtual(context: CoroutineContext = EmptyCoroutineContext, block: suspend CoroutineScope.() -> T): T =
        Executors.newVirtualThreadPerTaskExecutor().use { threadPool ->
            runBlocking(context + threadPool.asCoroutineDispatcher(), block)
        }

    class AsyncDemo {

        suspend fun insertUserInDB(): Int {
            delay(1000) // pretend we are doing something asynchronous here
            println("inserting user in DB ...")
            return 101
        }

        suspend fun sendEmail(): String {
            delay(2000) // change me to change the delay
            println("sending an email ...")
            return "email_receipt"
        }

        suspend fun updateCRM(): String {
            delay(3000)
            println("calling CRM ...")
            return "crm_response"
        }
    }

    // main function
    fun main() {
        val demo = AsyncDemo()

        val start = Instant.now().toEpochMilli()

        runVirtual {
            demo.insertUserInDB()
            val res1 = async { demo.updateCRM() }
            val res2 = async { demo.sendEmail() }

            println(res1.await())
            println(res2.await())
        }

        println("${Instant.now().toEpochMilli() - start} millisecs consumed")
    }

We can play around with the `delay` numbers and `async` blocks to see that the total time to execute the program depends on what is run asynchronously or in parallel. As you can see this setup is easy to develop and easy to understand which is not the case with Java.

You can also "launch" thousands of Coroutines with no problem -

    fun main() {
        val demo = AsyncDemo()

        val start = Instant.now().toEpochMilli()

        runVirtual {
            (1..100000).forEach {
                launch(Dispatchers.Default) {
                    demo.insertUserInDB()
                }
            }
        }

        println("${Instant.now().toEpochMilli() - start} millisecs consumed")
    }

The code above ran on my laptop easily in a few seconds and used all my CPU cores without taxing the memory. _Although some knowledge is needed to understand Dispatchers, Couroutine Context etc._

## Some subjective opinions

- The FP story is much better, you can have functions inside functions, functions outside classes, you do not have to explicitly declare the interface for a function / lambda.
- Kotlin is much easier with collections with a functional approach. No need for streams, you can simply do things like

```
  numberStrings
    .map { it.first }
    .map { Integer.parseInt(it) }
    .fold(1) { acc, i -> acc * i }
```

- Kotlin is well supported by Spring & Micronaut, so the big frameworks are there in case you need them.
- The syntax is very close to TypeScript. So if you are working on a TypeScript frontend, the switch to backend is not huge. `async` and `await` developers will feel right at home.
- Some great FP libraries like [Arrow](https://arrow-kt.io/) exist and provide solid features if you need them.
- Finally, with Type Inference, no semi-colons and some syntatic sugar Kotlin feels much terse and easy to read.

## What I miss

Currying is not so easy, at-least not as easy as TypeScript.

```
  fun addCurried(a: Int): (Int) -> Int {
    return { b -> a + b }
  }
  println(addCurried(2)(3))
```

vs TypeScript

```
  const addCurried = (a: number) => (b: number) => (c: number) => a + b + c;

  console.log(addCurried(add(2)(3)(5)))
```

## Conclusion

So there you have it, Kotlin certainly adds some great features on top of Java and justifies its adoption. The only downside is you move away from a language that has been there for the last 25+ years, but with the JVM and Google's support for Kotlin I feel that Kotlin is not going anywhere as well, and the developer experience is much better than Java.
