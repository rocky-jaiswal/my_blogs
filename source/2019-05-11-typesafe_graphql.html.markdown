---
title: "Type safe GraphQL on Node.js"
tags: HapiJS, JavaScript, TypeScript, GraphQL
date: 11/05/2019
---

With everything moving to TypeScript and even [Python](https://google.github.io/pytype/) + [Ruby](https://twitter.com/darkdimius/status/1119115657776209920) looking at adding some sort of types one could assume that strong typing is winning the battle against dynamic typing. Clear and strong types also makes you think twice about using JSON as a data transfer mechanism which is sort of schema / type less. Now I am also not advocating to go back to XML+XSD days but I think the GraphQL specification provides decent type safety without any verbosity at all.

In fact GraphQL is pitched as - __A query language for your API, and a server-side runtime for executing queries by using a _type system_ you define for your data.__ So a type system forms the very core of GraphQL. On the flip side, the most popular implementation/s of GraphQL are on Node.js which inherently is not type friendly. In this post we will look at how to use TypeScript on both server and client side to work with GraphQL implementations for better type safety and hopefully fewer bugs.

Essentially what we do not want is to define our GraphQL schema in a giant string like -

    // schema.js
    const typeDefs = gql`
      type Book {
        title: String
        author: String
      }

      type Query {
        books: [Book]
      }
    `;

Instead we want to use the type capabilities already available in TypeScript. Plus we also want to use [hapi](https://hapijs.com/) as our main server framework. I am going to keep it simple and just say that typed GraphQL is available on TypeScript through the aptly named [type-graphql](https://typegraphql.ml/) package. With TypeScript setup our hapi "server.ts" combined with [apollo-graphql](https://www.apollographql.com/docs/apollo-server/) looks like -

    const init = async () => {

      const server = new Hapi.Server({
        port: 8080,
        host: 'localhost',
        routes: { cors: { origin: ['http://localhost:3000'] } }
      });

      // JWT plugin setup
      await server.register(require('hapi-auth-jwt2'));
      server.auth.strategy('jwt', 'jwt', {
        key: SECRET,
        validate: validateToken,
        verifyOptions: { algorithms: ['HS256'] }
      });
      server.auth.default('jwt');

      // GraphQL setup
      const schema = await bootstrapSchema();
      const apolloServer = new ApolloServer({
        schema,
        playground: true
      });
      await apolloServer.applyMiddleware({
        app: server
      });

      // Standard routes
      server.route(routes);

      await server.start();
      console.log(`Server running on ${server.info.uri}`);
    };

    process.on('unhandledRejection', (err) => {
      console.log(err);
      process.exit(1);
    });

    init();

A simple GraphQL schema setup looks like -

    import { Arg, Query, Resolver, buildSchema } from 'type-graphql';
    import Greeting from '../models/greeting';

    @Resolver()
    class GreetingResolver {
      @Query(returns => Greeting, { nullable: true })
      greet (@Arg('to', { nullable: false }) to: string): Greeting {
        return new Greeting(`Hello, ${to}!`);
      }
    }

    export default async function bootstrapSchema () {
      return buildSchema({
        resolvers: [GreetingResolver],
        emitSchemaFile: true
      });
    }

type-graphql enables us to use standard TypeScript types to define our schema. The only catch is that we need to add a bit of "decorator magic". Decorators are really not stable on Node.js in the sense that it is an experimental feature that may change in future releases. So this something we need to keep in mind as EcmaScript standards evolve.

On the client side, we can do something like -

    class QueryBuilder {

      static greet = (to: string) => `{
        greet(to: "${to}") {
          response
        }
      }`

    }

    async executeGQLQuery<T>(queryName: string, queryBuilder: Function): Promise<T> {
      const token = await getToken();
      const response = await axios
        .post(
          `${config.env.baseURL}/graphql`,
          { query: queryBuilder() },
          { headers: { Authorization: `Bearer ${token}` } }
        );

      return response.data.data[queryName];
    }

    // ...
    // call the API endpoint from a redux-saga
    const result = yield call(API.executeGQLQuery, 'greet', () => QueryBuilder.greet('World'));

And this would get things working nicely. While GraphQL is already self-documenting, the advantage of this setup is that we have added type safety on top. It would be awesome if we had a library that could read a GraphQL schema and automatically generate the client side code in TypeScript.

The full working version of this setup is available on [github](https://github.com/rocky-jaiswal/hapi-graphql-api).
