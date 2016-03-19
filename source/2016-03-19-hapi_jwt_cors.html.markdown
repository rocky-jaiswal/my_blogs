---
title: "hapi.js, JWT and CORS"
tags: JavaScript
date: 19/03/2016
---

In the [last post](http://rockyj.in/2016/03/14/auth_workflow_react.html) we setup a React based authentication workflow for a sample application. In this short post we will look at a [hapi.js](http://hapijs.com/) backend that can handle authentication using [JWT](http://jwt.io/) and since the React frontend runs on a different port (via Webpack) we will also setup CORS.

![HapiJS](/images/hapi.svg "HapiJS")

Setting up CORS and JWT with Hapi is actually quite easy. For CORS all we need to do is provide the right options to hapi's _server.connection_ and JWT setup is available as a Hapi [plugin](https://www.npmjs.com/package/hapi-auth-jwt2). Let's look at a working example -

server.js -

    'use strict';

    var Hapi   = require('hapi'),
        _      = require('lodash'),
        config = require('./server/config/app'),
        routes = require('./server/config/routes'),
        User   = require('./server/models/user');

    // Create a server with a host and port
    var server = new Hapi.Server();

    //Server config ***** CORS setup here *****
    server.connection(_.pick(config, ['host', 'port', 'routes']));

    //Logging setup
    var goodOptions = {
      reporters: [{
        reporter: require('good-console'),
        events: { log: '*', request: '*', response: '*' }
      }]
    };

    //Auth
    server.register([require('hapi-auth-jwt2'), { register: require('good'), options: goodOptions }], function(err) {
      if(err){
        console.log(err);
      }

      //***** JWT setup here *****
      server.auth.strategy(
        'jwt', 'jwt', { key: config.secretKey,
                        validateFunc: User.validate, //The validation function
                        verifyOptions: { algorithms: [ 'HS256' ] }
                      });

      server.auth.default('jwt');
    });

    // Add the route
    server.route(routes.config);

    // Start the server
    server.start(function() {
      console.log('Server running at:', server.info.uri);
    });

    module.exports = server;


app.js (where we have the CORS configuration enabled for development) -

    var config = {
      development: {
        host: 'localhost',
        port: 3000,
        routes: {cors: true},
        secretKey: 'so74565467rs3cr3t132189328213213n123123dasd12341239i0dsf'
      },
      test: {
        host: 'localhost',
        port: 3001,
        secretKey: 'foobar'
      }
    }

    var env = process.env['NODE_ENV'] || 'development';
    module.exports = config[env];
    

An example routes.js -

    var GreetingController = require('../controllers/greeting_controller'),
        UsersController    = require('../controllers/users_controller'),
        SessionsController = require('../controllers/sessions_controller');


    var routes = {
      config: [
        {method: 'GET',     path: '/api/greeting', config: {handler: GreetingController.show}},
        {method: 'POST',    path: '/api/users',    config: {auth: false, handler: UsersController.create}},
        {method: 'GET',     path: '/api/session',  config: {handler: SessionsController.show}},
        {method: 'POST',    path: '/api/session',  config: {auth: false, handler: SessionsController.create}},
        {method: 'DELETE',  path: '/api/session',  config: {handler: SessionsController.delete}}
      ]
    };

    module.exports = routes;

The User.validation function used in the JWT setup could look something like -

    validate: function (decoded, request, callback) {
      const promise = new User({id: decoded.id}).fetch();
      promise.then(function(data) {
        if(data === null){
          return callback(null, false);
        } else {
          return callback(null, true);
        }
      });
      promise.catch(function(e) {
        return callback(null, false);
      });
    }

The [Github project](https://github.com/rocky-jaiswal/lehrer-node) has the complete source code.
