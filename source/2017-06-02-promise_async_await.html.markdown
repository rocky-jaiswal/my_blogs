---
title: "Promises, Async and Await in Node.js"
tags: JavaScript
date: 02/06/2017
---

This week we had the much awaited [Node.js 8.0.0 release](https://nodejs.org/en/blog/release/v8.0.0/)! Node is getting faster and better all the time. This release also makes the __async / await__ feature available natively. But before we look at async / await let us quickly look at promises and specially the [bluebird](http://bluebirdjs.com/docs/api-reference.html) flavor of promises.

I like bluebird because it provides some really cool features on top of the promises API. Let us build upon an example where we make HTTP calls to fetch the weather information. We will use the [Dark Sky](https://darksky.net/dev/) API so we are "Powered by Dark Sky" :) (I need to say this for licensing reasons).

A simple promise based HTTP call with [axios](https://github.com/mzabriskie/axios) looks like -

    const Promise = require('bluebird')
    const axios   = require('axios');

    const myAPIKey       = 'foo';
    const berlinLatLong  = '52.520007,13.404954';
    const hamburgLatLong = '53.551085,9.993682';

    const params = {
      exclude: 'hourly,daily,flags',
      units: 'si'
    }

    const getWeatherForBerlin = () => {
      return axios.request({
        url: `https://api.darksky.net/forecast/${myAPIKey}/${berlinLatLong}`,
        params
      });
    }

    getWeatherForBerlin().then(console.log)

So using promises we get pretty simple and clean code with no callbacks. Let's say we have another similar function to fetch weather information for Hamburg as well. Now if we want to make both calls simultaneously and wait for them to complete, we can use __Promise.all__ and __spread__ for this -

    const getWeatherForBothCities = () => {
      return Promise.all([getWeatherForBerlin(), getWeatherForHamburg()]);
    }

    getWeatherForBothCities.spread((response1, response2) => console.log(response1, response2));

A lot of times we however want to make the HTTP calls one after the other to avoid rate limiting problems. So for that we can use __mapSeries__ -

    const printResponse = (response) => {
      console.log('-------------------------------------');
      console.log(response.data);
      console.log('-------------------------------------');
      return response;
    }

    const inSeries = () => {
      return Promise.mapSeries([getWeatherForBerlin, getWeatherForHamburg], (getWeather) => {
        return Promise.resolve(getWeather()).tap(printResponse);
      });
    }

Here we also used another cool feature of bluebird called __tap__. Tap is great for debugging, it takes a promise and returns it while we can inspect it in between.

Next, we want to add some delay between the calls because of (sigh..) rate limiting. Bluebird has another cool utility called __delay__. So we can write -

    // MapSeries with delay
    const inSeriesDelayed = () => {
      return Promise.mapSeries([getWeatherForBerlin, getWeatherForHamburg], (getWeather) => {
        return Promise.delay(3000).then(() => Promise.resolve(getWeather()).tap(printResponse));
      });
    }

While this is super cool, it is still a bit complex. So let's see how we can make it easier with async / await.

The simplest async / await call with no error handling would look like -

    async function getWeatherForBerlinAsync() {
      const response = await getWeatherForBerlin();
      console.log(response);
    }

Map in series simplifies to -

    async function getWeatherForBothCitiesAsync() {
      const response1 = await getWeatherForBerlin();
      console.log(response1);
      const response2 = await getWeatherForHamburg();
      console.log(response2);
    }

And finally, map in series with delay is as simple as -

    async function getWeatherForBothCitiesDelayedAsync() {
      await getWeatherForBerlin();
      await Promise.delay(3000);
      await getWeatherForHamburg();
    }

So we see combining promises and async / await with Node 8 we can write some pretty cool code. I am eagerly waiting for [Turbofan and Ignition](https://v8project.blogspot.de/2017/05/launching-ignition-and-turbofan.html) from V8 to land in Node.js and it will be even faster, so code on folks!
