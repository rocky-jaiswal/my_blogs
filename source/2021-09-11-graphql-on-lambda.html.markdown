---
title: 'Free serverless applications (with persistence) the easy way'
tags: AWS, DevOps, GraphQL
date: 11/09/2021
---

For as long as I can remember I have been trying to look at cheap or free alternatives to host simple web applications backed by a database (or some form of persistence) which I build in my free time. 

Back in the day, Heroku came close to meeting that promise but the free instance setup is quite poor in performance. So when I did my AWS certification I started looking more deeply into ways of utlizing serverless architecture/s for hosting weekend projects since AWS has a liberal free tier in this regard.

The answer now is simple - use a __CDN__ (like CloudFront) __+ AWS Lambda + DynamoDB__ to host the frontend, API and datastore respectively. Since AWS has a liberal free tier and I do not expect any of my weekend applications to shake the world I think I can get by with paying (almost) nothing and yet building and hosting as many applications as I want. For a few hundred visitors for all my (unknown) applications I can get away by paying almost nothing (maybe a few cents).

Since I even do not want to pay for a domain, I made one small change to this combination - use Firebase (instead of S3 + Cloudfront) for hosting the frontend since it provides a nice free URL as well. Examples -

- [https://wortschatz-rockyj.web.app/](https://wortschatz-rockyj.web.app/)
- [https://bible-spiel.web.app/](https://bible-spiel.web.app/)

and even this blog are hosted this way. So in the end I have a responsive PWA backed by APIs and a datastore all hosted for free and there is nothing stopping me from churning apps (which no one uses) in my free time. So my weekend project stack now is -

- __Firebase__ for hosting the React.js frontend
- __AWS Lambda__ for a GraphQL API (Node.js or JVM based) fronted by __AWS API Gateway__ (for exposing Lambdas via HTTPS)
- __DynamoDB__ for persistence (close to zero cost for small amounts of reads / writes)

The only challenge with this setup is that it is DevOps heavy. All this requires scripts to maintain & deploy, but thanks to the __Python + AWS CDK__ combo I can now get away with writing very little code and yet automating most of the DevOpsy part.

A fully working code / application is available [here](https://github.com/rocky-jaiswal/bible-quiz-serverless).

So let us break down some things that we need for this setup. From here on this post can also be titled as - "Running a DynamoDB backed GraphQL Service on AWS Lambda".

## Writing the main GraphQL API

As evident from code [here](https://github.com/rocky-jaiswal/bible-quiz-serverless/tree/main/deployment) I have a AWS Lambda function which is exposed via AWS API Gateway as a GraphQL API. I am not going into details of how this works since it is quite simple - The HTTP requests ends up at the Lambda via the API Gateway. The API Gateway has some CORS configuration which you can see in the CDK code [here](https://github.com/rocky-jaiswal/bible-quiz-serverless/blob/main/deployment/gql_api/app_stack.py).

The Apollo GraphQL library has a variation which allows it to run on AWS Lambda [as shown here](https://www.apollographql.com/docs/apollo-server/deployment/lambda/)

The only difficult part of this was that I needed a main __async__ handler for the Lambda. The code for this is -

    import 'reflect-metadata'
    import { ApolloServer } from 'apollo-server-lambda'

    import bootstrapSchema from './schema'

    export const handler = async (event: unknown, context: any, callback: any) => {
      const schema = await bootstrapSchema()

      const server = new ApolloServer({
        schema
      })

      const apolloHandler = server.createHandler()

      return await apolloHandler(event, context, callback)
    }

The reason for this hackery is that my main Lambda entry point is __async__ and there is no easier way to make it work with the default Apollo handler. I used [type-graphql](https://typegraphql.com/) which forced my hand here.


## DynamoDB for persistence

DynamoDB is also setup with AWS CDK [as programmed here](https://github.com/rocky-jaiswal/bible-quiz-serverless/blob/main/deployment/gql_api/app_stack.py#L46). Only the Lambdas have access to it so it is secure.

For writing the application code to persistence layer I used [@aws/dynamodb-data-mapper](https://github.com/awslabs/dynamodb-data-mapper-js) to write some "decorator" (or annotation) based magic to get a nice persistence API. The downside is that the code looks a bit Java-ish but it does the job.


## Deploying with CDK

To build the Lambdas, I use to some shell scripting to create a minimal zip file and then use AWS CDK to synth + deploy the latest code. All of this can be done for the command line (or from a CI/CD setup on a CircleCI free tier). 

The Lambdas are be built by a simple command like - 

    yarn build:lambda

then using AWS CDK we "synth" and deploy them

    env AWS_ACCOUNT_ID=1234 AWS_REGION=eu-central-1 npx cdk synth
    env AWS_ACCOUNT_ID=1234 AWS_REGION=eu-central-1 npx cdk deploy

## Conclusion

There you have it, a fully modern and (if needed) super scalable setup for a modern stack of React.js frontend + GraphQL API + DynamoDB based persistence all available in one repository with fully automated deployment.

## Downsides

The main downside to this setup is that there is not much you can run locally, I have some code (which I did not commit) which allows me to run the API in a local Node.js backed HTTP server and DynamoDB can be mocked via a Docker container [https://hub.docker.com/r/amazon/dynamodb-local](https://hub.docker.com/r/amazon/dynamodb-local) but the real test can only happen when I deploy all my code to the actual AWS environment. But for the (personal) money I save with this setup, this is not a big problem at all.