--- 
title: "Integrating Rails and Node.js via Redis"
tags: Rails, JavaScript, CoffeeScript, Node.js, Require.js, Torquebox
date: 22/03/2013
---

It's been a while since I blogged, not really for the lack of content but rather the lack of time. I travelled to beautiful Berlin in Jan-Feb and was also doing the Coursera course [https://www.coursera.org/course/algo](https://www.coursera.org/course/algo) which pretty much ate up all my weekends. Well here is a pic of beautiful Berlin pretty close to where I worked.

![Berlin](/images/berlin.jpg "Berlin")

Berlin was awesome and I had a great time there but I moved back to India a couple of weeks back and also completed my Coursera course. Finally had some free time this week, so here goes.

I had been exploring Node.js earlier and found it blazingly fast but couldn't really use it as my main backend. However I wanted to use Node's websocket capabilites while using Rails for my main application so I started exploring how to integrate the two. Redis has a pretty good PubSub mechanism which is pretty fast and stable so I looked into Redis as the intermediatory between Node and Rails and built a real-time chat application. 

You may wonder, why build a chat application and why use Rails? Well not to start any arguments, __I__ think Rails is an excellent framework, it has a great ecosystem and helps build web applications at a great pace. JRuby also solves the Ruby slowness problem to a large extent. Node.js on the other hand is excellent for websocket communication so I chose both of them. I built a Chat application because it provides a mix of real-time and standard request-response communication. While the chat is real-time, user registration, room creation etc. works well on Rails.

Lets get started, the applications works as follows -

1. Users register and login with a Rails application.
2. Users can create chatrooms and invite other users for a chat. The user and chat room data is stored in MySql.
3. When in a chat room, user sends a message via an AJAX POST request.
4. The message is received by the server.
  - I wanted processing to be asynchronous from here on so I chose Torquebox. Torquebox provides HornetQ (a JMS implementation) and the message is posted on a Topic (if you remember Queues & Topic from messaging systems :) )
  - There are two consumers for this topic. Consumer one takes the message and inserts it into a MongoDB collection while consumer two posts the message on Redis PubSub channel.
  - The advantage of this setup is that these two tasks are done asynchronously and in parallel.
  - While MongoDB will give me the chat history when I need it, Redis notifies my Node.js application that a new message has arrived. 
5. Once message is posted on the Redis PubSub channel, it is picked up by the Node.js application (listening on the Redis channels) and based on the channel (each chatroom has its own PubSub channel) socket.io raises an event on the chatroom's websocket channel.
  - Two channels here, one for Redis PubSub and one for websocket communication.
  - Also we don't want users in chatroom 1 listening to messages on chatroom 2.
6. On the client side the message is received via the websocket push, parsed and displayed on the HTML DOM.

Pictorially this can be represented as -

![chatapp_arch](/images/chatapp_arch.jpg "chatapp_arch")

The application looks like -

![chatapp1](/images/chatapp1.png "chatapp1")

![chatapp2](/images/chatapp2.png "chatapp2")

Well what do we have in the end? We have a pretty basic Rails app that has Node's awesome real-time capabilities, is scalable (JRuby, Torquebox, HornetQ, Redis) and most importantly scratches my itch.

For client side I also used Backbone.js and Require.js to keep things clean. Finally the source code is here - [https://github.com/rocky-jaiswal/chatapp](https://github.com/rocky-jaiswal/chatapp). 

Please note this is not in perfect shape in any way. The user invitation is very basic (only for existing users) and most components (Redis, Torquebox, Node, MongoDB, HornetQ) need to be clustered to provide fault tolerance. But I hope this will provide a nice base for anyone who is looking to utilize the development speed of Rails and the real-time awesomeness of Node.js.