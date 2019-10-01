---
title: 'Worker threads in Node'
tags: Node.js
date: 30/09/2019
---

[Recently](https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V12.md#12.11.0) Node.js released v12.11.0 which has stablized support for "worker threads". As a programmer interested in concurrency and performance, I was intrigued and had a few questions that I wanted to look into -

- Will Node threads work all my multiple CPU cores?
- How can the threads communicate with each other?
- What kinds of tasks are the worker threads suited to do?

To answer these questions and more, I looked into applying worker threads to solve some random problem. So I looked online and [found some public datasets](https://github.com/awesomedata/awesome-public-datasets#sports) to experiment with. Using worker threads we can now write a program to crunch this data and see how that goes. Coming from India, I downloaded the [cricsheet](https://cricsheet.org/) dataset since I can easily imagine some analysis on this.

The IPL (Indian Premier League) data is split into multiple YAML files. Each file has ball-by-ball record of what happened in the match. So we have a classic "map-reduce" problem on our hands. With the threads we can parse each file individually, run some numbers and aggregate this data. So what we will do is calcaulate the maximum runs any team as hit in the powerplay (first 36 legal balls in an innings).

I uploaded the data to AWS S3 (just for fun) and so that I can run the program anywhere, the idea is simple -

1. Download the files (around 750)
2. Each worker gets a file, parses it and reports back the runs hit in the powerplay for that match
3. The main thread then selects the match with the maximum runs hit

The TypeScript code for this looks like -

    import AWS from 'aws-sdk';
    import { Worker } from 'worker_threads';

    import { aggregateResult } from './aggregateResult';

    AWS.config.update({
      region: 'eu-central-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    const s3 = new AWS.S3();
    const Bucket = 'de.rockyj.ipl-data';
    const results: Array<any> = [];

    new Promise((resolve, reject) => {
      // Get all S3 objects
      s3.listObjects({ Bucket }, (err, data) => {
        if (err) {
          console.error('Error', err);
          reject();
        }

        let count = 0;
        const numberToProcess = data.Contents!.length;

        // define the worker and it's job
        const work = (rawData: string) => {
          const worker = new Worker('./dist/worker.js', { workerData: rawData });
          worker.once('message', message => {
            count += 1;
            results.push(message);
            if (count === numberToProcess) {
              resolve(results);
            }
          });
        };

        // download objects and hand them over to the workers
        data.Contents!.forEach(content => {
          const Key = content!.Key!;
          s3.getObject({ Bucket, Key }, (err, yamlData) => {
            if (err) {
              console.error('Error', err);
              reject();
            } else {
              work(yamlData.Body!.toString());
            }
          });
        });
      });
    }).then((results: any) => {
      // Aggregate data for results
      const { finalResult, mostRunsMatch } = aggregateResult(results);
      console.log(finalResult);
      console.log(mostRunsMatch);
    });

    // The result is -
    // { dates: [ 2017-05-07T00:00:00.000Z ],
      // runs:
      // { firstInnings: { team: 'Royal Challengers Bangalore', runs: 40 },
      //  secondInnings: { team: 'Kolkata Knight Riders', runs: 105 } } }

So the Kolkata Knight Riders hit an impressive 105 runs in 2017 IPL. The full code for parsing the YAML etc. can be found on [Github](https://github.com/rocky-jaiswal/ipl-fun).

To get straight to the answers -

- The performance was quite impressive, downloading, parsing all the files and calculating the result took around 30 secs on my i7 CPU (I did around 10 runs to be sure)
- Node worker threads were able to use all my CPU cores, so there is no Ruby / Python like global lock (GIL)
- The threads can communicate with the parent / other threads through message channels & message ports [https://nodejs.org/api/worker_threads.html#worker_threads_class_messagechannel](https://nodejs.org/api/worker_threads.html#worker_threads_class_messagechannel)
- The documentation clearly mentions - `Workers (threads) are useful for performing CPU-intensive JavaScript operations. They will not help much with I/O-intensive work. Node.js’s built-in asynchronous I/O operations are more efficient than Workers can be.` So our experiment actually did the right thing. I imagine that doing heavy IO operations in the worker threads will not go down well.

Actual proof of CPU usage -

<img src="/images/node_worker_threads.png" />

Maybe in the next round I will see how the JVM performs on the same experiment.
