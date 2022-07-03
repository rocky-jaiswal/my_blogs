---
title: "Hibernate Reactive Experiments"
tags: Kotlin, Gradle
date: 12/11/2021
---

Recently IRL (not weekend life) we had to deal with an old Ruby service to get it ready for "Black Friday traffic" i.e. we had to somehow scale it up so it can handle the traffic burst. We tried a lot of stuff but I think we will still end up paying for a lot of AWS dollars since it is a critical service and we err'd on the side of caution. The service itself is quite simple, optimised and performing mostly DB operations and the individual request/response time is very low, however to deal with around 10000 reqs/sec we need a lot of server power. This led me to think, I always wanted to look into stacks which give great response times, but I had not considered "throughput" a lot.

Now if I think about it, "throughput" can only be achieved by **threads or async**. It is like a restaurant, you can serve more customer by hiring more waiters or by making waiters efficient enough to serve more tables at one time (given food preparation just needs some time). Sadly Ruby (although fast) is missing both - parallel threads or async options. JRuby using JVM platform can do real threads and although Node.js does not use threads [usually](/2019/09/30/node-worker-threads.html) it is fast and async so it can deal with a lot of traffic easily.

I already use Node.js a lot at work, so for fun I tried JRuby to do some tests and the results were quite good. Which led me back to the path of JVM and Kotlin, JVM has the advantage of having both threads and async behaviour which can result in some very scalable services. Spring Boot has [R2DBC](https://spring.io/projects/spring-data-r2dbc) which provides async database access but I am not a big fan of Spring Boot (too much magic for me) so I looked into Javalin.

Javalin documentation says it supports asynchronous operations - [Luckily it’s very easy in Javalin, just pass a CompletableFuture to ctx.future()](https://javalin.io/documentation#faq). So Javalin can do async operations but it still needs an async database driver to do the actual work. The [Vert.x Reactive PostgreSQL Client](https://vertx.io/docs/vertx-pg-client/java/) is a good choice for this, it has been there for a while and promises some great performance numbers. However, working with the raw client can be painful. Luckily [Hibernate Reactive](http://hibernate.org/reactive/) hit version 1.0 recently (which I consider stable enough) so that was my stack of choice.

So I changed my Javalin project's gradle.kts file and added -

    implementation("org.hibernate.reactive:hibernate-reactive-core:1.1.0.Final")
    implementation("io.vertx:vertx-pg-client:4.2.1")

Created `resources/META-INF/persistence.xml` -

    <persistence xmlns="http://java.sun.com/xml/ns/persistence"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://java.sun.com/xml/ns/persistence http://java.sun.com/xml/ns/persistence/persistence_2_0.xsd"
            version="2.0">

        <persistence-unit name="todo-app">
            <provider>org.hibernate.reactive.provider.ReactivePersistenceProvider</provider>

            <class>de.rockyj.models.User</class>

            <properties>
                <!-- PostgreSQL -->
                <property name="javax.persistence.jdbc.url"
                        value="jdbc:postgresql://localhost/todo_dev"/>

                <!-- Credentials -->
                <property name="javax.persistence.jdbc.user"
                        value="postgres"/>
                <property name="javax.persistence.jdbc.password"
                        value="postgres"/>

                <!-- The Vert.x SQL Client connection pool size -->
                <property name="hibernate.connection.pool_size" value="10"/>

                <!-- Automatic schema export -->
                <property name="javax.persistence.schema-generation.database.action"
                        value="drop-and-create"/>

                <!-- SQL statement logging -->
                <property name="hibernate.show_sql" value="true"/>
                <property name="hibernate.format_sql" value="true"/>
                <property name="hibernate.highlight_sql" value="true"/>
            </properties>

        </persistence-unit>

    </persistence>

After setting up a router and controller, I had my first minor challenge. Hibernate Reactive sessions offer two options -

- Stage.Session and friends provide a reactive API based around Java’s CompletionStage, and
- Mutiny.Session and friends provide an API based on [Mutiny](https://smallrye.io/smallrye-mutiny/).

I liked the Mutiny API more, but it was not fully compatible with Javalin's **CompleteableFuture**. However it worked after some research -

    class UsersController {
        private val logger = LoggerFactory.getLogger(this::class.java.name)

        fun get(context: Context, factory: Mutiny.SessionFactory): Context {
            logger.info("Received request for user/:id path ...")
            return context.future(
                factory.withSession { session ->
                    session.find(User::class.java, "6737d8c8-9441-41d4-9139-47a643fa4375")
                }.onItem().transform { user ->
                    mapOf("name" to user.name?.uppercase())
                }.
                subscribeAsCompletionStage()
            )
        }
    }

The code above is a dummy "user" model lookup by "id". This worked given I had the DB setup with tables and some data, however I could not get native queries like below working -

    session.createQuery<User>("select id, name from User").resultList

It seemed there was a "bootloader" problem with the Hibernative Reactive + Javalin + Kotlin combination. I simply gave up at this point.

Thankfully after some searching I came across - [Quarkus](https://quarkus.io/), which checks all the boxes I needed - Kotlin, Hibernate-Reactive, Reactive HTTP Client and Gradle - on top of it all this works well with the Mutiny API (which can potentially work with Kotlin suspend functions). After some struggles, I got all these to play together and it is available on [my Github](https://github.com/rocky-jaiswal/todo-quarkus-gradle). The performance is really good and so is the documentation of Quarkus, not to mention the potential to run all this as a native executable using GraalVM. I am optimistically excited about this technology stack, some libraries are still marked as "experimental" (e.g. Hibernate DDL validation does not work) but I hope things gets stable and I get to work on it soon.
