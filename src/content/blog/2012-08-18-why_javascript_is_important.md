--- 
title: "Why JavaScript is important"
tags: JavaScript
date: 18/08/2012
---

In a couple of months I will be completing a decade professionally in the IT / ICT field. Its been a great journey and I have much to learn. I am happy that I have been able to stick to technology and my love for programming increases each day. I have also seen a lot of technologies come and go in these years, some have been surprisingly pleasantly and some have left a bad taste in the mouth.

Java was the first language that I really understood and appreciated. It's statically typed, complied to a bytecode and offers great performance second only to C. With Java I felt that there were hundreds of ways to tweak things, you could start threads from a thread pool, synchronize them with locks when are where you wished. But with this great power also came great repossibilty, one had to spend time to understand concurrency, thread safety and most of the times these important aspects were ignored. Java still is a great language and the JVM is still the place to go when you are looking for stability and performance.

Then I learned Rails, this was the complete opposite of Java. Built on a dynamic, meta-programming-happy language - Ruby, it offered one and only one way to build app. This was a good thing and bad. Good because the design decisions Rails took were (and still are) great. RESTful MVC architecture with a great ORM, there is nothing better really. Rails is THE framework to go if you want to build modern websites quickly and efficiently. Of course, Ruby isn't the fastest langauge on the planet, but it is improving and JRuby will kick ass in near future.

Then came node.js and changed the way we develop websites. node.js is fast and by fast I mean blazing fast. node.js doesn't have threads and uses JavaScript fully to create a event-driven and asynchronous architecture. I have heard stories of two clustered node.js servers handling traffic of large dot coms. There are a lot of articles on the web which can help you with node.js but I want to emphasise on the point why every developer worth his / her salt needs to learn JavaScript.

__The rise of mobile - __
Every site now built needs a mobile version. As a result a lot of web applications will use Responsive Design and push logic on the client side. The server, I believe, will become a mere provider of data. I think this approach is also a decent design paradigm. The complex calculations can be done on server of course and the client only needs the processed JSON from server for a dynamic display. As the code on the client side increases one needs a framework to manage it or live with sphagetti JavaScript code, which is a maintenance hell. 

To organize code on the client side we need frameworks like Backbone.js, Ember.js and Angular.js. These framework require solid knowledge of JavaScript so irrespective of the server side technology JavaScript knowledge is a must.

__Push is the future - __
Modern sites are using Push more and more. Which means the user does not have to refresh the page to fetch new data, the server can "push" the data to the client. This requires use of HTML5's websockets. Node.js and socket.io are the best suited technologies for this (both of course are written in JavaScript). A single node.js instance due to its event driven and ansynchronous nature can push data to multiple client easily. This would not scale on a comparitively slower frameworks like Rails. Clojure, Scala and Vert.ex make push possible but none of them have been proven themseles so far like node.js.

__JavaScript is everywhere - __
There is only one technology to work with when working on the browser i.e. JavaScript. We all know MVC is great, wouldn't it be awesome if as soon as I change my model on server the client is updated (without the user hitting refresh), this requires two things - push of data from server and manipulation of UI on browser. Well, JavaScript is THE ONLY language that can do this things. Meteor.js is already making this possible and there are other frameworks in line (all on JavaScript).

Well that is why I am not wasting any time improving my JavaScript.