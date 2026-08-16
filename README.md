# Event & Traffic Monitoring System

An asynchronous, high-throughput **Event and Traffic Monitoring System** built with **Node.js**, **Express.js (v5)**, and **MongoDB (Mongoose)**. This application serves as a backend platform for capturing, queuing, logging, categorizing, and analyzing real-time application events, user interactions, traffic metrics, and system crash logs.

---

## 🚀 Tech Stack

- **Runtime Environment:** Node.js (CommonJS)
- **Web Framework:** Express.js (v5)
- **Database & ODM:** MongoDB via Mongoose (v9)
- **Authentication & Security:** JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcrypt`), String/Email Validation (`validator`)
- **Background Jobs & Queues (Planned):** BullMQ with Redis
- **Environment Management:** `dotenv`
- **Development Tooling:** Nodemon
- **Code Quality & Formatting:** ESLint & Prettier

---

## 📁 Project Architecture & Layout

```text
Event-And-Traffic-Monitoring-System/
├── .agents/
│   └── AGENTS.md             # AI Agent guidelines and repository rules
├── .eslintrc.json            # ESLint code quality configuration
├── .gitignore                # Git exclusion rules
├── .prettierrc               # Prettier formatting rules
├── index.js                  # Server bootstrap & API entry point
├── package.json              # NPM dependencies and scripts
└── src/                      # Application source code
    ├── config/
    │   └── db.js             # Async Mongoose database connection setup
    ├── controllers/
    │   ├── authController.js # User authentication route handlers
    │   └── eventController.js# Event creation, querying, pagination & filtering
    ├── jobs/                 # Queue job definitions (planned)
    ├── middlewares/          # Validation, auth & rate limiting middleware (planned)
    ├── models/
    │   ├── eventModel.js     # Mongoose schema for system and user events
    │   └── userModel.js      # Mongoose schema for user accounts & auth
    ├── routes/
    │   └── eventRoutes.js    # Express route declarations for events
    ├── utils/
    │   └── signToken.js      # JWT token signing helper
    └── workers/              # Background processing workers (planned)
```

---

## 📌 Features & Progress

- **Express Server Setup:** Modular Express v5 application bootstrap with JSON body parsing.
- **Database Integration:** Resilient, asynchronous Mongoose connection with error handling and process safety.
- **User Management & Security:**
  - `User` schema with field validations (email format checking via `validator`).
  - Pre-save Mongoose middleware for automatic password hashing using `bcrypt`.
  - JWT token generation utility (`signToken`) with configurable expiration.
- **System & Traffic Event Logging:**
  - `Event` schema supporting event classification, severity levels, summary flags, timestamps, and optional user attribution.
  - Creation of system events (`POST /api/v1/events`).
  - Event retrieval with **pagination** (`page`, `limit`) and **filtering** by `severity` and `eventType` (`GET /api/v1/events`).
- **Health Check Endpoint:** `GET /api/v1/health` for uptime and deployment monitoring.

---

## 📊 Data Models

### 1. Event Model (`src/models/eventModel.js`)

| Field          | Type       | Validation / Options                                                       | Description                                 |
| :------------- | :--------- | :------------------------------------------------------------------------- | :------------------------------------------ |
| `eventType`    | `String`   | **Required**, Enum: `['Login', 'SignUp', 'Server Crash', 'Traffic Spike']` | Type of system or user event                |
| `source`       | `String`   | **Required**                                                               | Source module or service emitting the event |
| `message`      | `String`   | **Required**                                                               | Detailed event message or description       |
| `severity`     | `String`   | **Required**, Enum: `['Critical', 'High', 'Medium', 'Low']`               | Severity level of the event                 |
| `isSummarized` | `Boolean`  | **Required**, Default: `false`                                             | Flag for background aggregation/summaries   |
| `submittedBy`  | `ObjectId` | Ref: `User` (Optional)                                                     | ID of the user associated with the event    |
| `createdAt`    | `Date`     | Auto-generated timestamp                                                   | Timestamp when event was recorded           |
| `updatedAt`    | `Date`     | Auto-generated timestamp                                                   | Timestamp when event was last updated       |

### 2. User Model (`src/models/userModel.js`)

| Field      | Type      | Validation / Options                  | Description                                |
| :--------- | :-------- | :------------------------------------ | :----------------------------------------- |
| `fullName` | `String`  | **Required**                          | Full name of the user                      |
| `email`    | `String`  | **Required**, Unique, Email Validator | User email address                         |
| `password` | `String`  | **Required**, Min length: 8           | Password (automatically hashed via bcrypt) |
| `isAdmin`  | `Boolean` | Default: `false`                      | Administrative privilege flag              |

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)

### 1. Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory and configure the environment variables:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/event_monitoring_db
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=90d
```

