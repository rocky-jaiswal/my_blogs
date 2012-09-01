--- 
title: "Deploying Java application with Capistrano"
tags: Java, JRuby, Capistrano
date: 01/09/2012
---

The advantage of learning a few programming languages is that you apply one's paradigms to the other. When I was a Java programmer I never gave much thought to deployment. Maven would build a war file, which would be copied to the application server through a shell script or even via the IDE. For remote deployments we would just do the same from the build server via scp. I always found the Maven "Cargo" plugin too complicated so let just skip that for now.

Then I came into the Ruby world and learned (a bit) about Capistrano and was absolutely fascinated by it. It did so much so easily for deployment that using anything else seems pre-historic.

So I started suggesting my Java friends to use Capistrano. This post is my first attempt at deploying a Java EE6 project with Capistrano.

Lets start by creating a Java EE6 project from Maven (or whichever way you like). To keep our lives simple and stay withing the JVM world we will use JRuby (1.7.0 preview 2). If you already have JRuby setup run a "gem update" to avoid any pain.

Now just install the Capistrano gem in JRuby by running - 
  
    gem install capistrano

Now in the root directory of our JavaEE project run -

    capify .

Capistrano will now create some files with some default entries. 

Now, we will also use the Tomcat Manager for deployment so read up a bit [here](http://tomcat.apache.org/tomcat-7.0-doc/manager-howto.html) and setup your manager in $TOMCAT_HOME/conf/tomcat-users.xml. Make sure you give the manager __"manager-script"__ role so that we can do automated command line deployments through the manager.

We'll start of by using Capistrano for local deployment, I know that can be easily done through an IDE but we'll start off with this and for doing remote deployments it will be just a matter of changing the hostname and paths (and SSH setup of course).

So lets look at the capfile we update in $your-javaee-project/config/deploy.rb

    set :application, "jdeployer"
    set :scm, "git"
    set :repository, "git@github.com:rocky-jaiswal/#{application}.git"
    set :branch, "master"

    default_run_options[:pty] = true
    ssh_options[:forward_agent] = true #Line 7

    task :local do
        roles.clear
        server "localhost", :app #Line 11
        set :user, "rockyj" 
        set :java_home, "/home/#{user}/jdk1.7.0_05" #Line 13
        set :tomcat_home, "/home/#{user}/Apps/apache-tomcat-7.0.29"
        set :tomcat_manager, "manager"
        set :tomcat_manager_password, "manager"
        set :maven_home, "/home/#{user}/Apps/apache-maven-3.0.4"
        set :deploy_to, "/home/#{user}/tmp/#{application}" # Line 18
        set :use_sudo, false
        namespace :tomcat do
          task :deploy do
            puts "==================Building with Maven======================" #Line 22
            run "export JAVA_HOME=#{java_home} && cd #{deploy_to}/current && #{maven_home}/bin/mvn clean package"
            puts "==================Undeploy war======================"#Line 24
            run "curl --user #{tomcat_manager}:#{tomcat_manager_password} http://$CAPISTRANO:HOST$:8080/manager/text/undeploy?path=/#{application}"
            puts "==================Deploy war to Tomcat======================" #Line 26
            run "curl --upload-file #{deploy_to}/current/target/#{application}*.war --user #{tomcat_manager}:#{tomcat_manager_password} http://$CAPISTRANO:HOST$:8080/manager/text/deploy?path=/#{application}"
          end
        end
        after "deploy", "tomcat:deploy" #Line 30
        after "tomcat:deploy", "deploy:cleanup" # keep only the last 5 releases
    end 

Line 1 - 7 : We are using github as our code repo and the first 7 lines are basic Capistrano setup (nothing much to talk about). 

Line 11 - 18 : Then we define a custom task / namespace to keep our experiment isolated. We set the Java, Tomcat and other paths to get the basic setup in place. We will also use Maven to build our app so we specify its path as well. We will build the app in a temporary folder so we set that path as well. 

Line 30 : The default Capistrano task is "deploy" which will take the updated version of code from git check it out in the specified directory. After the deploy command we will run our own custom commands through Capistrano's DSL. 

Line 22 - 23 : Now we start using Capistrano's DSL and run commands on remote servers via ssh. First we set the right JAVA_HOME and change the directory to where our code is. Then we build our project through Maven. Please note we need to run the commands in the same shell and that is why we do "command a && command b". We cannot specify commands in separate lines as Capistrano opens a new shell for each command when we run it with the "run" method call.

Line 24 - 27 : Next using the Tomcat manager and curl (since Tomcat Manager works on HTTP), we undeploy the existing version of the application and finally deploy the Maven built new version. We use the "$CAPISTRANO:HOST" variable to avoid hardcoding and getting the hostname where Capistrano commands are being run.

We will first test this on localhost, so make sure you have your local ssh server running. In Fedora I do -

    sudo service sshd start

Finally, make sure you have local SSH keys setup and your Tomcat is running with the manager properly configured. Now finally run this single command to deploy your Java application -

    cap local deploy

That is it, since the build is made from github make sure you push your changes out before running this command to see your changes on the browser. This may seem a lot for a local deploy but now just change the ":server" hostname to deploy to a server remotely (ofcourse, you may need to change your Maven / JDK paths as well according to your remote server setup). After this you can now deploy a new "war" build to a remote server with a single command. You can also write your own custom tasks with Capistrano and sit back and enjoy painless deployments.

