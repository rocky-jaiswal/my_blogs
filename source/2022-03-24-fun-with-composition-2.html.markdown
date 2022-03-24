---
title: "Fun with function composition - 2"
tags: FP, TypeScript
date: 24/03/2022
---

Sometimes I do not write any blog for months but this new post comes within a week of the last one :) some things just get you this excited. In the [last post](https://rockyj.in/2022/03/12/fun-with-composition.html), we looked at how functional composition helps us and how certain data types (also called "Monads") help us write functional code. We left off with a scenario and tried to solve it with [Purify TS](https://gigobyte.github.io/purify/). The scenario was -

1. Get an HTTP request
2. A valid user request should have an "authorization" header
3. The "authorization" header gives a decoded "userId" if the header is valid
4. Get list of contacts for the given userId from service 1
5. Get list of secondary contacts from service 2
6. If the first contact request fails then return an error, if second request fails we do not care
7. When both contact requests complete, return the combined contacts

Here is the [fp-ts](https://gcanti.github.io/fp-ts/) version of the code -

    const handleRequestFPTS = async (request: Request) => {
        const pipeline = flow(
            extractAuthHeader, // returns an option
            TE.fromOption(() => new Error('Error in extracting auth header')),
            TE.chain(extractUserId),
            TE.chain((userId) => // make calls in parallel
                taskEither.sequenceArray([fetchPrimaryContacts(userId), fetchSecondaryContacts(userId)])
            )
        )(request.headers)

        const result = await pipeline()

        return either.match(
            (err: Error) => {
                throw err
            },
            (value: readonly string[][]) => {
                return value
            }
        )(result)
    }

[fp-ts](https://gcanti.github.io/fp-ts/) is a great library, it may look overwhelming at first, but one can approach it step-by-step. I do not claim to have built expertise over it, but I have realized that for backend Node.js services one can get far with just knowledge of [TaskEither](https://gcanti.github.io/fp-ts/modules/TaskEither.ts.html) and [Option](https://gcanti.github.io/fp-ts/modules/Option.ts.html). This is because on the backend most of the time we are dealing with network requests or IO (e.g. DB queries). Additionally we deal a lot with **nullable** values. So if we learn to work with TaskEither + Option and how to chain (or combine) them, we can pretty much handle most of our business logic using small functions and composing them together.

So let us look at another complex scenario and try to write it with fp-ts -

1. Get an HTTP request
2. A valid user request should have an "authorization" header (or null)
3. The "authorization" header gives a decoded "userId" if the header is valid (or throws an error)
4. We then get a cart for the user (from a remote service), the service will return a null if no cart exists for the user
5. If it exists, fetch the products in the cart (another call to a remote service)
6. For each product, fetch the price. The pricing service is buggy and can even return "null" prices
7. For all correct prices returned, sum them up, thus calculating the total price of the users cart

To test our scenario, the remote request invoking functions can be **mocked** like -

    const dummyDelay = () => new Promise((res) => setTimeout(res, 1000))

    const mockEndpoint = async () => {
        await dummyDelay()

        if (Math.floor(Math.random() * 100) % 2 === 0) {
            throw new Error('request failed')
        }
    }

    const randomlyNone = (returnValue: any) =>
        Math.floor(Math.random() * 100) % 2 === 0 ? none : some(returnValue)

    // ...
    // other functions

    const fetchLastCart = (userId: string) => {
        console.log(`in fetchLastCart for user - ${userId} ...`)
        return taskEither.tryCatch<Error, Option<Cart>>(
            async () => {
                await mockEndpoint()
                return randomlyNone({ cartId: 'c1' })
            },
            () => new Error('error extracting cart for user')
        )
    }

    const fetchProductPrice = (productId: string) => {
        console.log(`in fetchProductPrice ${productId} ...`)
        return taskEither.tryCatch<Error, Option<number>>(
            async () => {
                await mockEndpoint()
                return randomlyNone(23)
            },
            () => new Error('error fetching prices')
        )
    }

As you can imagine, combining these functions is complex logic - the remote calls can fail, return null, calls can be made in parallel etc. The imperative version of this code can run into multiple lines of if/elses and exception handling. With the functional approach, using fp-ts this boils down to -

    const handleRequest = async (request: Request) => {
        const pipeline = flow(
            extractAuthHeader, // returns Option
            TE.fromOption(() => new Error('error in extracting auth header')),
            TE.chain(extractUserId),
            TE.chain(fold(() => TE.left(new Error('no user id found')), fetchLastCart)),
            TE.chain(
                fold(
                    () => TE.left(new Error('No cart found')),
                    (cart: Cart) => fetchProducts(cart.cartId)
                )
            ),
            TE.chain((products: string[]) => taskEither.sequenceArray(products.map(fetchProductPrice))),
            TE.chain((prices: readonly Option<number>[]) => {
                const sum = compact(prices.map(identity)).reduceRight((acc, num) => acc + num, 0)
                return taskEither.right(sum)
            })
        )(request.headers)

        const result = await pipeline()

        return either.match((err) => {
            throw err
        }, identity)(result)
    }

This runs as -

<img src="/images/piped.gif" alt="piped functions" />

If we look at the main code, we are essentially "chaining" TaskEithers (an async task that can throw an error), to align the types we sometimes convert the Option to a TaskEither, or when a TaskEither returns an Option we "fold" it. We also run the async tasks for fetching product prices for each product in parallel. All this logic is around 20 lines of code and again the types are well-defined, and all the errors are handled properly. The remote call invoking individual functions are also small and everything is easily unit testable.

One could argue that the final code is probably not easy to read for a newcomer, but that is something worth discussing. What do you folks think?
