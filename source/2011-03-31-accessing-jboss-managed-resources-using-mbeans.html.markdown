---
title: Accessing JBoss managed resources using MBeans
tags: JBoss
date: 31/03/2011
---

Recently I was working on an application that enables users to view the message count and the message content on all Queues deployed on a JBoss instance. Mainly, this application can be used by administrators to manage JMS Queues, it also provides a simple interface to create / delete queues as well as monitor messages on them.

The challenge was to dynamically retrieve all the Queues deployed on the server and to make this application portable to any JBoss server instance.

__The Solution__
In JBoss all components/services are Mbeans. An MBean is a Java object that implements one of the standard MBean interfaces and follows the associated design patterns. The MBean for a resource exposes all necessary information and operations that a management application needs to control the resource.

So using the MBeans API you can, let's say create a queue at runtime programatically. In the following exercise, we look at the code that will retrieve all JMS Queues deployed on a particular JBoss instance.


An interesting application to note is the __jmx-console__ application that is packaged within JBoss. This application kind of does what we want to do. It displays all the MBeans deployed on the server.

To see jmx-console, start the JBoss server on your local machine and go to __http://localhost:8080/jmx-console__

Straight away lets start with some code, below is the listing of a Servlet that contains our core logic -

__QBrowser.java__

        package net.rocky.qsoft.web;

        import java.io.IOException;
        import java.io.PrintWriter;
        import java.util.ArrayList;
        import java.util.List;
        import java.util.Map;
        import java.util.Set;
        import java.util.TreeMap;

        import javax.management.JMException;
        import javax.management.MBeanServer;
        import javax.management.ObjectName;
        import javax.servlet.ServletException;
        import javax.servlet.http.HttpServlet;
        import javax.servlet.http.HttpServletRequest;
        import javax.servlet.http.HttpServletResponse;

        import net.rocky.qsoft.model.MBeanData;

        import org.jboss.mx.util.MBeanServerLocator;

        public class QBrowser extends HttpServlet {

        	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        		PrintWriter writer = resp.getWriter();
        		try {
        			Map<String, List<MBeanData>> domainData = getDomainData("jboss.messaging.destination:*");

        			for (String key : domainData.keySet()) {
        				writer.print("<b>Domain Name - " + key + "</b></br>");
        				List<MBeanData> data = domainData.get(key);
        				for (MBeanData beanData : data) {
        					writer.print(beanData.getNameProperties() + "</br>");
        				}
        			}
        		} catch (Exception e) {
        			e.printStackTrace();
        		}
        	}

        	private Map<String, List<MBeanData>> getDomainData(String filter) throws JMException {
        		MBeanServer server = getMBeanServer();
        		Map<String, List<MBeanData>> domainDataMap = new TreeMap<String, List<MBeanData>>();

        		if (server != null) {
        			ObjectName filterName = null;
        			if (filter != null)
        				filterName = new ObjectName(filter);

        			Set<ObjectName> objectNames = server.queryNames(filterName, null);

        			for (ObjectName objectName : objectNames) {
        				List<MBeanData> data = null;
        				
        				MBeanData mbeanData = new MBeanData(objectName, server.getMBeanInfo(objectName));
        				String domainName = objectName.getDomain();
        				System.out.println(domainName + "->" + objectName.toString());
        				
        				if (domainDataMap.containsKey(domainName)){
        					data = (List<MBeanData>) domainDataMap.get(domainName);
        					data.add(mbeanData);
        				}
        				else {
        					data = new ArrayList<MBeanData>();
        					data.add(mbeanData);
        					domainDataMap.put(domainName, data);
        				}
        			}
        		}
        		return domainDataMap;
        	}

        	private MBeanServer getMBeanServer() {
        		return MBeanServerLocator.locateJBoss();
        	}

        }

The main piece of code here lies in the method getMBeanServer(), here we locate a reference to the main JBoss MBean. Thereafter, using the MBean API we retrieve the ObjectNames that match our filter - jboss.messaging.destination, this helps us retrieve references only to messaging destinations MBeans, you can use some other filter to retrieve other types of MBeans, or leave filter as null to get all the MBeans.

Then we iterate over the returned Set of ObjectNames and create a bean of type MBeanData - containing the ObjectName and the MBeanInfo (which describes the set of attributes and operations which are available for management operations, thus is quite important).

Since all the Queues will have the same domain name, in the value part of the map we have a List of MBeanData. We then iteratively add beans to this list and later print them out.

We create 1 helper classes -

