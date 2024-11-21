---
title: 'Outbox Pattern'
tags: JavaScript, Node.js
date: 21/11/2024
---

## Introduction

One common pattern / challenge we encounter in distributed systems is the creation of records and then sharing of events to other parties. For example, when a payment (or any significant record) is created (or updated) we insert a record in our DB and at the same time we want to inform other interested systems that this payment is now created / updated.

The other parties are usually informed via Kafka / RabbitMQ / SNS / SQS etc. Sometimes maybe even multiple parties can be involved and each needs to be informed via a separate channel / broker / messaging system.

![Postman](/images/postman.png)

In an ideal world, we want these two things - creation of the record & publishing of the event (to a messaging broker) to be -

- **Atomic**: Either both succeed or both fail. This is really important for data consistency and to keep all parties in sync. We should never miss sending the event.
- **Asynchronous**: While the insert in DB should be synchronous, the publishing of events can be done asynchronously to avoid problems (listed below)

Async publishing of events is important because of primarily 2 reasons -

- Broker can be temporarily down - With an asynchronous solution even if the broker is temporarily down, we will not fail the main payment and can publish events as soon as we can, e.g. when the broker is back up
- Broker can be slow - With an asynchronous solution even if the broker is slow, it will not hold the main thread / request and the overall response time of the main task will not suffer

Let's call these 2 problems - "Bad Broker problems" (downtime + slowness) since we will refer to them shortly later. To do this correctly with atomicity and asynchronously is a minor challenge. But now we can do it, with some inspiration from the - __Outbox Design Pattern__

## Outbox Design Pattern

Since this is a common problem with distributed systems / technologies we will use a design pattern called - "Outbox Pattern". I will describe below how easily and efficiently we can implement this pattern using available libraries and a little bit of Node.js code.

__To solve atomicity -__

The main problem with "atomicity" is that there are distributed, separate technologies behind storing the data and publishing the data. For example, the DB connection and Kafka connection are completely different and cannot be tied to a common "lock".

To solve this, the first thing the "Outbox Pattern" does is to reduce the problem to a common DB connection (since all DB libraries provide a way to create an atomic transaction for updates/queries on the same connection). So now we make two inserts in a __single__ DB transaction -

- One insert as normal in a the main payment table
- Another insert in the new events table called "outgoing_events" (or whatever name we want), with some metadata and a flag "published = false" (again whatever name we want)

Since both inserts are on the same DB connection, we have guaranteed atomicity.

__How to publish events asynchronously -__

Now we have the record and the corresponding event sitting in a DB table, but it is not "sent" to any broker so far (let alone async). The answer to this problem is easily solved by 2 core components in Node.js:

- Built in polling mechanism (setInterval / setTimout)
- Built in EventEmitter / EventHandler which by its nature is asynchronous

So as you may have guessed, we will -

- Run a independent 'poller' every 5 seconds or every 5 minutes (totally configurable), the poller will simply raise a NodeJS event
- An event handler will then capture & handle this event (asynchronously of course) and check the DB / events table for the events where flag is "published = false"
- The event handler will then know which events to publish, then publish it and update the DB event record to "published = true"

The last step can be done in a simple try-catch DB transaction again.

If you do not like polling, there is also the alernative of tracking Postgres transaction logs (WAL) etc. [see this blogs for alternatives](https://www.astera.com/type/blog/change-data-capture-postgresql/). We can also reduce the impact of DB polling by doing the polling on a read-only replica. We also need a strategy to clean the outbox events table so it does not grow indefinitely with old data. I will not go into the details of these.

The "Bad Broker problems" are not problems anymore since -

- We do not care much about speed of the broker now, since we are not blocking anything
- If the broker is down, the async event handler will fail, we can catch it and the next time the poller runs we will try again
- In an extreme scenario, if something goes wrong in the transaction, e.g. we publish the event and the DB goes down (or connection is lost), we might not be able to update the DB; but even then the "poller" will again run and publish a "duplicate" message, a problem we can easily solve with an "idempotency-key" (SNS / SQS can anyways cause duplication so we have to deal with this anyways)

## Some sample code

Using a minimal setup of Node.js and [Knex](https://knexjs.org/) the (very rough) code can look like -


    // Sample event insertion in a transaction with knex (db)
    const insertPaymentInDB = async (db: Knex, payment: Payment) => {
      await db.transaction(async (tx) => {
        await PaymentsRepository.from(tx).insertPayment({ payment })
        await OutboxRepository.from(tx).insertEvent({ eventId: randomUUID(), paymentId: payment.id, event: 'NEW_PAYMENT', published: false })
      })
    }


    interface OutboxOptions {
      pollingTime: number
      tableName: string
      db: Knex
      logger: Logger
      handleEvent: (eventId: string) => Promise<void>
    }

    class OutboxConsumer extends EventEmitter {
      private pollingTime: number
      private tableName: string
      private db: Knex
      private logger: Logger
      private handleEvent: (eventId: string) => Promise<void>

      private pollingTimeoutId?: NodeJS.Timeout

      constructor(options: OutboxOptions) {
        super()
        // set all options as fields

        this.on('start', () => {
          this.doWork()
        })
      }

      public start() {
        // do some checks
        this.emit('start')
      }

      private doWork() {
        this.findAndPublishEvents()
          .then(() => {
            // do some logging / cleanup
            
            // clear existing timeouts and raise new 'start' event with a timeout
            if (this.pollingTimeoutId) {
              clearTimeout(this.pollingTimeoutId)
            }
            this.pollingTimeoutId = setTimeout(() => this.emit('start'), this.pollingTime)
          })
          .catch(() => {
            // log and handle error however you want
          })
      }

      private async findAndPublishEvents() {
        const { tableName, db } = this

        return db.transaction(async (tx) => {
          // find unpublished record from DB / outbox table

          // in this function we read more details from the events table and publish the message
          await this.handleEvent(record.eventId)

          // update event record to published = true with the same DB transaction
          await db(tableName).transacting(tx).update({ published: true }).where({ event_id: record.eventId })
        })
      }
    }

That is it! With very little code we have built an atomic & asynchronous outbox setup.