---
title: "Write software by composing functions"
tags: FP, TypeScript
date: 03/04/2021
---

It's Easter time! The world seems different, there is new life all around. I pray and hope that with this new season the grace of God is renewed and the pandemic wanes away. We will kick off this new season as well with some exploration.

I think a lot of posts on functional programming are hard to understand because they do not deal with real world examples. Let's try and change that. Let's imagine a feature where we get a "transactionId" and we need to return the "Bank Details" of the transaction. For this we make a couple of remote / API calls and handle some logic around returning the bank's name, IBAN and an optional logo.

Let's look at the simple imperative (almost real life) code to kick things off -

        //getTransactionInfo.ts
        interface BankInfo {
            iban: string
            bankName: string
            logoUrl: string | null
        }

        async function fetchTransactionDetails(_txnId: string): Promise<{ bankName: any; iban: any } | null> {
            await delay(1000) // assume API call
            // response can be null
            return {
                bankName: 'Postbank',
                iban: 'someIban',
            }
        }

        async function fetchBankLogo(_iban: string): Promise<{ logoUrl: string } | null> {
            await delay(1000) // assume API call
            // response can be null
            return {
                logoUrl: 'someLogoUrl',
            }
        }

        // @throws TransactionNotFoundException
        export const getTransactionInfo = async (transactionId: string, options: { withLogo: boolean }): Promise<BankInfo | null> => {
            const txnDetails = await fetchTransactionDetails(transactionId)

            if (!txnDetails) {
                return null
            }

            const { iban, bankName } = txnDetails

            const bankInfo = options.withLogo ? await fetchBankLogo(iban) : null

            const logoUrl = bankInfo?.logoUrl ?? 'someGenericLogoUrl'

            return {
                iban,
                bankName,
                logoUrl: options.withLogo ? logoUrl : null,
            }
        }

The main logic here lies in the getTransactionInfo function. The code works, but what I particularly don't like is -

- It is doing too much
- Too many if conditions, too many null checks
- Most importantly, we are "asking" the computer too much, at this point in my life I feel we should write code that "tells" the computer to do stuff, sit back and handle the logic in smaller functions (doing 1 thing at a time).

So my ideal code would be just one line -

    const bankInfo = await pipe(fetchTransactionDetails, fetchBankLogo)(transactionId, options)

So we have two functions which make the remote calls (implementation details), the logic is handled in them, we just care about composing them and maybe munging the response together. We can reuse these small functions elsewhere.

Herein lies the essence of functional programming. Compose small functions to do big things. That is it.

Now since we are using TypeScript, we have the challenge of "lining up the types" since we can only compose two functions together only when their types align. We don't want to feed "any" and get back "any" because we then lose the value of TypeScript.

So in our second, not so pure attempt we create a type that we can pass around. This type sort of encapsulates the "state" of our (micro) system -

        interface BankInfo {
            iban: string
            bankName: string
            logoUrl: string | null
        }

        class QueryState {
            public readonly transactionId: string
            public readonly options: Record<string, boolean>

            private _bankName: string | null = null
            private _iban: string | null = null
            private _logoUrl: string | null = null

            constructor(transactionId: string, options: Record<string, boolean>) {
                this.transactionId = transactionId
                this.options = options
            }

            // TODO: getters and setters for private members
        }

        async function fetchTransactionDetails(state: QueryState): Promise<QueryState> {
            await delay(1000) // assume API call

            // TODO: check if response is not null and then set result
            state.setBankName('Postbank')
            state.setIban('someIban')

            return state
        }

        async function fetchBankLogo(state: QueryState): Promise<QueryState> {
            if (state.options.withLogo) {
                await delay(1000) // assume API call

                // TODO: check if response is not null
                state.setLogoUrl('logoUrl')

            }
            return state
        }

        // @throws TransactionNotFoundException
        export const getBankInfoPiped = async (transactionId: string, options: { withLogo: boolean }): Promise<BankInfo | null> => {
            const state = await pipeAsync(
                fetchTransactionDetails,
                fetchBankLogo
            )(new QueryState(transactionId, options))

            if (state.bankName === null) {
                return null
            }

            return {
                iban: state.iban!,
                bankName: state.bankName!,
                logoUrl: options.withLogo ? state.logoUrl : null,
            }
        }

Now we are getting somewhere, we have the logic nicely divided in small functions which are easier to unit test. We have a higher level of abstraction which is easy to understand and modify. Each small function gets the state, modifies it and returns it to the next function in line. The "state" is also nicely typed and encapsulated in one place. (I have left some code above to keep it simple but you get the idea).

This is already a huge improvement over the last imperative style code. It is still not perfect since the state is not immutable, the functions are not really resuable since they rely on the state and there a still a couple of if statements (well some are needed but maybe we can do better).

For our final attempt we will turn to Kotlin since it has better support for FP (or at-least better documentation). We will use the "Option" monad, I will not go into Monads since there are hundreds of tutorials out there. But for our simple example - A monad is a wrapper over some data that allows us to compose functions. So it does two things we need in our case - compose functions and align types. It also handles the null checks on top.

So here is the Kotlin code, which is very similar to the TypeScript code -

    // app.kt
    import kotlinx.coroutines._
    import arrow.core._

    data class BankDetails(val bankName: String, val iban: String)
    data class LogoInformation(val logoUrl: String)
    data class BankInformation(val bankName: String, val iban: String, val logoUrl: String?)

    suspend fun fetchBankDetails(txnId: String): Option<BankDetails> {
        delay(500L) // pretend we are making remote API call here
        return if (Math.random() > 0.5) {
            Some(BankDetails("Bank-$txnId", "someIban"))
        } else {
            None
        }
    }

    suspend fun fetchBankLogo(iban: String): Option<LogoInformation> {
        delay(200L) // pretend we are making remote API call here
        return if (Math.random() > 0.5) {
            Some(LogoInformation("$iban:someLogoURL"))
        } else {
            None
        }
    }

    suspend fun getTransactionInfo(
        getTxnDetails: suspend (String) -> Option<BankDetails>,
        getBankLogo: suspend (String) -> Option<LogoInformation>,
        txnId: String,
        withLogo: Boolean
    ): BankInformation? {
        return getTxnDetails(txnId)
            .flatMap {
                when (withLogo) {
                    true -> {
                        val logoUrl = getBankLogo(it.iban).getOrElse { LogoInformation("someGenericLogoUrl") }.logoUrl
                        Some(BankInformation(it.bankName, it.iban, logoUrl))
                    }
                    false -> Some(BankInformation(it.bankName, it.iban, null))
                }
            }
            .getOrElse { null }
        }

    suspend fun execute(txnId: String, withLogo: Boolean): BankInformation? {
        return getTransactionInfo(::fetchBankDetails, ::fetchBankLogo, txnId, withLogo)
    }

So here we get pretty close to our desired code, only 1 "if / when" statement which is our main business logic. No null handling thanks to the "Option" monad and fully declarative code telling the computer what to do. If Kotlin had good currying support, the final execute function would read even better. What do we have here -

- Small functions which do the API call
- Instead to returning nullable we return the Option monad (can also handle exceptions this way)
- The returned monad is "composable" by nature
- Monands are composable through "flatMap"
- No ugly null checks needed, all handled with the monad
- The data is all immutable and the input and output types are all clearly defined / typed
  So I hope this helps me and you understand the value to writing software with small functions and how we can get there.