__MBeanData.java__

        package net.rocky.qsoft.model;

        import javax.management.MBeanInfo;
        import javax.management.ObjectName;

        /**
         * An mbean ObjectName and MBeanInfo pair that is orderable by ObjectName.
         *
         * @author Scott.Stark@jboss.org
         * @version $Revision: 81038 $
         */
        public class MBeanData implements Comparable {

        	private ObjectName objectName;
        	private MBeanInfo metaData;

        	public MBeanData() {
        	}

        	public MBeanData(ObjectName objectName, MBeanInfo metaData) {
        		this.objectName = objectName;
        		this.metaData = metaData;
        	}

        	/**
        	 * Getter for property objectName.
        	 *
        	 * @return Value of property objectName.
        	 */
        	public ObjectName getObjectName() {
        		return objectName;
        	}

        	/**
        	 * Setter for property objectName.
        	 *
        	 * @param objectName
        	 *            New value of property objectName.
        	 */
        	public void setObjectName(ObjectName objectName) {
        		this.objectName = objectName;
        	}

        	/**
        	 * Getter for property metaData.
        	 *
        	 * @return Value of property metaData.
        	 */
        	public MBeanInfo getMetaData() {
        		return metaData;
        	}

        	/**
        	 * Setter for property metaData.
        	 *
        	 * @param metaData
        	 *            New value of property metaData.
        	 */
        	public void setMetaData(MBeanInfo metaData) {
        		this.metaData = metaData;
        	}

        	/**
        	 * @return The ObjectName.toString()
        	 */
        	public String getName() {
        		return objectName.toString();
        	}

        	/**
        	 * @return The canonical key properties string
        	 */
        	public String getNameProperties() {
        		return objectName.getCanonicalKeyPropertyListString();
        	}

        	/**
        	 * @return The MBeanInfo.getClassName() value
        	 */
        	public String getClassName() {
        		return metaData.getClassName();
        	}

        	/**
        	 * Compares MBeanData based on the ObjectName domain name and canonical key
        	 * properties
        	 *
        	 * @param the
        	 *            MBeanData to compare against
        	 * @return < 0 if this is less than o, > 0 if this is greater than o, 0 if
        	 *         equal.
        	 */
        	public int compareTo(Object o) {
        		MBeanData md = (MBeanData) o;
        		String d1 = objectName.getDomain();
        		String d2 = md.objectName.getDomain();
        		int compare = d1.compareTo(d2);
        		if (compare == 0) {
        			String p1 = objectName.getCanonicalKeyPropertyListString();
        			String p2 = md.objectName.getCanonicalKeyPropertyListString();
        			compare = p1.compareTo(p2);
        		}
        		return compare;
        	}

        	public boolean equals(Object o) {
        		if (o == null || (o instanceof MBeanData) == false)
        			return false;
        		if (this == o)
        			return true;
        		return (this.compareTo(o) == 0);
        	}
        }

Here's my __pom.xml__

        <?xml version="1.0" encoding="UTF-8"?>
        <project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
          <modelVersion>4.0.0</modelVersion>
          <groupId>net.rocky</groupId>
          <artifactId>qsoft</artifactId>
          <packaging>war</packaging>
          <version>1</version>
          <name>qsoft Maven Webapp</name>
          <url>http://maven.apache.org</url>
          <dependencies>
            <dependency>
              <groupId>junit</groupId>
              <artifactId>junit</artifactId>
              <version>4.7</version>
              <scope>test</scope>
            </dependency>
            <dependency>
            	<groupId>javax.servlet</groupId>
            	<artifactId>servlet-api</artifactId>
            	<version>2.5</version>
            	<scope>provided</scope>
            </dependency>
            <dependency>
              <groupId>org.jboss</groupId>
              <artifactId>jbossall-client</artifactId>
              <version>5.1.0</version>
              <scope>system</scope>
              <systemPath>/home/rjaiswal/01rocky/02apps/jboss-5.1.0.GA/client/jbossall-client.jar</systemPath><!-- Needs to be changed as per user env -->
            </dependency>
          </dependencies>
          <build>
            <finalName>qsoft</finalName>
            <plugins>
                 <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <configuration>
                       <source>1.5</source>
                       <target>1.5</target>
                    </configuration>
                 </plugin>
              </plugins>
          </build>
        </project>

Create the necessary config in web.xml for the Servlet. Do a mvn clean install and deploy the war in JBoss and you are good to go.

Final screen -
<img src="http://rockysjavacafe.wordpress.com/files/2009/11/qbrowser2.png" alt="Browse Queues" height="100%" width="100%"/>

As can be seen, the MBean DomainName is same for all queues, the name-value though differs and is printed. This code can be further used to retrieve attributes for the individual queue or to execute operations on it. Hope this code helps you get started.

__Credits__ - JBoss team for providing the source to JMX Console, which helped us get started and <a href="http://www-scf.usc.edu/~meghaj/">Megha Jain </a> my colleague for working with me on this exercise.
