---
title: 'Result is all I need'
tags: JVM, Kotlin, FP
date: 25/10/2025
---

It has almost been a year since I last made a post. With everything in software development going the AI way and the small ideas I had, when I tried to put them in Claude I usually got the post I wanted to make in a few seconds. So it was kind of demotivating to spend hours on doing some research when people can get the same answer from AI anytime in seconds.

Having said that, I still do not feel AI is there yet - yes, it is very good with small boilerplate stuff (and even then around 80% of the time) one cannot leave all development to AI if you really care about quality. Speaking of code quality, one major theme with AI churning out code is - __code organization__. Yes, AI can write code but if the code organization is not good, not only AI outputs worse code but at the end of the day code is all over the place - unreadable and unmaintainable.

So how do I personally look at code organization? There is no single or golden way, but working on mostly APIs and Web applications I tend to divide code based on some principles -

- Classes / modules / namespaces provide grouping of functions
- Some classes are just pure data buckets, have as many of them as needed and do not put logic in them
- Group logic holding classes / namespaces / modules by cohesive roles
  - It should be easy to look at a class / namespace / module __name__ and guess its functions
- Divide and conquer, e.g. isolate the interfaces of the outside world from the internal logic
- Interface level code or foundational code -
  - Controller classes for REST API (for example)
  - Database code (examples) - Entities & Repositories
  - HTTP Clients
  - Other external interfaces like Kafka, SQS etc.
  - Configuration classes e.g. reading secrets from AWS Secret Manager
  - All these classes should be as stateless and isolated as possible, e.g. the kafka connection class should have no idea about the DB Connection and vice versa
  - This code should also not care about business logic, it should only care about its own interface / contract
- Service level code -
  - Provide business logic on top of the interface code
  - Again as simple and stateless as possible, e.g. a function to create user in DB if none exists, push a message to SQS under certain conditions, upload a file to S3 etc.
  - At the end of the day the functions declared in the services should be "small" - do only 1 thing in 1 function
- Now we have the "foundational code" and the "service level code"
  - The only thing that remains is some "boilerplate stuff" like - logging, authorization checks etc. which can be sprinkled across code
  - All of this is very unit testable on its own
  - But something still needs to tie this all together
- All this goes back to most of my previous posts -
  - If all we can do is compose functions together, we are good!
  - Which now means, if we can confidently tie all our "service functions", we can easily get our final working business logic
  - A "Result" is a neat object which is great at tying code together


So now, let us look at ways to write this final code which ties everything together. Assuming our service level code looks like this (not going deeper into the foundational code) -

    // AuthService.kt

    fun userExists(email: String): UUID? // -> finds a user by email or returns null
    
    fun register(
        inputEmail: String,
        password: String,
    ): UserDTO // -> creates a user or can throw exception

    fun verify(
        email: String,
        password: String,
    ): UUID? // -> verifies a user email and password, can return null or throw exception

We see with these function signatures when we will tie them all together we will need to handle -
- Exceptions
- Null values
- And a mix of both

So in an imperative style, this looks something like -

    @Service
    class AuthCommand(
        private val jwt: JWTService,
        private val authService: AuthService,
    ) {
        fun register(registrationRequest: UserRegistrationRequest): UserDTO {
            val existingUserId = authService.userExists(registrationRequest.email)

            if (existingUserId != null) {
                throw RuntimeException("user already exists")
            }

            try {
                val user = authService.register(registrationRequest.email, registrationRequest.password)

                return user
            } catch (exception: Exception) {
                // log exception
                throw exception
            }
        }

        fun login(loginRequest: LoginRequest): String {
            try {
                val verifiedUserId = authService.verify(loginRequest.email, loginRequest.password)
                    ?: throw RuntimeException("user not found")

                val token =
                    jwt.signJWT(
                        "$verifiedUserId",
                        audience = "app",
                        expirationMinutes = 60,
                        customClaims = null,
                    )

                return token

            } catch (exception: Exception) {
                throw exception
            }
        }
    }

While this code works, as the checks increase it is littered by `if`, `try`, `catch` statements which also will introduce mutability and although the core logic is 2-3 lines, we deal with the null checks and errors time and again. What really makes this worse is that in every such code which ties things together, we deal with these same problems again and again in slightly different ways.

