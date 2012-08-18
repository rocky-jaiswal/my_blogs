---
title: Hello jQuery!
tags: jQuery
date: 31/03/2011
---

JavaScript libraries/frameworks have gained a lot of popularity lately. A small though significant reason for the development / adoption of these libraries has been the large number of browsers, even writing a small piece of JavaScript which works on IE6, IE7, IE8, Firefox 2, 3+ and Chrome can be pain, on the other hand inclusion of a library that can work across browsers can ease the development immensely.

A simple Google search will give you many alternatives like prototype, dojo, yui, extjs and jQuery. Though each library is really good at something (like Scriptaculous for animation, extjs for rich UI), I found jQuery to be generally most useful and functionally very rich. In this blog I will discuss the basic usage of jQuery, its syntax and applications, hope you find it useful.


__jQuery Setup__

jQuery can be downloaded from -

<a href="http://code.jquery.com/jquery-1.4.1.min.js">http://code.jquery.com/jquery-1.4.1.min.js</a>

If you are working on an internet application, you will be better off downloading it from Google
<a href=" http://ajax.googleapis.com/ajax/libs/jquery/1.4.1/jquery.min.js">
http://ajax.googleapis.com/ajax/libs/jquery/1.4.1/jquery.min.js</a>

Inclusion of jQuery is adding a standard line in html -

        <script language="javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.1/jquery.min.js" />

That is all it takes to setup jQuery.

__Working with jQuery__

Almost all jQuery operations can be divided into two parts - Selection and Manipulation.

jQuery allows you to select an HTML element and carry out operations on it. An example of this would be -

        $("#an-id").addClass("error")

Here we have used jQuery to select an HTML element of id "an-id" and add a style class to it. The part before the dot (.) is equivalent to document.getElementById("an-id") but is much easier to write.

Most of the times you would be carrying out jQuery operations / functions on execution of an event, such as clicking a button etc. The question then arises, when do I register my event handlers. You may do something like &lt;input type="button" onClick=".."&gt; but this is generally not considered good practice, with jQuery who can register your handlers in this way -

        $(document).ready(function(){
        &nbsp;&nbsp;&nbsp;//Register Handlers
        &nbsp;&nbsp;&nbsp;$("#mainLink").click(function(event){
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;alert("Thanks for visiting!");
        &nbsp;&nbsp;});
        });

The inclusion of the above lines anywhere in your HTML code is good enough to register your handlers with jQuery. The advantage here is that the code is executed after the DOM has been loaded but before the images have been downloaded.$(...).

        <strong>Selecting elements with jQuery</strong>

        <table border="1">
        <tbody>
        <tr>
        <td>Selector</td>
        <td>Example</td>
        <td>Explanation</td>
        </tr>
        <tr>
        <td>#id</td>
        <td>$("#id")</td>
        <td>Selection through a DOM id</td>
        </tr>
        <tr>
        <td>element</td>
        <td>$("li")</td>
        <td>Returns all
        &lt;li&gt; elements&lt;/li&gt;
        </td>
        </tr>
        <tr>
        <td>.class</td>
        <td>$(".error")</td>
        <td>Returns all elements with &lt;.. class="error" ...</td>
        </tr>
        <tr>
        <td>element.class</td>
        <td>$("div.error")</td>
        <td>Returns all elements with &lt;div class="error" ...</td>
        </tr>
        <tr>
        <td>elem1 elem2</td>
        <td>$("div.a div.b")</td>
        <td>Returns all elements &lt;div class="b"&gt; which are inside</td>
        </tr>
        <tr>
        <td>elem[att=val]</td>
        <td>$("a[href=page1]")</td>
        <td>Returns all elements with &lt;a href="page1"&gt;</td>
        </tr>
        <tr>
        <td>elem[att^=val]</td>
        <td>$("a[href^=page]")</td>
        <td>Returns all anchor elements with attribute href's value starting with page (Regex)
        </tr>
        </tbody></table>

Though there are many other types of selectors I have covered the basics here and leave it upto you to explore as per your needs.

__Some operations with jQuery__

        <table border="1">
        <tbody>
        <tr>
        <td>$(...).html("&lt;b&gt;Hello&lt;/b&gt;")</td>
        <td>Sets the inner HTML to <strong>Hello</strong></td>
        </tr>
        <tr>
        <td>$(...).addClass("error")</td>
        <td>Sets the css style to error</td>
        </tr>
        <tr>
        <td>$(...).attr('name', 'value')</td>
        <td>Sets the element's attribute name to value</td>
        </tr>
        <tr>
        <td>$(...).clone()</td>
        <td>Clones / Copies the content of the DOM node</td>
        </tr>
        <tr>
        <td>$(...).click(clickHandler)</td>
        <td>Assigns a event handler to an event
        $(...).each(function() {
        $(this).addClass('')
        }); For each element returned by a selection, apply a function (in this example a style class is added)</td>
        </tr>
        </tbody></table>

__Ajax with jQuery__

jQuery really makes it easy to send AJAX requests and deal with the response. The simplest example would be -

        $.ajax({url: "address", success: funct1});

The handler function (funct1 above) gets the response text not the response object, the response can be XML, HTML, JSON or text. The function again can use jQuery to manipulate the DOM, for example display the response in a DIV.

__jQueryUI__

This blog would not be complete without a mention of jQueryUI - <a href="http://jqueryui.com/">http://jqueryui.com/</a> - jQueryUI builds upon jQuery to provide an effects and interaction API as well as ready to use widgets. Using jQueryUI, it is a breeze to add behaviours like draggable and resizeable to spans/divs. The widgets include a highly customizable date picker among others. Feel free to visit the jQueryUI site to see the demos.
