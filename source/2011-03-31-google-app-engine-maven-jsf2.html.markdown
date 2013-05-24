---
title: Google App Engine + Maven + JSF2
tags: Cloud, Java, Maven
date: 31/03/2011
---

I have tried to put all the keywords in the title of this blog, hoping that it will turn some heads. Google App Engine (GAE) provides a great hosting platform for open source apps written in Java/Python. So if you have no qualms about hosting you Java applications on a public server then you have no better choice than GAE.

The only catch however is, that GAE does not support certain APIs (see the white-list here - <a href="http://code.google.com/intl/de/appengine/docs/java/jrewhitelist.html" target="_blank">http://code.google.com/intl/de/appengine/docs/java/jrewhitelist.html</a>). This restriction makes it difficult to host certain apps / frameworks.

GAE provides the infrastructure, a modified Jetty server included in the GAE SDK (<a href="http://code.google.com/appengine/downloads.html" target="_blank">http://code.google.com/appengine/downloads.html</a>) though which you can test your app. If it runs on the local GAE Jetty server then it will also run on GAE itself. The project structure that Google asks you to create for uploading an app is also quite typical (unless you use Ant) which brings me to my next point.


Maven is my favorite build tool, it would really take something for me to move on to Ant now. So I tried to create my application using Maven and then test it locally on GAE's Jetty and finally upload it to GAE. After a little search I found the Maven GAE plugin (<a href="http://code.google.com/p/maven-gae-plugin/">http://code.google.com/p/maven-gae-plugin/</a>).

Below is my pom.xml to make this plugin work - 

    <project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">

        <modelVersion>4.0.0</modelVersion>
        <groupId>net.rocky</groupId>
        <artifactId>rocky-gae-app</artifactId>
        <packaging>war</packaging>
        <version>1</version>
        <name>rocky-gae-app</name>
        <url>http://maven.apache.org</url>

        <repositories>
            <repository>
                <id>java.net</id>
                <url>http://download.java.net/maven/2</url>
            </repository>
        </repositories>

        <pluginRepositories>
            <pluginRepository>
                <id>maven-gae-plugin-repo</id>
                <name>maven-gae-plugin repository</name>
                <url>http://maven-gae-plugin.googlecode.com/svn/repository</url>
            </pluginRepository>
        </pluginRepositories>

        <dependencies>
            <dependency>
                <groupId>javax.servlet</groupId>
                <artifactId>servlet-api</artifactId>
                <version>2.5</version>
                <scope>provided</scope>
            </dependency>
            <dependency>
                <groupId>javax.servlet.jsp</groupId>
                <artifactId>jsp-api</artifactId>
                <version>2.1</version>
                <scope>provided</scope>
            </dependency>
            <dependency>
                <groupId>com.sun.faces</groupId>
                <artifactId>jsf-api</artifactId>
                <version>2.0.2</version>
            </dependency>
            <dependency>
                <groupId>com.sun.faces</groupId>
                <artifactId>jsf-impl</artifactId>
                <version>2.0.2</version>
                <classifier>gae</classifier>
            </dependency>
            <dependency>
                <groupId>org.glassfish.web</groupId>
                <artifactId>el-impl</artifactId>
                <version>2.2</version>
            </dependency>
            <dependency>
                <groupId>junit</groupId>
                <artifactId>junit</artifactId>
                <version>4.8.1</version>
                <scope>test</scope>
            </dependency>
        </dependencies>

        <build>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <version>2.0.2</version>
                    <configuration>
                        <source>1.6</source>
                        <target>1.6</target>
                    </configuration>
                </plugin>
                <plugin>
                    <groupId>net.kindleit</groupId>
                    <artifactId>maven-gae-plugin</artifactId>
                    <version>0.6.0</version>
                    <configuration>
                        <sdkDir>/home/rockyj/01rocky/02apps/appengine-java-sdk-1.3.5</sdkDir>
                    </configuration>
                </plugin>
            </plugins>
            <finalName>rocky-gae-app</finalName>
        </build>
        
    </project>

I have included the whole pom as there is hardly anything I can miss here. The GAE plugin is not in maven central so we need to include the plugin repository, the dependencies are pretty standard except one (which I will explain in a moment) and the plugin itself needs the configuration to know where you have the GAE SDK.

As I mentioned earlier, some classes are blacklisted on the GAE so your default jsf-impl.jar (Mojarra) wil not work on GAE. You will need a modified jar which you can download from here (<a href="http://code.google.com/p/joshjcarrier/source/browse/trunk/Sun%20JSF%20GAE/jsf-impl-gae.jar">http://code.google.com/p/joshjcarrier/source/browse/trunk/Sun%20JSF%20GAE/jsf-impl-gae.jar</a>), if you have a Nexus repo you can install the modified jar there or install the jar in you local repository manually. Also as seen in the pom, for resolving EL (Expression Language) you need el-impl.jar, GAE does not support EL unlike Tomcat. 

To make JSF work you need the following entries in your web.xml -

    <!-- Seems like GAE 1.2.6 cannot handle server side session management. At least for JSF 2.0.1 --> 
    <context-param> 
      <param-name>javax.faces.STATE_SAVING_METHOD</param-name> 
      <param-value>client</param-value> 
    </context-param> 
    <!-- Recommendation from GAE pages  --> 
    <context-param> 
      <param-name>javax.faces.PROJECT_STAGE</param-name> 
      <param-value>Production</param-value> 
    </context-param>
    <!-- Accommodate Single-Threaded Requirement of Google AppEngine  -->
    <context-param>
      <param-name>com.sun.faces.enableThreading</param-name>
      <param-value>false</param-value>
    </context-param>

Finally, in your appengine-web.xml (the GAE configuration file), you need the following entry - 

    <sessions-enabled>true</sessions-enabled>

That's it. Now you can work on your JSF2 application. To test, all you need to do is : mvn clean gae:run

For uploading the application, I would still recommend using the SDK provided script (otherwise you need a whole lot of other changes). What I do is - 

$HOME/01rocky/02apps/appengine-java-sdk-1.3.5/bin/appcfg.sh update /home/rockyj/01rocky/03workspace/scbcd/rocky-gae-app/target/rocky-gae-app/

This means run the GAE script with the param "update" and the path to your maven created target folder. If you have signed up for GAE, it will ask your username and password and your app will be uploaded to GAE.
