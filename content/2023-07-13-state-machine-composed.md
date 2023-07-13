---
title: 'Composition, currying & state machines'
tags: FP, Nodejs
date: 13/07/2023
---

One of my core philosophies is to build software systems which are more or less **"data transformers"** e.g. our code provides a description of how data flows through our program. I usually want to write functions that get some data and return some data, this should be done as deterministically (e.g. using types) and declaratively as possible, and then whole systems can be built composing these functions.

![construction worker with pipes](/images/pipelines.png)
_Random AI generated image_

### Simple composition

A library that I use - [aync-utils](https://github.com/rocky-jaiswal/async-utils) provides a simple function **pipeAsync** which works very well in the JS world since it allows me to compose async functions together to almost do anything. e.g. handling a HTTP request -

    import { delay, pipeAsync } from '@rockyj/async-utils'
    import { FastifyRequest, FastifyReply } from 'fastify'

    type User = {
        email: string
        passcode: string
    }

    // a very simple POJO
    class RegisterUserContext {
        public readonly requestBody: unknown
        private _parsedRequest: User | null = null
        private _response: unknown | null = null

        constructor(requestBody: unknown) {
            this.requestBody = requestBody
        }

        public set parsedRequest(req: User) {
            this._parsedRequest = req
        }

        public get parsedRequest() {
            if (!this._parsedRequest) {
                throw new Error('parsedRequest is not set')
            }
            return this._parsedRequest
        }

        public set response(res: unknown) {
            this._response = res
        }

        public get response() {
            if (!this._response) {
                throw new Error('response is not set')
            }
            return this._response
        }
    }

    const validateRequestBody = async (context: RegisterUserContext) => {
        await delay(300)
        // validate request body here
        return context
    }

    const searchOrCreateUser = async (context: RegisterUserContext) => {
        await delay(200)
        // search or create user here
        return context
    }

    const buildResponse = async (context: RegisterUserContext) => {
        await delay(100)
        // build and set response in context here
        return context
    }

    // main logic here
    // ---------------
    export const handleRequest = async (req: FastifyRequest, reply: FastifyReply) => {
        // main logic here
        const context = await pipeAsync(
            validateRequestBody,
            searchOrCreateUser,
            buildResponse
        )(new RegisterUserContext(req.body))

        reply.code(200).send(context.response)
    }

In the code above, we have handled a HTTP request with a few functions composed together - `validateRequestBody, searchOrCreateUser and buildResponse`. The advantage of this approach is that each function has a clear job and is unit testable. We can build almost any **pipeline** of functions using **pipeAsync**.

### Next Level

This composition approach with some **currying** can take us to the next level to handle more complex data flows. e.g. building a small state machine to handle a complex job. An example could be -

- We get a message
- We validate the message
- We call an external service to get some more information (based on the message)
- We call another external service to give us a "decision" based on the data we have
- Based on the "decision" we record a response

Now given the fact that our **pipeAsync** can handle anything of the type `(state: T) => Promise<T>`, we can create a state machine like this -

    import { delay, pipeAsync } from '@rockyj/async-utils'

    export interface Payload<T> {
        underCondition: string
        successTo: string
        errorTo: string
        coreAction: (state: T) => Promise<T>
    }

    class MessageContext {
        public _currentState: string = 'INIT'
        public _allStates = [this.currentState]
        // + other objects needed in state

        public get currentState() {
            return this._currentState
        }

        public pushState(state: string) {
            this._currentState = state
            this._allStates.push(state)
        }
    }

    // state machine helper
    export const transitionState = (payload: Payload<MessageContext>) => {
        return async (context: MessageContext) => {
            if (payload.underCondition !== context.currentState) {
                return context
            }

            try {
                await payload.coreAction(context)
                context.pushState(payload.successTo)
            } catch (e: unknown) {
                console.error(e)
                context.pushState(payload.errorTo)
            }

            return context
        }
    }

    const sampleAction = async (context: MessageContext) => {
        await delay(300)

        if (Math.ceil(Math.random() * 100) % 2 === 0) {
            throw new Error('error!')
        }

        return context
    }

    // main logic here
    // ---------------
    const actions = pipeAsync(
        transitionState({
            underCondition: 'INIT',
            successTo: 'MESSAGE_VALIDATED',
            errorTo: 'INVALID_MESSAGE',
            coreAction: sampleAction
        }),
        transitionState({
            underCondition: 'MESSAGE_VALIDATED',
            successTo: 'INFORMATION_ADDED',
            errorTo: 'SERVICE1_FAILED',
            coreAction: sampleAction
        }),
        transitionState({
            underCondition: 'INFORMATION_ADDED',
            successTo: 'DECISION_MADE',
            errorTo: 'SERVICE2_FAILED',
            coreAction: sampleAction
        })
    )

    export const handleMessage = async (_message: unknown) => {
        const context = await actions(new MessageContext()) // <- message can be passed here for example

        console.log(context.currentState)
        console.log(context._allStates)
    }

In the example above **transitionState** takes away the heavy-lifting of error handling and we declaratively program under what condition a function should run and what should be state of the system after the function execution (or what if the function throws an error). This makes it very easy to debug, log and test a complex flow of data while each function remains simple and independent.

### With some conditional matching

The code above is capable of handling a lot of scenarios, but let's see if we can extend it even further. To expand the last example, what if the external service we call to give us a "decision" can return different values, and based on the returned decision we need to perform more actions. Let's see how we can declaratively compose this -

    const sampleActionWithLog = (msg: string) => async (context: MessageContext) => {
        console.log(msg)
        // some logic here
        await delay(300)
        return context
    }

    const sampleDecisionMaker = async (context: MessageContext) => {
        await delay(300)

        const random = Math.ceil(Math.random() * 100) % 3

        if (random === 0) {
            context.decision = 'ACCEPT'
        }
        if (random === 1) {
            context.decision = 'REJECT'
        }
        if (random === 2) {
            context.decision = 'UNDECIDED'
        }

        return context
    }

    const match =
        (cases: Record<string, (state: MessageContext) => Promise<MessageContext>>) => async (context: MessageContext) => {
            await cases[context.decision](context)
            return context
        }

    // main logic here
    // ---------------
    const actions = pipeAsync(
        transitionState({
            underCondition: 'INIT',
            successTo: 'MESSAGE_VALIDATED',
            errorTo: 'INVALID_MESSAGE',
            coreAction: sampleAction
        }),
        transitionState({
            underCondition: 'MESSAGE_VALIDATED',
            successTo: 'INFORMATION_ADDED',
            errorTo: 'SERVICE1_FAILED',
            coreAction: sampleAction
        }),
        transitionState({
            underCondition: 'INFORMATION_ADDED',
            successTo: 'DECISION_MADE',
            errorTo: 'SERVICE2_FAILED',
            coreAction: sampleDecisionMaker
        }),
        transitionState({
            underCondition: 'DECISION_MADE',
            successTo: 'ALL_DONE',
            errorTo: 'BIG_MESS',
            coreAction: match({
                ACCEPT: pipeAsync(sampleActionWithLog('ACCEPTED'), sampleActionWithLog('accepted done')),
                REJECT: pipeAsync(sampleActionWithLog('REJECTED'), sampleActionWithLog('rejected done')),
                UNDECIDED: pipeAsync(sampleActionWithLog('UNDECIDED'), sampleActionWithLog('undecided done'))
            })
        })
    )

So we see with the power of composition and currying we can pretty much declare the whole logic in a readable and easily testable manner. What is more, every major decision and code path is declared at one place, each function itself is small and does not need to know about the context where it is called (making it re-usable). We can also log and persist the state easily to see where a certain message has ended up and why. I have used this approach to build some pretty large systems and it has worked well. I hope you find it useful too.