### 3. Running the Application

- **Development Mode (with auto-reload):**

  ```bash
  npm run dev
  ```

- **Production Mode:**

  ```bash
  npm start
  ```

---

## 📡 API Endpoints Reference

### Base URL: `/api/v1`

| Method | Endpoint   | Description                                    | Auth Required |
| :----- | :--------- | :--------------------------------------------- | :------------ |
| `GET`  | `/health`  | Health check / server status                   | No            |
| `POST` | `/events`  | Log / create a new event                       | No            |
| `GET`  | `/events`  | Retrieve paginated events with optional filter | No            |

---

### Endpoint Details

#### 1. Health Check
- **URL:** `GET /api/v1/health`
- **Response:** `200 OK`
  ```json
  {
    "status": "ok",
    "message": "Alive"
  }
  ```

#### 2. Create an Event
- **URL:** `POST /api/v1/events`
- **Headers:** `Content-Type: application/json`
- **Request Body Example:**
  ```json
  {
    "eventType": "Server Crash",
    "source": "PaymentService",
    "message": "Database connection timeout during checkout",
    "severity": "Critical"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "status": "success",
    "data": {
      "event": {
        "_id": "66bc901a5e12f4001a1b2c3d",
        "eventType": "Server Crash",
        "source": "PaymentService",
        "message": "Database connection timeout during checkout",
        "severity": "Critical",
        "isSummarized": false,
        "createdAt": "2026-08-16T09:00:00.000Z",
        "updatedAt": "2026-08-16T09:00:00.000Z"
      }
    }
  }
  ```

#### 3. Get All Events (with Pagination & Filtering)
- **URL:** `GET /api/v1/events`
- **Query Parameters:**
  - `page` (optional, default: `1`): Page number.
  - `limit` (optional, default: `10`): Number of events per page.
  - `severity` (optional): Filter by severity level (`Critical`, `High`, `Medium`, `Low`).
  - `eventType` (optional): Filter by event type (`Login`, `SignUp`, `Server Crash`, `Traffic Spike`).
- **Example Request:** `GET /api/v1/events?page=1&limit=5&severity=Critical`
- **Response:** `200 OK`
  ```json
  {
    "status": "success",
    "results": 1,
    "data": {
      "events": [
        {
          "_id": "66bc901a5e12f4001a1b2c3d",
          "eventType": "Server Crash",
          "source": "PaymentService",
          "message": "Database connection timeout during checkout",
          "severity": "Critical",
          "isSummarized": false,
          "createdAt": "2026-08-16T09:00:00.000Z",
          "updatedAt": "2026-08-16T09:00:00.000Z"
        }
      ]
    }
  }
  ```

---

## 🛠️ Code Quality & Utility Scripts

| Command                | Description                              |
| :--------------------- | :--------------------------------------- |
| `npm run dev`          | Start development server using `nodemon` |
| `npm start`            | Run production server                    |
| `npm run lint`         | Run ESLint checks                        |
| `npm run lint:fix`     | Automatically fix ESLint errors          |
| `npm run format`       | Format codebase using Prettier           |
| `npm run format:check` | Check code formatting compliance         |

---

## 📜 License

This project is licensed under the **ISC License**.
