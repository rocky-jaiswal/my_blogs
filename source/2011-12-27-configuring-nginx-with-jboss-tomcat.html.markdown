---
title: Configuring nginx with JBoss / Tomcat
tags: Jboss, Tomcat
date: 27/12/2011
---

So you have brought a new EC2 machine. You are a Java / JRuby / Scala developer and you are all excited to put your site out to the world. Problem is your server JBoss / Tomcat runs on port 8080 and that port is blocked by the in-built firewall. You can open the port but you also don't want your users to type ":8080" after your site name as it doesn't look very professional.

So worry not my friend, coz you can setup your site to be served on Port 80 in a few minutes. I hope you know about nginx, it is a great web server and some claim that it is faster than apache. So do a -

        sudo apt-get install nginx

Hit the server's IP now and you should see nginx's default page.

Now start your Tomcat / JBoss server as usual.

Edit the nginx config file and add the following **under http {}** - 

        sudo vi /etc/nginx/nginx.conf

        server {
            listen A.B.C.D:80;
            server_name A.B.C.D;
            location / {
                root /some/public/folder;
                proxy_set_header X-Forwarded-Host $host;
                proxy_set_header X-Forwarded-Server $host;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_pass http://localhost:8080;
            }
        }

Replace **A.B.C.D** with your public IP (elastic IP for EC2) or if you have brought a domain name then you can specify it as well.

Now, restart nginx with **sudo /etc/init.d/nginx restart** and voila your JVM application will now be served from port 80.

The advantage of this setup is that you can further configure nginx to serve your static assets like images (nginx is pretty good with that) and leave JVM application to be served from Tomcat / JBoss, just as it is meant to be.
