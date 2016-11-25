--- 
title: "Puppet in a rush"
tags: Puppet, DevOps
date: 08/04/2013
---

It is a good time to be a programmer now. Barriers are disappearing and technology is evolving not only quickly but also in the right direction. I remember when I started 10 years back, it was common for project to run for 12-18 months with the first 3 months spent on discussions and so called "requirement gathering". Now, with good developers on board we try to start programming from day two or three and try to deliver a working solution within the first month of project kickoff. 

Within the last year itself, I did more projects on and off work than I can remember and each project carried its own development, testing and production environment. While trying to be agile yet robust, managing environments can be a pain. That is why I decided to look into [Puppet](http://puppetlabs.com/) and gave it high priority on my list of things to learn in 2013.

![Automate](/images/automate.gif "Automate")

While Puppet is pretty good, I had a hard time with the documentation and when you are an impatient guy like me you want everything served super hot and super quick. So this blog is dedicated to get you up and started with Puppet quickly, later you should learn more using the official documentation.

First things first, __what is Puppet and why should you use it?__ Puppet is a set of tools which enable you to setup a server by using a easy to write language that Puppet understands. Puppet makes setting up servers / environments super easy, as the Puppet configuration can be just copied and applied on any server. This also helps us in case of server crashes, server migrations etc. Also, it's pretty cool to setup a whole server just by running a command from the terminal. While one can also do this via a shell script it won't be an [idempotent](http://en.wikipedia.org/wiki/Idempotence) and reusable solution.

Next, Puppet comes in two flavors Open Source and Enterprise. The names tell the story so I won't do the details. Ofcourse, we will be using the open source version. Also Puppet works in two models, standalone and client-server. In the client-server mode, a server monitors and maintains the nodes (other servers) and standalone puppet is well standalone. Most projects work well with the standalone mode and unless you want to run a data center of your own you will do fine with the standalone mode.

Ok, now lets get started with the Puppet lingo. If you come to think of it, a server is a collection of packages, services, files etc. and basically that is what Puppet provides you. These "things" are called resources, which we describe using Puppet's DSL (lingo / Domain Specific Language). Have a look at this [cheat sheet](http://docs.puppetlabs.com/puppet_core_types_cheatsheet.pdf).

As the cheat sheet says, if you know just three resources - package, file and service you can setup a server easily. Using the DSL we describe the desired state of the server. For example, I want Python3 installed, Apache running and a certain file in my home folder. Using the DSL we describe this desired server setup and when we ask Puppet to apply this configuration, Puppet parses the DSL and does the job. You can run the setup as many time as you want without fearing loss of files or data.

Now, have a look at this [page](http://docs.puppetlabs.com/learning/ral.html).

To organize our instructions / DSL we put the code in manifest files (.pp extension) and then apply the configuration using the command -

    puppet apply file1.pp

Before we look at some code, we need to understand a couple of more fundamentals namely classes and modules. Classes are a way to organize Puppet code, we put code realated to one aspect in one class. For example, code for Apache setup can be in the apache manifest class. On the other hand, modules are way to distribute code. If you follow Puppet's file and folder naming convention we can distribute manifests easily and use modules someone has already created (someone in the world would have installed MySql using Puppet right?) so we don't have to write code ourselves. Finally like all languages Puppet DSL has variables and conditionals. 

With this knowledge, let us look at a simple manifest (java.pp) -

    class dashboard::java {

      package { "openjdk-7-jdk": 
        ensure  => present 
      }

      package { "maven": 
        ensure  => present,
        require => Package["openjdk-7-jdk"]
      }
      
    }

In the code above we define a "java" class under the namespace "dashboard" that is our project name. We then make sure two packages are installed - openjdk7 and maven. Since maven requires JDK we put that in as a "requirement". There are four metaparameters that let you arrange resources in particular order - before, require, notify, and subscribe. See details [here](http://docs.puppetlabs.com/learning/ordering.html).

We can write similar manifest files for PostgreSql or nginx according to the stack we want. A simple google search will reveal pre-written modules which you can download, include and customize.

Talking of include, we wrote the "java.pp" class earlier but how do we run it. Usually we create separate manifests for all aspects we need and then create a main manifest file which includes these classes and we run the main manifest, which could look like -

    class dashboard::production {

      include dashboard::nginx
      include dashboard::java
      include dashboard::tomcat
      include dashboard::postgresql

      Exec {
        path => "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      }
    }

To run the main manifest we can write a shell script -

    #!/bin/sh

    sudo puppet apply --modulepath=modules -v -e 'include dashboard::production'

Importantly, a word about modules. See the heading "Module Structure" [here](http://docs.puppetlabs.com/learning/modules1.html). Simply put, we want a directory structure which follows some convention like this - 

    my_module — **This outermost directory’s name matches the name of the module**
    --> manifests/ — **Contains all of the manifests in the module**
      --> init.pp — **Contains a class definition. This class’s name must match the module’s name**
      --> other_class.pp — **Contains a class named my_module::other_class**
        --> my_defined_type.pp — **Contains a defined type named my_module::my_defined_type**
      --> files/
        --> static/
          ...

On our fresh Ubuntu server now we just need to run a few commands -

    $ wget http://apt.puppetlabs.com/puppetlabs-release-precise.deb

    $ sudo dpkg -i puppetlabs-release-precise.deb

    $ sudo apt-get update

    $ sudo apt-get install puppet-common

    $ sudo apt-get install git

    $ git clone git@github.com:rocky-jaiswal/dashboard-devops.git

    $ cd dashboard-devops

    $ chmod u+x setup.sh

    $ ./setup.sh

The first four commands install the puppet standalone module. Then via git we clone our puppet code and then we run the setup. That's it! In a few commands, we have a ready to use server. 

Before signing off, it is important to mention -

- [Chef](http://www.opscode.com/chef/) : Puppet's main rival. I found the documentation hard to read and find so I went with Puppet but you may want to give it a look.

- [Vagrant](http://www.vagrantup.com/) : While Puppet will setup your server, Vagrant will make it super easy to spin up a new VM by running a command at the terminal. Also, Vagrant and Puppet are good friends (i.e. they integrate easily)

- [Capistrano](https://github.com/capistrano/capistrano) : You have setup a server via a command line, now you don't want to deploy with anything apart from a command line. See my earlier blog post for using Capistrano for Java projects.

I made a sample Puppet project which is available on [github](https://github.com/rocky-jaiswal/dashboard-devops). Please contribute and fix my mistakes if you find any.