If only there was a way to not care about null checks, errors and re-invent the wheel all the time. Enter - __Result__!

Without going into the formal definition of a "Result", consider it as a "wrapper" which internally handles null checks and exceptions so our code looks like -

    @Service
    class AuthCommand(
        private val jwt: JWTService,
        private val authService: AuthService,
    ) {
        fun register(registrationRequest: UserRegistrationRequest): UserDTO {
            return success(registrationRequest)
                .flatMap { validRequest ->
                    throwIfExists(authService.userExists(validRequest.email))
                }.flatMap {
                    runWithSafety { authService.register(registrationRequest.email, registrationRequest.password) }
                }.getOrThrow()
        }

        fun login(loginRequest: LoginRequest): String {
            return success(loginRequest)
                .flatMap { validRequest ->
                    runWithSafety { authService.verify(validRequest.email, validRequest.password) }
                }.flatMap { userId ->
                    when (userId) {
                        is UUID -> success(userId)
                        else -> failure(ResponseStatusException(HttpStatus.BAD_REQUEST, "user not found"))
                    }
                }
                .flatMap { userId ->
                    val token =
                        jwt.signJWT(
                            "$userId",
                            audience = "app",
                            expirationMinutes = 60,
                            customClaims = null,
                        )
                    success(token)
                }.getOrThrow()
        }

        private fun throwIfExists(userId: UUID?): Result<UUID?> {
            return if (userId == null) {
                success(userId)
            } else {
                // User already exists and cannot be created again
                failure(ResponseStatusException(HttpStatus.BAD_REQUEST, "user already exists"))
            }
        }
    }

At the first glance, this code looks noisier and hard to understand (and that is why most people give up on FP), but if you look closely the `flatMap` operation just allows us to "chain" functions together. Most of all, the code is very declarative now which means it is hard for bugs to creep in, we have more safety and a consistent way of doing things. The same pattern can be applied in all places and at the end of the day, the code is clean and compartmentalized.

How does the "Result" look like -

    sealed class Result<out T> {
        data class Success<T>(
            val value: T,
        ) : Result<T>()

        data class Failure(
            val error: Throwable,
        ) : Result<Nothing>()

        companion object Factory {
            fun <T> success(value: T): Result<T> = Success(value)

            fun failure(error: Throwable): Result<Nothing> = Failure(Exception("error!", error))
            fun failure(message: String): Result<Nothing> = Failure(Exception(message))

            inline fun <T> runCatching(block: () -> T): Result<T> =
                try {
                    success(block())
                } catch (e: Throwable) {
                    failure(e)
                }
        }

        // Check if result is success/failure
        val isSuccess: Boolean get() = this is Success
        val isFailure: Boolean get() = this is Failure

        // Get value or null
        fun getOrNull(): T? =
            when (this) {
                is Success -> value
                is Failure -> null
            }

        // Get error or null
        fun errorOrNull(): Throwable? =
            when (this) {
                is Success -> null
                is Failure -> error
            }


        // Get error or null
        fun getOrError(): T =
            when (this) {
                is Success -> value
                is Failure -> throw Exception("error!", error)
            }
    }

    // ==================== PART 2: FACTORY FUNCTIONS ====================

    // Create success result
    fun <T> success(value: T): Result<T> = Result.Success(value)

    // Create failure result
    fun failure(error: Throwable): Result<Nothing> = Result.Failure(error)

    fun failure(message: String): Result<Nothing> = Result.Failure(Exception(message))

    // Wrap a potentially throwing operation
    fun <T> runWithSafety(block: () -> T): Result<T> =
        try {
            success(block())
        } catch (e: Throwable) {
            failure(e)
        }

The full code is on [github](https://github.com/rocky-jaiswal/new-spring-boot-demo).

![Result](/images/result_card.png)

The `Result` monad (allows me to use the m-word roughly) is probably a great trick to tie up any function from anywhere. It can be written in any language that supports types and functional style of code e.g. TypeScript, Kotlin etc. Just write the foundational, service code (small and isolated) and at the end call it all safely together for a great result!
