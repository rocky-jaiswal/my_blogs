---
title: "Testing HapiJS with Jest"
tags: HapiJS, JavaScript
date: 25/03/2017
---

[HapiJS](https://hapijs.com/) and [React](https://facebook.github.io/react/) are pretty much my go-to technology choices for web application development right now. While [Jest](https://facebook.github.io/jest/) works really well with React, on the HapiJS side I was content with [Lab](https://github.com/hapijs/lab) and friends. However, given the features and speed of Jest I really wanted to use it server side as well. Technically, for Jest to run on server all we need is the "browser" configuration to be off and we should be good to go.

![HapiJS and Jest](/images/hapi_jest.png)

Perhaps, the most tricky tests to write are for "controllers / handlers", since here we need some sort of mocked server and the ability to simulate HTTP calls. With HapiJS' rich API this was really easy, consider a simple HTTP request handler -

    'use strict';

    class Ping {

      show(request, response) {

        response({ pong: true });
      }

    }

    module.exports = new Ping();

Assuming the above code is a simple request handler in HapiJS, we can run tests for it by [injecting](https://hapijs.com/api#serverinjectoptions-callback) the request to a running server.

    'use strict';

    const Server = require('../../');

    describe('ping controller', () => {

      const options = {
        method: 'GET',
        url: '/'
      };

      beforeAll((done) => {
        Server.on('start', () => {
          done();
        });
      });

      afterAll((done) => {
        Server.on('stop', () => {
          done();
        });
        Server.stop();
      });

      test('responds with success for ping', (done) => {
        Server.inject(options, (response) => {

          expect(response.statusCode).toBe(200);
          expect(response.result).toBeInstanceOf(Object);
          done();
        });
      });

    });

There are two things to watch out here, we first need to wait for the server to start before we run the handler tests and we do that via the HapiJS events. We also then stop the server at the end and wait for the "stop" event before ending the test run.

Jest also has an inbuilt mocking setup (as the name implies) so we also do not need a mocking library like SinonJS. Using fewer libraries and require statements always sounds good to me. So let us look at a mocked _service_ class, which let's assume accesses the database, mocking it makes sense since we do not want to hit the DB for controller/handler tests.

Here is a simple test that showcases mocking capabilities of Jest.

    #controller
    'use strict';

    const MessagesService = require('./../services/messages_service');

    class MessagesController {

      index(request, response) {

        const userId = request.auth.credentials.id;
        response(MessagesService.getAllMessagesForUser(userId));
      }

    }

    module.exports = new MessagesController();

    #test
    'use strict';

    const Server          = require('../../');
    const Token           = require('../../lib/services/token');
    const MessagesService = require('../../lib/services/messages_service');

    describe('messages controller', () => {

      const userId  = 42;
      const options = {
        method: 'GET',
        url: '/messages',
        headers: { 'Authorization': Token.generate(userId) }
      };

      beforeAll((done) => {
        Server.on('start', () => {
          done();
        });
      });

      afterAll((done) => {
        Server.on('stop', () => {
          done();
        });
        Server.stop();
      });

      test('responds with success for ping', (done) => {

        const returnValue = [{ foo: 'bar' }];

        const mockMessages = jest.fn();
        mockMessages.mockReturnValue(returnValue);
        MessagesService.getAllMessagesForUser = mockMessages;

        Server.inject(options, (response) => {

          expect(response.statusCode).toBe(200);
          expect(response.result).toBe(returnValue);
          done();
        });
      });

    });

That's it, with mocking and the ability to simulate HTTP requests for testing I think we are all set to use Jest on server side as well. I will be right back after I re-write all my tests ...
