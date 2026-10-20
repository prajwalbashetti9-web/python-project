# Bookstore REST API & Web App

A modern full-stack application built with Next.js, Drizzle ORM, PostgreSQL, and Tailwind CSS.

## Features

- **RESTful API**: Fast and scalable endpoints
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT & bcryptjs
- **Modern UI**: Next.js App Router, Tailwind CSS, and Framer Motion

## Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your database credentials:
```bash
cp .env.example .env
```

### 4. Database Setup
Push schema changes to your database:
```bash
npm run db:push
```

Seed the database:
```bash
npm run seed
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.
