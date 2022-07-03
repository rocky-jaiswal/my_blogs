---
title: "Fun with function composition"
tags: FP, TypeScript
date: 12/03/2022
---

[Previously](https://rockyj.in/2021/04/03/go-with-functions.html) we looked at why it is nice to write software with function composition. We saw that it leads to simpler code which is easy to read and test. I think a lot of Functional Programming (FP) tutorials tell you the concepts but do not mention the advantages. In this post (using TS) we will try and turn this around, I am not going to tell you what FP is or what **"Monads"** are but show you how all these ideas make our lives easier.

_If you wish to build a ship, do not divide the men into teams and send them to the forest to cut wood. Instead, teach them to long for the vast and endless sea._

So if we see the benefits, we might understand the reasoning behind it and also how to understand and write FP code.

To start our journey, think of all the code we write. When we get down to the basics, most if not all functions in the TS/JS world can be categorized as -

- A sync function that returns a value (e.g. add two numbers). _If only we could do everything with these._
- A sync function that returns a value or null / undefined (e.g. finding something in an array / map)
- A sync function that can throw an error or returns a value (e.g. a division function which can error out when you divide by zero or simply return a decimal)
- A sync function with no return value but a side effect (e.g. console.log)
- And then for all the 4 cases above, their "async" counterparts (e.g. reading a file, making HTTP requests, reading from DB etc)

So all in all, we can say that we mostly deal with 8 types of functions. Now the next idea is that we need to write software that can compose all these different types of functions together. So essentially we want to write something simple like -

    run(parseRequest, validateRequest, enrichData, insertInDB, sendResponse)

The main challenge usually we face is that all these functions **don't always return a simple value**, if that was the case we would be so happy and easily compose these functions! Each of these functions in reality can individually throw an error, or return null or do something async and then to make it all work together we end up writing a lot of "if / else" checks, "try / catch" blocks or "async / await" code and this one line which should be just composing functions becomes 20 lines very soon. On top of that we have to write a dozen tests to handle each branch of this big function. The FP equivalent on the other hand just needs one overall test for the "composed" function and smallers unit tests for individual functions. All this is much simpler and easier to read & maintain.

Given this background let us see an example to understand and explore these ideas. As usual I want to take a real life example and see how we can write it in FP world. So the scenario inspired from my day job is -

1. Get an HTTP request
2. A valid user request should have an "authorization" header
3. The "authorization" header gives a decoded "userId" if the header is valid
4. Get list of contacts for the given userId from service 1
5. Get list of secondary contacts from service 2
6. If the first contact request fails then return an error, if second request fails we do not care
7. When both contact requests complete, return the combined contacts

As you can imagine this is a slightly complex piece of logic and the imperative version runs into around 60+ lines of code with multiple "if / else" and null checks. Let's try and simplify it with FP. With just a bit of knowledge and a few "Monads" we will try and compose this code together. The intuition is when -

1. Something is nullable we return the "Option" monad.
2. When something can throw an exception we use the "Either" monad.
3. For any synchronous IO we use the "IO" monad.
4. For any asynchronous functions we need some sort of async versions of the monads above.

Please note that these are just guidelines and I not going into the mathematical details. The idea is that we want to compose code with functions and do away with all the null, async & error checks. Remember we said that the **main** challenge we face is that these functions don't always return a simple value, but what if all of these functions do return a "smart" value and that smart value is a "container" encapsulating the "success path" value or the "failure path" value? Since this container will always have a "usable / smart" value, we can compose functions as if we do not have to care about managing the "failure paths" individually at all.

So let's try this with [Purify TS](https://gigobyte.github.io/purify/) -

    // handler.ts
    import { Maybe } from 'purify-ts/Maybe'
    import { EitherAsync } from 'purify-ts/EitherAsync'

    const dummyDelay = () => new Promise((res) => setTimeout(res, 100))

    interface Headers {
        signedUserId?: string
    }

    interface Request {
        headers?: Headers
    }

    const extractAuthHeader = (headers?: Headers): Maybe<string> =>
        Maybe.fromNullable(headers?.signedUserId)

    const extractUserIdFromToken = (authToken: string): EitherAsync<Error, string> =>
        EitherAsync(async () => {
            try {
                // simulate an async call
                await dummyDelay()

                // simulate error by uncommenting line below
                // throw new Error()

                return `${authToken}-to-user-id`
            } catch (err) {
                throw new Error('token parsing failed')
            }
        })

    const fetchPrimaryContacts = (userId: string): EitherAsync<Error, string[]> => {
        console.log(`Fetching primary contacts for ${userId}`)
        return EitherAsync(async () => {
            try {
                // simulate call to fetch data, e.g. use fetch/axios
                await dummyDelay()

                const primaryContacts = ['p1', 'p2']

                // simulate error by uncommenting line below
                // throw new Error()

                return primaryContacts
            } catch (err) {
                throw new Error('fetching primary contacts failed')
            }
        })
    }

    const fetchSecondaryContacts = (userId: string): EitherAsync<Error, string[]> => {
        console.log(`Fetching secondary contacts for ${userId}`)
        return EitherAsync(async () => {
            try {
                // simulate call to fetch data, e.g. use fetch/axios
                await dummyDelay()

                // simulate error by uncommenting line below
                // throw new Error()

                return ['s1', 's2']
            } catch (err) {
                console.log('fetching secondary contacts failed')
                return []
            }
        })
    }

    // Main function exposed to outside world
    const handleRequestPurify = async (request: Request) => {
        const result = await EitherAsync.liftEither(
            // 1
            extractAuthHeader(request.headers).toEither(new Error('bad header'))
        )
        .chain(extractUserIdFromToken) // 2
        .chain((userId) =>
            EitherAsync.all([fetchPrimaryContacts(userId), fetchSecondaryContacts(userId)]) // 3
        )
        .run()

        return result.caseOf({
            Left: (err) => {
                throw err
            },
            Right: (allContacts) => allContacts[0].concat(allContacts[1]),
        })
    }

    export default handleRequestPurify

If we look at the main function here, it is dead simple and easy to read. To align the types we had to write some boilerplate but there are no "if / else" statements, the type signature of each function makes its intent clear. On top we have code that makes the two calls to fetch contacts in parallel (saving time). So all in all, we have reduced a complex logic to simple testable functions just "chained" together with clear signatures and also made unit testing easier. In the future, I hope to present the same ideas using [FP-TS](https://gcanti.github.io/fp-ts/) which is a more feature rich library.
