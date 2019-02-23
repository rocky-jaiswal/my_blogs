---
title: "Typesafe configuration with Javalin, Kotlin and Gradle"
tags: Kotlin, Gradle
date: 23/02/2019
---

While I strongly believe that Rail/Node/Elixir provide great development speed (and feature set) with good performance sometimes companies or developers really love the JVM and type safety. I personally like the JVM but I am not a big fan of Java's verbosity (or Scala's complexity) so I tend to avoid it, on the other hand __Kotlin__ looks & reads quite well and is a joy to write on ItelliJ Idea.

The downside of Kotlin as a web development backend is that there are not a lot of mature frameworks out there. SpringBoot may seem like a good default choice since it works well with Kotlin but if you are not a fan of magic & annotations (or a combination of both) then it does not seem too appealing.

[Awesome Kotlin](https://kotlin.link/) provides some good links on the young Kotlin ecosystem and the two strong candidates for web development for Kotlin are [Ktor](https://ktor.io/) and [Javalin](https://javalin.io/). While Ktor is all shiny, new, async and Netty based, Javalin is more traditional and JEE servlet spec compliant. So in terms of raw performance Ktor will be better but it is also less mature. We have to also keep in mind that both these frameworks are small, more like Express.js in the Node world (or Sinatra in the Ruby world) so you need to write a lot of code to add features on top like database integration etc., so in short a lot of features that you took for granted in Rails / Elixir are no longer there.

So let's imagine we are stuck with JVM and we need to build a API backend, we choose Kotlin + Javalin and then we start our development journey. Javalin is pretty good but sooner or later you need to read some configuration files, what's more your configuration for development environment may be quite different from let's say the QA environment e.g. DB config is different. In our simple example let's say that in QA we want to run our server on a different port.

While in Rails / Phoenix this is quite simple and you can easily have different configuration for different environments (a feature available out of the box) in the Javalin world you have no such luxuries. So let's get started on how to solve this tiny but interesting problem.

### Show me the code

Tecnically, the solution we want is quite simple, we want to pass in some sort of environment variable (like development or QA) and select a configuration file based on that variable.

Since we are on the JVM, we will use Gradle for building the project and that introduces us to our first challenge - how to define a environment / system variable in Gradle and pass it through to the application. To do that, create a file called _gradle.properties_ like -

    systemProp.application.environment=development

To consume this system property and pass it through the application we use the Gradle "application" plugin feature, where we can pass JVM arguments. Since we use Gradle with Kotlin DSL, this may look like -

    plugins {
        // Apply the Kotlin JVM plugin to add support for Kotlin on the JVM.
        id("org.jetbrains.kotlin.jvm").version("1.3.20")

        id("com.github.johnrengelman.shadow").version("4.0.4")

        // Apply the application plugin to add support for building a CLI application.
        application
    }

    repositories {
        // Use jcenter for resolving your dependencies.
        // You can declare any Maven/Ivy/file repository here.
        jcenter()
    }

    dependencies {
        // Use the Kotlin JDK 8 standard library.
        implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")

        // Use the Kotlin test library.
        testImplementation("org.jetbrains.kotlin:kotlin-test")

        // Use the Kotlin JUnit integration.
        testImplementation("org.jetbrains.kotlin:kotlin-test-junit")

        // App dependencies
        implementation("io.javalin:javalin:2.6.0")
        implementation("org.slf4j:slf4j-simple:1.7.25")
        implementation("com.fasterxml.jackson.core:jackson-databind:2.9.8")
        implementation(group = "com.uchuhimo", name = "konf", version = "0.13.1")
    }

    application {
        // Define the main class for the application.
        mainClassName = "de.rockyj.AppKt"
        applicationDefaultJvmArgs = listOf("-Dapplication.environment=${System.getProperty("application.environment")}")
    }


The main magic here is in the __second last line__, we use the Gradle system property we defined earlier and pass it as a JVM argument to our application.

Since we want to stay type safe, we use a type safe configuration library in our application called [konf](https://github.com/uchuhimo/konf). We then setup a "Configuration" singleton where we can use the passed in JVM argument to decide which YAML configuration file to pick.

    package de.rockyj.configuration

    import com.uchuhimo.konf.Config
    import com.uchuhimo.konf.ConfigSpec
    import java.io.InputStream

    object ApplicationConfiguration : ConfigSpec("server") {
        val port by required<Int>()
    }

    object Configuration {
        fun readConfiguration(): Config {
            val content = readConfigFile()
            return  Config{ addSpec(ApplicationConfiguration) }.from.yaml.inputStream(content)
        }

        private fun readConfigFile(): InputStream {
            val environment = System.getProperty("application.environment")
            return this::class.java.classLoader.getResource("conf/config_$environment.yaml").openStream()
        }
    }


Finally, we can then consume the configuration parameters somewhere (again in a type safe manner) -

    // App.kt
    fun main() {
        val config = Configuration.readConfiguration()
        val app = Javalin.create().start(config[ApplicationConfiguration.port])

        // Routes
        app.get("/") { RootHandler.get(it) }
    }

So then at build time, all we need to do is overwrite the _gradle.properties_ file and we are all set to pick configuration based on our environment. Ofcourse, all this looks simple and intuitive but it took me a while to get the right combination and figure this out, so hopefully this post helps someone out there. The full code is available on [Github](https://github.com/rocky-jaiswal/api-boilerplate).
