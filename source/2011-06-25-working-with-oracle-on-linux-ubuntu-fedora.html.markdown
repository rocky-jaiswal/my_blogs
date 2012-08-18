---
title: Installing Oracle on Linux (Ubuntu / Fedora)
tags: Linux
date: 25/06/2011
---

Oracle DB is a weird animal. One might think that it being one of the most used databases in the world (read enterprise), it might be easy to install. But every time I try to install it I end up pulling my hair. So this blog is for my own help, future reference and for fellow humans who want their software installations to be simple.


START RANT -- The first thing that hits you in Oracle is the schema. What the hell is a schema? Coming from MySQL and Postgres one knows databases and users but Oracle adds another layer which is the "Schema". It took me a while to figure that a schema is a logical grouping of database objects inside a database. Oracle database conventions refer to defined groups of object ownership (generally associated with a "username") as schemas. This makes it possible to have several tables with the same name in the same database. So a table is in a schema which in turn is in a database. --END RANT

Anyways, coming back to the installation. If you like me are a open source / free software junkie and you want to download free, legitimate software from the internet, head to Oracle site and download the Oracle Xpress Edition server (please note that you do not want to download the client as it may or may not work depending on the temperature, room humidity etc.) Also if you are a windows guy most of the steps are the same but in case you have Virtualbox also on your system, prepare for all hell to break loose (you have been warned!).

Oracle XE download page - <a href="http://www.oracle.com/technetwork/database/express-edition/downloads/index.html" target="_blank">http://www.oracle.com/technetwork/database/express-edition/downloads/index.html</a>

Download the Universal Edition (it is safer), please choose the file as per your package manager.

Before you gleefully double click the .deb or .rpm file make sure you have atleast 1 GB of swap or the installation won't work. I would even go on to make sure that you have 2 GB of swap.

After you ensure that you have enough swap space, install the .deb or .rpm file.

After the installation, do a - __sudo /etc/init.d/oracle-xe configure__

This will ask you for a few options, you can stick with the defaults if you want. I recommend you change the web application (that provides a DB management interface) port to 8081 as 8080 is usually used by your local Tomcat server.

Now set a environment variable as - __export ORACLE_HOME="/usr/lib/oracle/xe/app/oracle/product/10.2.0/server"__

Now you have Oracle XE server running on your system, what more you get the Oracle client also for free.

Now for a nice SQL editor you might wanna use <a href="http://www.oracle.com/technetwork/developer-tools/sql-developer/overview/index.html">SQL developer</a>. It's from Oracle only and works reasonably well.

Finally, you can use JDBC setting for setting up connection with your database/s or you can edit the infamous tnsnames.ora files in - 
__/usr/lib/oracle/xe/app/oracle/product/10.2.0/server/network/admin/tnsnames.ora__

SQL Developer will automatically pick up entries in the tnsnames.ora file and will generally work faster with this setting rather than a plain jdbc connection.

Thats it! Go crazy with your new Oracle Server and Client.
