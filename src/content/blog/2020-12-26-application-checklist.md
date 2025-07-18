---
title: "New Application Checklist"
tags: DevOps
date: 26/12/2020
---

_Updated Q4 2021_

Usually when I start a new application there are a lot of things that I need to keep in mind, so I thought it would be a nice idea to make a checklist and keep it updated as I grow in experience. There are two parts to this checklist, one for an API backend and one for frontend. So without much further delay, here it is -

## API / Backend

- Code in Git
- Restful (HTTP + JSON with correct HTTP methods) or GraphQL based
  - Prefer GraphQL for frontend facing services
- Build + dependency management tool (e.g. npm, gradle)
- Library versions locked for dependable builds
- Testing
  - Unit
  - Mocking library (e.g. Mockk)
  - Integration (API request & db level)
  - Contract / Pact testing
  - CI testing with test DB setup etc.
  - Test DB should be cleaned after each (integration) test run
- Linting / style check for consistent code look & feel
  - Editorconfig setup
- Multi env. configuration / setup
  - Local, Staging, Production
- Secrets management
  - Also may vary depending on env.
  - No secrets in plain text & in git
- Request / Response handling
  - Requests - validated (using a declarative library), remove extra fields, convert to application object
  - Responses - typed, do not leak error stacktrace, use correct code e.g. 40x vs 50x
  - Intermediate service response - validated, trimmed, ignore extra fields, typed, middleware for case handling
  - Use types in tests / pacts
  - Handle duplicate requests (e.g. idempotency key)
  - Response data pagination
  - Case handling e.g. convert to snake_case over the wire
- DB
  - DB connection pooling
  - DB seeding / data loading
  - ORM / Query builder
  - DB migration strategy (e.g. Flyway or Knex.js)
- Logging (please log)
  - URL
  - Status
  - Latency
  - Headers
  - CorrelationID
  - UserID
  - Errors / stacktrace (as detailed as possible)
  - Blacklist sensitive data in logs (e.g. passwords)
  - Logs should be easily searchable
- CI / CD Setup
- Code quality analysis / measurement
- Dev setup
  - Easy JSON + XML parsing / generation
  - CORS in development
    - Also may vary depending on env.
  - Hot reload in development (automatic restart when code changes)
  - Dependency Injection (if applicable, for better testable code)
  - HTTP client setup (for service level integration) or maybe Prot. Buffer / gRPC
- Security
  - JWT Authentication (cert based)
  - Authenticated paths / Non-Authenticated paths (for easy setup)
  - Authorization
  - HTTPS setup (certbot)
  - Basic pen testing done
  - No SQL injection, XSS etc.
- Monitoring & Alerting
  - Infrastructure monitoring (e.g. disk space)
  - Service monitoring (e.g. slow response time)
  - API healthcheck endpoint (e.g. service / dependency down)
- API documentation (e.g. OpenAPI / Swagger)
  - GraphQL has in-built docs / playground
  - Look into automated generation
- Docker & Docker-Compose setup
- Horizontal scaling strategy (API should be stateless for example)
- Metrics (reporting & dashboard e.g. requests per second, response times & custom metrics)
- Strive for single deployement artifact e.g. docker image, JAR file, with only env. variable/s changing across environments

## Frontend

- UI Components (reusable / library)
- Routing
- State management
- Layout / Styling / Theming
- i18n
- Form validation
- Backend communication (REST / GraphQL)
  - Handle auth centrally
  - Handle errors centrally
- Route management (redirect etc.)
  - Protect auth routes
- Error / Warning display
- Typed / Schema based frontend to backend communication (optional)
- Configuration for multiple environments (e.g. staging vs production)
- Linting
- Editor setup (Prettier + Editor Config)
- Unit testing (Jest / RTL)
- Integration testing (Cypress)
- Building final artifact
- HTML headers
- Icon files for all platforms
- Accessibility
- Lighthouse score (90+ in all aspects)
- CI / CD
- Deployment (S3 + CDN + Protection)
- Error reporting (e.g. Sentry)
- Analytics setup (e.g. GA)
- PWA (perhaps)
