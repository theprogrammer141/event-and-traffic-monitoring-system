# Event & Traffic Monitoring System

An asynchronous, high-throughput **Event and Traffic Monitoring System** built with **Node.js**, **Express.js (v5)**, and **MongoDB (Mongoose)**. This application serves as a backend platform for capturing, logging, categorizing, and analyzing real-time application events, traffic metrics, and system crash logs.

---

## 🚀 Tech Stack

- **Runtime Environment:** Node.js (CommonJS)
- **Web Framework:** Express.js (v5)
- **Database & ODM:** MongoDB via Mongoose (v9)
- **Environment Management:** `dotenv`
- **Development Tooling:** Nodemon
- **Code Quality & Formatting:** ESLint & Prettier

---

## 📁 Project Architecture & Layout

```text
Event-And-Traffic-Monitoring-System/
├── .eslintrc.json            # ESLint code quality configuration
├── .gitignore                # Git exclusion specifications
├── .prettierrc               # Prettier formatting rules
├── index.js                  # Server bootstrap & API entry point
├── package.json              # NPM dependencies and scripts
└── src/                      # Application source code
    ├── config/
    │   └── db.js             # Async Mongoose database connection setup
    ├── controllers/          # Express route handlers (in progress)
    ├── jobs/                 # Queue job definitions (planned)
    ├── middlewares/          # Validation & authentication middleware (planned)
    ├── models/
    │   └── eventModel.js     # Mongoose schema for system and user events
    ├── routes/               # Express route declarations (planned)
    └── workers/              # Background processing workers (planned)
```

---

## 📌 Features (Current Progress)

- **Express Server Bootstrap:** Server initialization with JSON request parsing.
- **Database Integration:** Asynchronous Mongoose connection with error handling and process safety.
- **System Event Schema:** Mongoose data model (`Event`) configured for tracking system events with:
  - Event types (`Login`, `SignUp`, `Server Crash`, `Traffic Spike`)
  - Severity levels (`Critical`, `High`, `Medium`, `Low`)
  - Source tracking, messages, and optional user attribution.
- **Health Check Endpoint:** `GET /api/v1/health` for uptime and deployment monitoring.

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
PORT=3001
MONGO_URI=mongodb://localhost:27017/event_monitoring_db
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

## 📡 API Endpoints

### Health Check

- **URL:** `/api/v1/health`
- **Method:** `GET`
- **Response:** `200 OK`
  ```json
  {
    "status": "ok",
    "message": "Alive"
  }
  ```

---

## 📜 License

This project is licensed under the **ISC License**.
