---
title: Using Spring for Scheduling Tasks
date: 29/06/2011
tags: Spring, Java
---

One of the common requirements we face as developers is to do things in a scheduled manner. For example, check database for change every 10 mins and do something if a change has occurred or send emails at a specific time. The Spring documentation is a bit thin on this one although Spring does a fantastic job of scheduling things. So in this blog I am going explain how I used Spring for scheduling things. Please note I am using Spring 3.

__First of all here is my Spring application context file to enable annotations etc.__

    <beans xmlns="http://www.springframework.org/schema/beans"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:p="http://www.springframework.org/schema/p"
        xmlns:context="http://www.springframework.org/schema/context" xmlns:tx="http://www.springframework.org/schema/tx"
        xmlns:security="http://www.springframework.org/schema/security"
        xsi:schemaLocation="
        http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-3.0.xsd
        http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context-3.0.xsd
        http://www.springframework.org/schema/task http://www.springframework.org/schema/task/spring-task-3.0.xsd
        http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx-2.5.xsd
        http://www.springframework.org/schema/security http://www.springframework.org/schema/security/spring-security-3.0.3.xsd">

        <context:component-scan base-package="in.rockyj" />
            
        <context:property-placeholder location="classpath:/dev.app.properties"/>
            
        <bean id="threadPoolTaskScheduler" class="org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler">
            <property name="poolSize" value="3" />
        </bean>

    </beans>

Here I am doing three things basically - 
1. Setting up a component scan for handling Spring annotations 
2. Informing Spring about a properties file 
3. Setting up a bean - ThreadPoolTaskScheduler which is a Spring provided class for scheduling stuff.

The ThreadPoolTaskScheduler a Spring provided class that handles the scheduling logic for us. All it needs is a thread pool size which defaults to 1. This class provides various methods to schedule tasks, for example scheduleWithFixedDelay method takes two parameters - a runnable task and the delay after which the task should be run. For example see code below -

__in my properties file there is only one entry - __

    service.pollTime=10000

__My main Scheduler class - __

    @Component
    public class Scheduler {

        @Resource
        ThreadPoolTaskScheduler threadPoolTaskScheduler;
            
        @Resource
        Worker worker;
            
        @Value("${service.pollTime}")
        Long servicePollTime;
            
        /**
         * Schedule the run of the worker
        */
        public void schedule() {
            threadPoolTaskScheduler.scheduleWithFixedDelay(worker, servicePollTime);
        }
    }

__My Worker class - __

    @Component
    public class Worker implements Runnable {
            
        @Override
        public void run() {
            //Main task goes here - For example just a console output
            System.out.println(Thread.currentThread().getName() + " working ... Time - " + new Date());
        }
            
    }

__And finally my main class - __

    public class App {

        /**
         * Main method to run the application
         */
        public static void main(String[] args) {
            ApplicationContext context = loadSpringContext();
            Scheduler scheduler = context.getBean(Scheduler.class);
            scheduler.schedule();
        }

        private static ApplicationContext loadSpringContext() {
            ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("classpath*:applicationContext.xml");
            context.start();
            return context;
        }
    }

__Which gives me the output - __

    threadPoolTaskScheduler-1 working ... Time - Wed Jun 29 13:02:17 IST 2011
    threadPoolTaskScheduler-1 working ... Time - Wed Jun 29 13:02:27 IST 2011
    threadPoolTaskScheduler-1 working ... Time - Wed Jun 29 13:02:37 IST 2011
    ...

This is pretty self explanatory stuff. The main advantage here is that I have not cluttered my code with any Scheduling logic, the classes are loosely coupled and everything is 100% testable. :)