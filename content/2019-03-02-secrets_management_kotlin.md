---
title: "Secrets management in a Kotlin application"
tags: Kotlin, Gradle
date: 02/03/2019
---

Rails 5.1 introduced a feature that I like a lot - __encrypted secrets__. To secure sensitive data like passwords or tokens, Rails allows you to write them in encrypted configuration file. With an encryption key we are able to read those secrets like a normal configuration file, but without the key it is not possible to read the content of the encrypted file. The encrypted file can be safely shared on Git and the encryption key can be provided at runtime as an environment variable.

So running the Rails application on any environment (Docker / Kubernetes / VM / bare metal) is as simple as -

    RAILS_MASTER_KEY=secret RAILS_ENV=qa bin/rails s

So with just two environment variables we can run our application anywhere safely. With the JVM, we can do one better since the whole application can be packed as a _jar_ file, and ideally I would just like to run -

    APP_SECRET=secret APP_ENV=qa java -jar myapp.jar

So with one jar file and two environment variables we are fully portable to any environment and I think that is great (pretty close to the Docker promise). So let's get started to realize this mission.

Imagine we have _secrets.yaml_ file in our src/main/resources directory of the Kotlin project -

    ---
    development:
      password: "Secret$123"
    qa:
      password: "Secret$098"

Ofcourse, the most important thing is that the unencrypted _secrets.yaml_ file is never added to git and the same for the _gradle.properties_ file where we keep the encryption keys (just add them to .gitignore).

The main tasks then are -

1. Encrypt the secrets file
2. Make the encryption keys available in the Kotlin application
3. In the Kotlin application use the keys to decrypt the YAML in memory and then parse it
4. Make the parsed YAML configuration available as a simple __Map__ to work within the application

### Encrypt the secrets file

To encrypt the secrets we turn to Ruby for a couple of reasons, first it can be executed as a simple script and second it helps us choose random keys we otherwise have to (manually) think of or generate. The script also writes the random keys to our _gradle.properties_ file so we do not have to handle the keys ourselves.

So here is the script -

    #!/usr/bin/ruby

    require 'securerandom'
    require 'openssl'
    require 'base64'

    r1 = SecureRandom.hex(32)[0, 32]
    r2 = SecureRandom.hex(16)[0, 16]

    cipher = OpenSSL::Cipher::AES.new(256, :CBC)
    cipher.encrypt

    cipher.key = r1
    cipher.iv = r2

    encrypted = ""
    File.readlines('src/main/resources/secrets/secrets.yaml').each do |line|
        encrypted << cipher.update(line)
    end
    encrypted << cipher.final

    File.write('src/main/resources/secrets/secrets.enc', Base64.encode64(encrypted))

    # Write secrets to properties file
    properties = <<~HEREDOC
                      systemProp.application.environment=development
                      systemProp.application.key=#{r1}
                      systemProp.application.iv=#{r2}
                    HEREDOC

    File.write('gradle.properties', properties)

We have chosen the AES-256 algorithm since it is super secure so our encrypted data is safe on git. In the script, we read the secrets file and write the encrypted version back. We also Base64 the result so it is pure text and can be easily viewed / diffed with git. Finally we write the keys to our _gradle.properties_ file.

### Make the encryption keys available in the Kotlin application

Since the ruby script wrote the keys to our _gradle.properties_ file, we can now inject them using gradle's system properties in the build file like -

    application {
        // Define the main class for the application.
        mainClassName = "de.rockyj.AppKt"
        applicationDefaultJvmArgs = listOf(
                "-Dapplication.environment=${System.getProperty("application.environment")}",
                "-Dapplication.key=${System.getProperty("application.key")}",
                "-Dapplication.iv=${System.getProperty("application.iv")}")
    }

### Decrypt the encrypted YAML and make it available in the application

We now turn to Java's cipher libraries to decrypt and parse the encrypted YAML and the code is now simple -

    // Secrets.kt
    package de.rockyj.configuration

    import org.apache.commons.codec.binary.Base64
    import org.yaml.snakeyaml.Yaml
    import javax.crypto.Cipher
    import javax.crypto.spec.IvParameterSpec
    import javax.crypto.spec.SecretKeySpec

    object Secrets {
        private val environment = System.getProperty("application.environment")
        private val keyBytes = System.getProperty("application.key").toByteArray()
        private val ivBytes  = System.getProperty("application.iv").toByteArray()

        private val byteArray = this::class.java.classLoader.getResource("secrets/secrets.enc").readBytes()

        private val iv = IvParameterSpec(ivBytes)
        private val keySpec = SecretKeySpec(keyBytes, "AES")
        private val cipher = Cipher.getInstance("AES/CBC/PKCS5PADDING")

        init {
            cipher.init(Cipher.DECRYPT_MODE, keySpec, iv)
        }

        fun decrypt(): Map<String, String>? {
            val textYaml = cipher.doFinal(Base64.decodeBase64(byteArray))
            return Yaml().load<Map<String, Map<String, String>>>(String(textYaml))[environment]
        }
    }

We can now consume the environment specific secrets anywhere in the application easily -

    Secrets.decrypt()?.get("password")

That's pretty much it, at the build time we can generate the _gradle.properties_ file based on our environment and have our application all ready to build / run with one single command. So we are done with our little experiment here but I would maybe not recommend this for now for enterprise grade production apps :) The code is available on [my GitHub](https://github.com/rocky-jaiswal/api-boilerplate).
