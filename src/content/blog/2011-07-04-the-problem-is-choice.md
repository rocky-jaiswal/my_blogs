---
title: The problem is choice
date: 04/07/2011
tags: Programming
---

One of my favorite dialog exchange in movies is the one between Neo and the Architect towards the end of __Matrix Reloaded__. Who can forget - "<a href="http://www.leesmovieinfo.net/special/MatrixReloadedSpeech1.php" target="_blank">Your life is the sum of a remainder of an unbalanced equation inherent to the programming of the matrix.</a>." In this conversation Neo also remarks - "Choice, the problem is choice."


Last year I was giving a client interview and the client asked me if I would use Stored Procedures for queries or use an abstraction like Hibernate to interact with the database. My answer was Hibernate. We discussed the pros and cons of each option and while we knew that Stored Procs would be a lot faster in comparison to Hibernate queries, Hibernate still enables me to write clean and testable code. 

When we write software we are face choices every day, day in and day out. From a simple "What should I name this method" to a broader "Should I use X library or Y". In the beginning of a project the choices are even harder, should I use Java or Ruby or .Net or Scala for example. 

Personally, based of experience, I now follow a few guidelines when I face these choices -

__It is unit testable?__

This is one of the most important factors that I consider when choosing one technology over another. Over the years as a software developer I have learned one thing - __the cost of maintaining software is much much higher than developing it__. I am sure after two to three years, someone will be trying to understand the code that I write today and refactor/re-engineer it. Unit tests for my code today will make the future developers' task infinitely easier than what it would be if my code does not have unit tests. Remember the granularity of unit tests is also the degree of maintainability. Unit testing not only makes the code stable and predictable but also infinitely maintainable.

This is also one of my major gripes with Stored Procedure. Also if my application logic is lets say half in Java and half in Stored Procedures (and I have done this mistake myself) it would a pain to enhance / bug fix that software.

__Use as small a technology stack as possible__

If possible and if you are not dealing with huge traffic try to keep the technology stack as minimal as possible. Of course, some programming languages do somethings well, like Adobe Flex for rich UI intensive applications and Scala for high concurrency. So for a highly concurrent and rich web app I can mix and match Scala and Flex. But one should avoid adding more programming languages / software unless one really needs it for a single product. 

For example, you may know both Perl and Java and for a product you can create the data loading process in Perl and the web application in Java but imagine what it will take to maintain that project. It will either be just you working on that product till its EOL or your manager will have to hire two guys to maintain it. Maintenance of multi-technology projects is generally a nightmare, it additionally increases complexity while deployment.

__No specific software / platform dependency__

In the beginning of my career, I developed a mapping applications like Google Maps. At that time IE6 was the only browser used within the enterprise and the rest of the world. Our entire application worked on a Map which was rendered on IE6 and displayed in a proprietary ActiveX plug-in with a JavaScript API. I now believe that this application would either have been binned / re-written / or will be forcing the organization to stick to IE6. This is just after 5 years after the application's go-live date.

Any technology that we bind our software with will become obsolete in few years for sure. It is always better to write code even if it takes more time in a platform independent way. This is another factor against stored procedures or any database dependent code. What if MS SQL Server raises its license price for a new version and the organization you are working with decides to go with Sybase (for example)? All your Stored Procedures have to be re-written/re-tested on the new database which is a huge cost. Do yourself and your organization a favor and do not stick your code to a single platform.

__Zero compromises on design decisions__

There are the day-to-day design problems we face. Most of the times we get the choices - I can do X in 2 ways. A is easy to do but not maintainable, B is not so easy to do but will jack my development time by two sprints. I guess I will go with A and get it done with. Some brave developers though will choose B knowing that they may face the wrath of the Product Owner and it will take the whole project back to the design board but I can say it beyond an iota of doubt that one should always choose B.

Bad software isn't written in one day. It written when someday one small compromise is made in design to save time and the next day another minor compromise is made in a small cubicle. After two years of software use, the same management who gives you the go ahead to cut corners will say - "Who wrote this piece of s*** software!!" Don't fall into this trap. You will get only one chance to develop a piece of software on a clean slate, do it in the best possible manner without any compromise. Even one compromise will make the whole product unstable, no chain can be stronger than the weakest link.

__Clean code over anything else__

When coding follow OO principles (if you are using a OO language i.e.), name you methods and variables properly even if the name is very long, keep the cyclomatic complexity of a method to the minimum, follow TDD if you can. We all know this list, but we need to decide on a bare minimum and pin it to our desks or on our minds. Let this be a "No Compromise" list which improves as you gain experience. Your Product Owner may not know this, the user will never care for it as long as it works. But remember the old saying - "Write code as if you know that the guy who will maintain it is a psychopathic axe murderer who knows where you live." :)
