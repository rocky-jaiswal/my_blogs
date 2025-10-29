---
title: 'Hibernate Reactive on Kotlin & Ktor'
tags: Kotlin
date: 29/10/2025
---

It’s like when no bus comes for an hour, and then suddenly two arrive at once. Well, I’m between jobs right now, so I have a bit of free time — hence the flurry of blog posts.  

In my day-to-day work, I usually program in TypeScript, but it’s no secret that if given the choice, I’d happily build things in Kotlin. I’ve been doing that on weekends for a while now. As I’ve mentioned before, I like Kotlin because it’s almost like TypeScript — but with the huge advantages of **immutability** and the **multi-core JVM** (plus the rich JVM ecosystem).

I usually try to build small projects in Kotlin during my free time. The frameworks I typically explore are:

- [Spring Boot](https://spring.io/projects/spring-boot)
- [Micronaut](https://micronaut.io/) / [Quarkus](https://quarkus.io/)
- [Javalin](https://javalin.io/)
- [Ktor](https://ktor.io/)
- [Http4K](https://www.http4k.org/)

I’ve used Spring Boot a lot, so when experimenting, I prefer to try something different. Micronaut and Quarkus are solid alternatives, but they’re quite close to Spring Boot — just with smaller communities (maybe 10% of the community size). I like Javalin the most (it’s very close to Express or Sinatra), but it’s still stuck on Jetty 11. While Javalin 7 should be out soon, I can’t hold my breath any longer.

That leaves Ktor or Http4K. Http4K is nice, but its community is even smaller. So Ktor feels like the best option — with decent docs, an active community, and regularly updated libraries.

---

### Database Options

Now, how should we interact with the database?

Ktor recommends [Exposed](https://www.jetbrains.com/exposed/), but I find it quite cumbersome. For lightweight apps, I prefer [jOOQ](https://www.jooq.org/), and if a full ORM is needed, Hibernate is still the safest choice out there.

---

### The JVM Thread Problem

The big challenge with the JVM is **thread blocking**.  
In the Node.js world, if a request is waiting for the database to respond, the CPU isn’t wasted — it can serve other requests in the meantime.  

In Java, however, each request typically runs on a thread, and if that thread is waiting on the database, it just ... waits. It’s blocked (and wasting resources)! 😞  

There are two main ways to address this in the Java world:

- **Virtual Threads**
- **Reactive Java**

Virtual Threads are promising, but support outside of the latest Spring releases is still limited — and there can be surprises.  
As for Reactive Java ... let’s just say it’s not the most concise approach (as if Java wasn’t verbose enough already).  

That’s why, even in 2025, I wouldn’t recommend pure Java if your goal is to save on cloud costs.

---

### Kotlin to the Rescue

With Ktor, we get **full coroutine support**, which makes it a great choice outside the Spring ecosystem.  
However, since jOOQ uses blocking JDBC queries, we need a **non-blocking** alternative for database access.

[**Hibernate Reactive**](https://hibernate.org/reactive/) provides exactly that. It’s backed by the Hibernate team and is fully non-blocking.  
So now we want to combine:

- Ktor  
- Hibernate Reactive  
- Kotlin coroutines  

Out of the box, Hibernate Reactive doesn’t provide Kotlin helpers — that’s a small red flag 🚩 — but it’s built on [SmallRye Mutiny](https://smallrye.io/smallrye-mutiny/latest/), which **does** have [Kotlin support](https://smallrye.io/smallrye-mutiny/latest/guides/kotlin/). So there’s hope!

---

![Hibernate Reactive](/images/hibernate_reactive.png)

### A Note of Caution

- We’re in somewhat experimental territory here. I really wonder if someone actually uses this combination in production.
- If you want a safer choice, go with **Spring WebFlux + Kotlin + R2DBC**.  
- But if no one ever experiments, how do we move forward? 😁

---

### Setting It Up

Good news: Kotlin + Coroutines + Hibernate Reactive can work together!  

In your Ktor project, add these dependencies:

    implementation("org.hibernate.reactive:hibernate-reactive-core:4.1.3.Final")
    implementation("io.vertx:vertx-pg-client:5.0.5")
    implementation("org.hibernate.validator:hibernate-validator:9.0.1.Final")
    implementation("org.glassfish:jakarta.el:4.0.2")
    implementation("io.smallrye.reactive:mutiny-kotlin:2.0.0")

The thing to note here is there is no JDBC driver, we instead use the "vertx-pg-client" which is a non-blocking driver.

To get Hibernate working, we need a "persistence.xml" file -

    <persistence xmlns="https://jakarta.ee/xml/ns/persistence"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="https://jakarta.ee/xml/ns/persistence https://jakarta.ee/xml/ns/persistence/persistence_3_0.xsd"
             version="3.0">
        <persistence-unit name="postgresql-example">
            <provider>org.hibernate.reactive.provider.ReactivePersistenceProvider</provider>

            <class>dev.rockyj.todo.domain.entities.User</class>

            <properties>
                <!-- PostgreSQL -->
                <property name="jakarta.persistence.jdbc.url"
                          value="jdbc:postgresql://localhost:5432/demo_app_dev"/>

                <!-- Credentials -->
                <property name="jakarta.persistence.jdbc.user"
                          value="demo_app_user"/>
                <property name="jakarta.persistence.jdbc.password"
                          value="secret123"/>

                <!-- The Vert.x SQL Client connection pool size -->
                <property name="hibernate.connection.pool_size"
                          value="10"/>

                <property name="jakarta.persistence.schema-generation.database.action"
                          value="validate"/>

                <!-- SQL statement logging -->
                <property name="hibernate.show_sql" value="true"/>
                <property name="hibernate.format_sql" value="true"/>
                <property name="hibernate.highlight_sql" value="true"/>
            </properties>
        </persistence-unit>
    </persistence>


Our "Entity" pretty much looks like a standard JPA entity -

    package dev.rockyj.todo.domain.entities


    import dev.rockyj.todo.domain.dtos.UserDTO
    // data class UserDTO(val id: UUID, val email: String?)
    import jakarta.persistence.*
    import org.hibernate.Hibernate
    import java.io.Serializable
    import java.util.*

    @Entity
    @Table(name = "users")
    class User : Serializable {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        @Column(name = "id", nullable = false, updatable = false)
        lateinit var id: UUID

        @Column(name = "email", columnDefinition = "TEXT", nullable = false)
        var email: String? = null

        @Column(name = "password_hash", columnDefinition = "TEXT", nullable = false)
        var passwordHash: String? = null

        fun toDTO(): UserDTO {
            return UserDTO(this.id, this.email)
        }

        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (other == null || Hibernate.getClass(this) != Hibernate.getClass(other)) return false
            other as User

            return id == other.id
        }

        override fun hashCode(): Int = id.hashCode()
    }

And now for the final piece of the puzzle, how to run queries using Kotlin coroutines and Hibernate which only supports "Mutiny".

First we need the right Hibernate "session factory" -

    package dev.rockyj.todo.config

    import jakarta.persistence.Persistence
    import org.hibernate.reactive.mutiny.Mutiny

    object HibernateConfig {
        val sessionFactory: Mutiny.SessionFactory by lazy {
            val emf = Persistence.createEntityManagerFactory("postgresql-example")
            emf.unwrap(Mutiny.SessionFactory::class.java)
        }
    }

And then with the Mutiny + Kotlin integration we can get this working in a Ktor router -


    fun Application.configureRouting() {
        routing {
            route("/api/v1") {
                // Health check endpoint
                get("/health") {
                    val threadInfo = mapOf(
                        "thread_name" to Thread.currentThread().name,
                        "is_virtual" to Thread.currentThread().isVirtual
                    )

                    val message = Uni.createFrom().item("Mutiny ❤ Kotlin").awaitSuspending()

                    // A sample DB Query
                    val data = sessionFactory
                        .withSession { session ->
                            session.find(User::class.java, UUID.randomUUID())
                        }
                        .awaitSuspending()
                        ?.toDTO()

                    call.respond(
                        HttpStatusCode.OK,
                        mapOf(
                            "status" to "healthy",
                            "timestamp" to System.currentTimeMillis(),
                            "thread_info" to threadInfo,
                            "message" to message,
                            "user" to data
                        )
                    )
                }
            }
        }
    }

Please note that in this case I put the query in the router itself, but in a real-world application you will probably put this in a separate repository class. The main thing here is the `awaitSuspending` function which converts the `Uni` to a "suspend" function.

That is it! We now have a fully non-blocking Ktor + Hibernate Reactive setup, which should scale & perform really well. Happy programming!
