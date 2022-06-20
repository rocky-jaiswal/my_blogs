---
title: "Fun with function composition - 3"
tags: FP, TypeScript, Kotlin
date: 20/06/2022
---

[Kotlin](https://kotlinlang.org/) is one of those languages which makes me happy. Somehow it feels very close to TypeScript (which I use daily) and yet provides some novel features like [Coroutines](https://kotlinlang.org/docs/coroutines-basics.html) and [Channels](https://kotlinlang.org/docs/channels.html) which can make some routine tasks quite pleasant. It also feels close to my old favorite JRuby and of-course can use all of JVMs ecosystem. In the last two posts we have tried to use TypeScript to write some functional code, in this post we will try and do similar things with Kotlin and see if it is works well with composing functions.

An dummy experiment we are going to play with is a common HTTP handler - "creating a user" from an incoming HTTP request. The usual steps are -

1. Validate the incoming data (email / password)
2. Check if this email is already in the DB
3. Encrypt the password
4. Store the email and encrypted password in the DB
5. The DB insertion returns a "user id", which we wrap in a "token" and send back

This is a common mixture of async / synchronous operations (e.g. DB operations are async and password encryption is sync). We will try and compose functions together using [fp-ts](https://gcanti.github.io/fp-ts/) in TypeScript and then use [Arrow](https://arrow-kt.io/) to write similar code in Kotlin later.

So let us look at the FP-TS + TypeScript code -

    // createUser.ts
    import { flow, identity } from 'fp-ts/function'
    import { either, taskEither } from 'fp-ts'
    import * as TE from 'fp-ts/lib/TaskEither'

    const validateInput = (email: string, _password: string, _passwordConfirmation: string) => {
        console.log('in validateInput ...')
        return either.tryCatch<Error, string>(
            () => {
                // this can also throw an error e.g.
                // throw new Error('Bad email')
                return email
            },
            () => new Error('error validating input')
        )
    }

    const checkIfUserExists = (email: string) => {
        console.log(`in checkIfUserExists for ${email}...`)
        return taskEither.tryCatch<Error, string>(
            async () => {
                await mockDBQuery()
                return email
            },
            () => new Error('error checking user exists')
        )
    }

    const encryptPassword = (password: string) => {
        console.log('in encryptPassword')
        return `encrypted${password}`
    }

    const insertUserInDB = (email: string, pasword: string) => {
        console.log(`in insertUserInDB for ${email} & ${pasword}...`)
        return taskEither.tryCatch<Error, string>(
            async () => {
                await mockDBQuery()
                return `some-id`
            },
            () => new Error('error inserting user')
        )
    }

    const createToken = (userId: string) => {
        console.log(`in createToken for ${userId}...`)
        return taskEither.tryCatch<Error, string>(
            async () => {
                await someCostlyOperation()
                return `some-token`
            },
            () => new Error('error creating token')
        )
    }

    export const handleRequest = async () => {
        // Usually these 3 come in as a param
        const email = 'email'
        const password = 'pass1234'
        const passwordConfirmation = 'pass1234'

        const pipeline = flow(
            (email_: string, pass_: string, pass2_: string) => TE.fromEither(validateInput(email_, pass_, pass2_)),
            TE.chain(checkIfUserExists),
            TE.chain(() => TE.fromTask(() => Promise.resolve(encryptPassword(password)))),
            TE.chain(() => insertUserInDB(email, password)),
            TE.chain((userId: string) => createToken(userId))
        )(email, password, passwordConfirmation)

        const result = await pipeline()

        return either.match((err) => {
            throw err
        }, identity)(result)
    }

If you have read the previous posts, we try to chain everything as [TaskEithers](https://gcanti.github.io/fp-ts/modules/TaskEither.ts.html) and the main work is done in `handleRequest`. The functions again have a clear signature and we do not need to deal with `if / else / checkIfNotNull` etc. We just chain the functions together in a "flow" and try to match the signatures. This code works and is quite readable.

Let us see what the Kotlin + Arrow equivalent looks like -

    // UserHandler.kt
    package de.rockyj

    import arrow.core.Either
    import arrow.core.computations.either
    import kotlinx.coroutines.delay
    import kotlinx.coroutines.launch
    import kotlinx.coroutines.runBlocking
    import kotlin.math.ceil

    sealed class UserCreationError(val msg: String) {
        data class InputError(val value: String) : UserCreationError("Invalid credentials - $value")
        data class UserAlreadyExists(val value: String) : UserCreationError("User with email $value already exists")
        data class DatabaseError(val value: String) : UserCreationError("DB Error - $value")
        data class TokenGenerationError(val value: String) : UserCreationError("System Error - $value")
    }

    private fun generateRandomNumber() = ceil(Math.random() * 10)

    fun validateInput(
        email: String,
        password: String,
        passwordConfirmation: String
    ): Either<UserCreationError.InputError, Boolean> {
        println("in validateInput")
        return Either.catch {
            // potentialErrorThrowingCode()
            true
        }.mapLeft { UserCreationError.InputError("bad credentials $email") }
        //  OR ->
        //  return try {
        //    Either.Right(true)
        //  } catch (_err: Throwable) {
        //    Either.Left()
        //  }
    }

    suspend fun checkIfUserExists(email: String): Either<UserCreationError.UserAlreadyExists, Boolean> {
        println("in checkIfUserExists")
        delay(1500L)
        return if (generateRandomNumber() > 5) {
            Either.Right(false)
        } else {
            Either.Left(UserCreationError.UserAlreadyExists(email))
        }
    }

    fun encryptPassword(password: String): String {
        println("in encryptPassword")
        return "encrypted$password"
    }

    suspend fun insertUserInDB(email: String, encryptedPassword: String): Either<UserCreationError.DatabaseError, String> {
        println("in insertUserInDB")
        delay(2000L)
        return if (generateRandomNumber() > 5) {
            Either.Right("UserId")
        } else {
            Either.Left(UserCreationError.DatabaseError("DB error!!"))
        }
    }

    suspend fun createToken(userId: String): Either<UserCreationError.TokenGenerationError, String> {
        println("in createToken")
        delay(1000L)
        return if (generateRandomNumber() > 5) {
            Either.Right("token123")
        } else {
            Either.Left(UserCreationError.TokenGenerationError("Token error!!"))
        }
    }

    suspend fun createUser(): Either<UserCreationError, String> {
        val email = "someEmail" // extracted from request
        val password = "pass1234"

        return either {
            validateInput(email, password, password).bind()
            checkIfUserExists(email).bind()
            val encryptedPassword = encryptPassword(password)
            val userId = insertUserInDB(email, encryptedPassword).bind()
            createToken(userId).bind()
        }
    }

    fun main() {
        println("Creating user ...")
        runBlocking {
            launch {
                when (val result = createUser()) {
                    is Either.Left -> println("Error - $result")
                    is Either.Right -> println("Result - $result")
                }
            }
        }
    }

A few things worth noting -

- The main work gets done in `createUser`
- `suspend` functions can be seen as their TypeScript `async` functions
- The `suspend` functions do not need special handling. The `Either` returned from normal functions and `suspend` functions have the same treatment
- Like TS the function signatures are clear and helpful, no surprises (or surprise errors thrown) here
- "Chaining" works differently, we can chain using `mapLeft` but Arrow chooses `bind` which has the same effect but makes the code more readable

So that's it, we see that Arrow works quite well with the Kotlin standard library and enables us to write clear, functional code which is easy to read and maintain. If you are new to Arrow, [this](https://arrow-kt.io/docs/patterns/monad_comprehensions/) post here is a good point to start with.
