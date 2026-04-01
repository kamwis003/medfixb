# V-Campus Express API

This repository contains the backend API for the V-Campus application, built with Express.js, TypeScript, and Prisma. It's designed to be robust, scalable, and easy to maintain.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Available Scripts](#available-scripts)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)

---

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

- **Node.js**: `v18.x` or higher
- **pnpm**: A fast, disk space-efficient package manager. Install via `npm install -g pnpm`.

---

## Installation

Follow these steps to set up the project locally:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/v-campus-ai/vcampus-express.git
    cd V-campus-express
    ```

2.  **Install dependencies:**
    This project uses `pnpm` as the package manager.

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Copy the example environment file and fill in the required values.

    ```bash
    cp .env
    ```

    Now, open the `.env` file and update the variables to match your setup.

4.  **Run database migrations:**
    This command will sync your database schema with your Prisma models and generate the Prisma Client.
    ```bash
    pnpm prisma migrate dev --name init
    ```

---

## Running the Application

- **Development Mode:**
  Starts the server with `nodemon` for automatic reloading on file changes.

  ```bash
  pnpm dev
  ```

  The server will be available at `http://localhost:3000` (or the port specified in your `.env`).

- **Production Mode:**
  First, build the TypeScript code into JavaScript.
  ```bash
  pnpm build
  ```
  Then, run the compiled code.
  ```bash
  pnpm start
  ```

---

## Available Scripts

- `pnpm dev`: Starts the application in development mode with hot-reloading.
- `pnpm start`: Starts the application in production mode (requires a previous build).
- `pnpm build`: Compiles TypeScript to JavaScript, outputting to the `dist` folder.
- `pnpm prisma:migrate`: Applies pending database migrations.
- `pnpm prisma:generate`: Generates the Prisma Client based on your schema.
- `pnpm prisma:studio`: Opens the Prisma Studio GUI to view and edit your data.

---

## API Documentation

This project uses **Swagger** for automatic, interactive API documentation. Once the server is running, you can access the documentation at:

- **URL**: `http://localhost:3000/api-docs`

Here you can view all available endpoints, see their request/response schemas, and test them directly from your browser.

---

## Project Structure

The project follows a feature-based, layered architecture to ensure separation of concerns and maintainability.

```
src/
├── config/             # Environment validation (Zod), Swagger config, etc.
├── controllers/        # Handles incoming requests and sends responses.
├── data/               # Data access layer (Prisma client, repositories).
├── middlewares/        # Express middlewares (e.g., error handling).
├── routes/             # Defines API endpoints and connects them to controllers.
├── services/           # Contains the core business logic of the application.
└── utils/              # Shared utilities, custom error classes, etc.
```

---

## Environment Variables

All required environment variables are listed in the `.env.example` file. The application uses Zod to validate these variables at startup and will exit with an error if any required variables are missing or invalid. See `src/config/env.ts` for the full schema.
