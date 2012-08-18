--- 
title: "Setting up Solr"
tags: Solr
date: 08/05/2012
---

Few of my Ruby friends have a hard time setting up Solr for their Prod / EC2 servers. Solr is a Java web application and also come with a Jetty distribution so that you can just do -
    
    java -jar SOLR_DOWNLOAD/example/start.jar

This however is not recommended for production as this is just running Solr on the bundled Jetty and Solr Admin is unsecured.

To setup a clean and secure Solr instance, I usually do the following -

1. Copy the $SOLR_DOWNLOAD/example/solr directory somewhere else. For example $HOME/config/solr. This is now your solr config directory.
2. Download Tomcat and add the following line to $TOMCAT_HOME/bin/catalina.sh
    <pre>CATALINA_OPTS="-Dsolr.solr.home=/home/rockyj/conf/solr"</pre>
This basically sets the solr.solr.home Java environment variable.
3. Copy the solr.war (you may need to rename this) from your SOLR_DOWNLOAD/dist to $TOMCAT_HOME/webapps.
4. Start Tomcat
    <pre>$TOMCAT_HOME/bin/startup.sh</pre>
5. Go to http://localhost:8080/solr. You should see the Solr home page with the link to Admin page. The Admin is unsecured right now. The basic Solr installation works now.
6. Shutdown Tomcat.
7. Let us now add a Solr core. Solr core allow you to use a single Solr webapp with many configurations and indexes for different aplications, each with their own config and schema.
8. In your $HOME/config/solr/solr.xml file edit the cores tag like this -
    <pre>
      &lt;cores adminPath="/admin/cores" defaultCoreName="collection1"&gt;
        &lt;core name="collection1" instanceDir="." /&gt;
        &lt;core name="core1" instanceDir="./core1" /&gt;
      &lt;/cores&gt;</pre>
This creates a new core which will look for its config in $HOME/config/solr/core1/ (in our case). The default core will be called "collection1" and our new core is "core1".
9. Now create a directory in your $HOME/config/solr called "core1" and copy the "conf" directory from $HOME/config/solr into the "core1" directory. Create an empty directory called "data" as well in "core1".
10. Now your new core is all setup. Restart Tomcat and check the admin page, you should see a new core listed there.
11. Let us secure the admin page then. We will do this the standard Java way. In your $TOMCAT_HOME/webapps/solr/WEB-INF/web.xml add -
    <pre>
      &lt;security-constraint&gt;
        &lt;web-resource-collection&gt;
          &lt;web-resource-name&gt;Solr Admin&lt;/web-resource-name&gt;
          &lt;url-pattern&gt;/admin/*&lt;/url-pattern&gt;
          &lt;url-pattern&gt;/collection1/admin/*&lt;/url-pattern&gt;
          &lt;url-pattern&gt;/core1/admin/*&lt;/url-pattern&gt;
        &lt;/web-resource-collection&gt;
        &lt;auth-constraint&gt;
          &lt;role-name&gt;tomcat&lt;/role-name&gt;
        &lt;/auth-constraint&gt;
      &lt;/security-constraint&gt;
      &lt;login-config&gt;
        &lt;auth-method&gt;BASIC&lt;/auth-method&gt;
        &lt;realm-name&gt;default&lt;/realm-name&gt;
      &lt;/login-config&gt;
    </pre>
Here we are basically securing url patterns (the admin pages) with HTTP BASIC and providing access to user "tomcat".
12. To activate the "tomcat" user, uncomment the tags in $TOMCAT_HOME/conf/tomcat-users.xml. You can change both the username and password there.
13. That's it, once Tomcat is restarted, the admin urls should pop up a HTTP BASIC auth window.
14. Finally don't forget to setup your firewall and block Tomcat's port 8080. For Ubuntu I highly recommend the ultra simple "UFW".