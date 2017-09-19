---
title: "No callbacks file oprations"
tags: JavaScript
date: 19/09/2017
---

Reading and writing files in JS tends to get messy. But not anymore, with Node 8, async / await support combined with [Util.promisify](https://nodejs.org/dist/latest-v8.x/docs/api/util.html#util_util_promisify_original) we can read and write to a file without a single callback or __"then"__. Enough talk, actual code ---

    // file_fun.js

    use strict';

    const FS   = require('fs');
    const Util = require('util');

    const updateFile = async (filename = 'fun.xml') => {
      const readFile = Util.promisify(FS.readFile); // promisify readFile so it works with await
      const fileContents = await readFile(`${__dirname}/xml/${filename}`);
      console.log('Current file contents - ', fileContents.toString());

      const writeFile = Util.promisify(FS.writeFile); // promisify writeFile so it works with await
      await writeFile(`${__dirname}/xml/${filename}`, fileContents.toString().replace(/foo/, 'bar'));
      console.log('File updated!');
    };

    updateFile();

Now we can just run this simply by -

    $ node file_fun.js

That's it, we read and wrote to a file in JS without any ugly callbacks, "thens" or libraries.
