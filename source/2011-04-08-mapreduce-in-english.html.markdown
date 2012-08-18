---
title: MapReduce in English
tags: General
date: 08/04/2011
---

It took me a lot of time to understand MapReduce, I read the definition from Google, then I read the explanation in "CouchDB : The Definitive Guide" and finally I read the Wikipedia entry. I found the Wikipedia entry to be the most useful and simple to understand. So before I myself forget what I have understood, I want to blurt it out in this blog. 

To understand what is MapReduce one must first think (like with most technology) why one needs MapReduce. The answer is simply to distribute work. Now work can be distributed to a cluster of workstations or even the cores of a single CPU but the idea behind the MapReduce algo is to "Divide and Rule".

The quintessential example given to explain MapReduce is how you would count the number of occurrence of each word in a document (or a set of documents). I will use the same example but twist it just a little bit, so I say, if I give you a book and "N" number of assistants, how would you count the occurrences of each word in the book?

Most likely answer is, that you would tear the book and hand over some pages to each of your assistants asking them to count the word occurrences in their respective pages. 

In computing we will do this is two steps, first we will need a function (somethings which the assistants do) that takes in a document (be it 1 page or 10 pages or 1 paragraph in our example) and once a word is found it simply flags count to one. 

Next, me the master would then take all the words and their flags (just like a Map) and sort them on the keys i.e. the words themselves. So we have something like -

    a : 1
    a : 1
    a : 1
    a : 1
    Once : 1
    Once : 1
    the : 1
    the : 1
    the : 1
    ...

So on and so forth. 

The Map function is therefore designed in such a way that it is distributable and all the workers are doing the same thing. Now comes the Reduce function, again whatever it does has to be distributable and uniform. So in my example I would give each for my assistants a word (lets say "Once" in example above) or a set of words along with a list of its count ((1, 1) for "Once"). The Reduce function can then simply add the count for each word and give me back the result which is exactly what I need (the number of occurrences of each word).

If it is still confusing, let me revisit my example. I tear the book and give pages to each of my assistants who simply give me back a Map of each word they read with a count of 1. I then sort the words (simple if I am a computer) and then give the workers back a set of words with their associated occurrences (a list just saying (1, 1, 1, ..)). The workers then for each word sum the elements of the list and hand me back the result.

In essence, MapReduce enables us to break down very complex problems into smaller parts and helps us bring down the computation time dramatically. I my example above I have simplified things to a great extent to make it understandable but technically a lot more may be going on. For example, one of my assistants can become a sub-master and sub-divide the work to other assistants and sort the maps himself. 

MapReduce is very powerful and with the advent of multi-core processors and cheap hardware it just might be a non-negotiable skill in every developer's arsenal. Google used it to completely regenerate Google's index of the World Wide Web. Need I say more :).
