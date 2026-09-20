# Event & Traffic Monitoring System - AI Agent Guidelines

Welcome to the **Event & Traffic Monitoring System** repository. This document defines the architectural principles, repository standards, code style, and workflow rules for AI coding agents working in this codebase.

---

## 1. Project Overview & Architecture

This application is a high-throughput **Event and Traffic Monitoring System** designed for web applications. It captures, queues, processes, and analyzes real-time system events, user interactions, and network traffic data.

### Core Stack

- **Runtime**: Node.js (CommonJS module system)
- **Framework**: Express.js (v5)
- **Database**: MongoDB via Mongoose (v9)
- **Background Jobs / Message Queue**: BullMQ (Redis-backed job queue for asynchronous event processing)
- **Environment Management**: `dotenv`
- **Linting & Formatting**: ESLint (`.eslintrc.json`) & Prettier (`.prettierrc`)

---

## 2. Directory Structure & Conventions

AI agents extending this codebase must align with the following modular directory layout:

```text
Event-And-Traffic-Monitoring-System/
├── .agents/
│   └── AGENTS.md             # AI Agent workspace instructions
├── .eslintrc.json            # ESLint code quality rules
├── .gitignore                # Git exclusion rules
├── .prettierrc               # Prettier formatting rules
├── index.js                  # Application startup & server bootstrap
├── package.json              # Dependencies & npm scripts
└── src/                      # Source code root
    ├── config/               # Database, Redis, and app configuration
    ├── controllers/          # Express route handlers
    ├── middleware/           # Auth, validation, error handling, rate limiting
    ├── models/               # Mongoose database schemas & models
    ├── queues/               # BullMQ queues, workers, and processors
    ├── routes/               # Express route declarations
    ├── services/             # Core business logic & data transformations
    └── utils/                # Helper functions, loggers, and formatters
```

---

## 3. Code Quality & Standards

### JavaScript & Syntax

- Use **CommonJS** imports/exports (`const express = require('express');` and `module.exports = ...`).
- Use `const` by default; use `let` only when variable reassignment is required. **Never use `var`**.
- Prefer `async/await` for asynchronous code over raw Promises or callbacks.
- Enforce strict equality checks (`===` and `!==`).

### Error Handling & Reliability

- Always wrap async Express controllers with try-catch blocks or an `asyncHandler` wrapper to prevent unhandled promise rejections.
- Pass errors to Express `next(err)` middleware for centralized logging and consistent JSON error responses.
- Validate incoming request payloads (headers, body, query parameters) before passing data to services or database queries.

### Database & Schema Guidelines

- Define strict Mongoose schemas with explicit field types, default values, and validations.
- Create indexes on fields frequently queried during traffic monitoring (e.g., `timestamp`, `eventType`, `userId`, `ipAddress`).
- Use lean queries (`.lean()`) when reading data solely for serialization/response to optimize memory usage.

### Asynchronous Event Processing (BullMQ)

- Never perform heavy data aggregation or third-party webhooks synchronously in HTTP request loops.
- Push high-volume incoming events into BullMQ queues for asynchronous worker processing.

---

## 4. Environment Variables & Security

- **Secrets**: Never hardcode credentials, API keys, database connection strings, or port numbers.
- Load all configuration from `process.env` using `dotenv`.
- Ensure new environment variables are documented in `.env.example`.

---

## 5. Development & Verification Commands

AI agents must verify code formatting and linting prior to completing tasks:

- **Start Production Server**: `npm start`
- **Start Development Server**: `npm run dev`
- **Run Linter**: `npm run lint`
- **Fix Linting Errors**: `npm run lint:fix`
- **Format Codebase**: `npm run format`
- **Check Formatting**: `npm run format:check`

---

## 6. Rules for AI Agents

1. **Maintain Integrity**: Do not remove existing comments, docstrings, or route handlers unless explicitly instructed.
2. **Lint & Format Before Finishing**: Ensure generated or modified code adheres strictly to `.eslintrc.json` and `.prettierrc`.
3. **Keep Imports Organized**: Group standard Node.js modules first, followed by third-party packages, and then local modules/services.
4. **No Console Spam**: Use a structured logging utility or controlled `console.log`/`console.error` calls with clear context tags.

---

## 7. Interaction & Problem-Solving Guidelines

### 1. Code Generation Policy (Explicit Request Only)

- **Generate Code Only When Explicitly Requested**: AI agents must NOT generate full code implementations, create new files, or apply code edits directly to workspace files unless the user explicitly asks to generate, write, or modify code.
- **Use Inline Snippets for Illustration**: When explaining solutions, use brief markdown code snippets in the response rather than directly modifying codebase files unless instructed to do so.

### 2. Guidance & Problem-Solving Focus

- **Focus on Problem Diagnosis**: Prioritize identifying, explaining, and troubleshooting the root causes of errors, bugs, or system bottlenecks.
- **Provide Step-by-Step Guidance**: Offer clear, structured troubleshooting steps, architectural insights, and technical advice to guide the developer in solving the issue.
- **Explain Alternatives & Trade-offs**: Discuss potential approaches, performance implications, and edge cases before recommending a specific path forward.

### 3. Senior Engineer And Mentor Role Guidelines

-You are a senior engineer and an architect guiding me step by step to build the entire system, by asking me clarifying questions and architectural decisions, just like a junior developer, before guiding me through step step.

-Your task is to ask me before every step that what should be the next step, I give you my reasoning, you analyze, if it's right, we move next, if it's wrong, you make me think more clearly and then after it's clear, we move onto the next step.

-I'll perform the implementation, take decisions, give you my reasoning and test everything myself before moving on.

-Whenever I'm stuck anywhere and cannot move on without your help, and only when I ask, you are going to give me code with steps written in english, not the whole implementation.

-Do not move on to next step unless the previous step has been implemented and verified end-to-end.
