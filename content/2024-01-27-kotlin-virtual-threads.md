---
title: 'Virtual Threads on Kotlin'
tags: Kotlin
date: 27/01/2024
---

So this is a short post. JDK 21 released recently with a huge feature - "Virtual Threads". I will not go into the details of Virtual Threads but basically these are lightweight threads that easily can be spun up in great numbers, even millions, all running in the same Java process. This is quite exciting, so I wanted to try this feature out in Kotlin and see how it compares to Kotlin "Coroutines". The code below is not a great example, since Vitrual Threads are suited for IO operations but it just gives an idea of how to use VTs in Kotlin and observe the performance.

![Threads](/images/threads_spinning.png)

To play around we will use a parallel-izable problem like Pi calculation. I have done this before [in Elixir](/2016/06/19/elixir_pi_calc.html), the formula we will use and parallelize is -

![Pi calculation formula](/images/pi-formula.png)

So let us first run it with VTs in Kotlin -

    package dev.rockyj

    import java.time.Instant
    import java.util.concurrent.ConcurrentHashMap

    class PiCalculator {
        private val chunkSize: Int = 100000

        fun calculateChunk(num: Int): Double {
            val last = num * chunkSize
            val chunk = ((last - chunkSize + 1)..last).toList()
            return chunk.map { Math.pow(-1.0, it.toDouble()) / ((2 * it) + 1) }.sum()
        }
    }

    fun main() {
        val start = Instant.now().toEpochMilli()
        val map = ConcurrentHashMap<Int, Double>()
        val calculator = PiCalculator()

        val threads = (1..10000).map {
            Thread.startVirtualThread {
                val sumOfChunk = calculator.calculateChunk(it)
                map.put(it, sumOfChunk)
            }
        }
        threads.forEach { it.join() }

        println((1 + map.values.sum()) * 4)
        println("This took - ${Instant.now().toEpochMilli() - start} milliseconds")
    }

Here we are spinning up 10,000 VTs, with each thread doing a small amount of work (calculating and summing up 100,000 decimals). On my Ryzen 5 (6 cores) HP laptop this takes around 7500 milliseconds and of-course all my CPU cores were lit up.

Let us now see the coroutine implementation -

    package dev.rockyj

    import kotlinx.coroutines.Dispatchers
    import kotlinx.coroutines.launch
    import kotlinx.coroutines.runBlocking
    import java.time.Instant
    import java.util.concurrent.ConcurrentHashMap

    class PiCalculator {
        private val chunkSize: Int = 100000

        fun calculateChunk(num: Int): Double {
            val last = num * chunkSize
            val chunk = ((last - chunkSize + 1)..last).toList()
            return chunk.map { Math.pow(-1.0, it.toDouble()) / ((2 * it) + 1) }.sum()
        }
    }

    fun main() {
        val start = Instant.now().toEpochMilli()
        val map = ConcurrentHashMap<Int, Double>()
        val calculator = PiCalculator()

        runBlocking {
            (1..10000).forEach {
                launch(Dispatchers.Default) {
                    val sumOfChunk = calculator.calculateChunk(it)
                    map.put(it, sumOfChunk)
                }
            }
        }

        println((1 + map.values.sum()) * 4)
        println("This took - ${Instant.now().toEpochMilli() - start} milliseconds")
    }

The code is pretty similar to VTs, here we spin up 10,000 coroutines doing the same work. Based on a few (completely unscientific) runs this code also took almost the same time, so that's that! However, if I do not provide a default dispatcher, as in if I just run -

    runBlocking {
        (1..10000).forEach {
            launch { // no dispatcher provided
                val sumOfChunk = calculator.calculateChunk(it)
                map.put(it, sumOfChunk)
            }
        }
    }

This code takes significantly longer to complete, which is weird since the documentation says that if no dispatcher is provided the "Default" dispatcher is used. However, no matter how many times I did this I ran into this problem consistently which makes me wonder about the pitfalls of using coroutines without completely understanding them.
