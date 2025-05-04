# Todo API - Secure Task Management REST API

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="NestJS Logo">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
</p>

A secure, high-performance Todo API built with NestJS, featuring robust authentication, task management, and advanced security features.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Security Measures](#security-measures)
- [Installation](#installation)
- [Development with Docker](#development-with-docker)
- [Using the Makefile](#using-the-makefile)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)

## Features

### User Management
- Registration and authentication
- Profile management with customizable user preferences
- Password reset with secure token system

### Authentication
- JWT-based authentication with refresh tokens
- Token blacklisting for logout and account deletion
- Secure password hashing with bcrypt

### Todo Management
- Create, read, update, and delete todos
- Advanced filtering (by completion status, priority, tags)
- Flexible sorting and pagination
- Performance optimized with Redis caching
- Todo statistics and metrics

## Architecture

The application follows a modular architecture using NestJS's module system:

```
src/
├── modules/
│   ├── auth/         # Authentication logic
│   ├── users/        # User management
│   └── todos/        # Todo CRUD operations
├── prisma/           # Database schema and migrations
├── common/           # Shared utilities and middleware
└── main.ts           # Application entry point
```

### Technology Stack

- **Backend Framework**: NestJS with TypeScript
- **ORM**: Prisma for type-safe database access
- **Database**: PostgreSQL for persistent storage
- **Caching**: Redis for performance optimization
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Jest for unit and E2E testing
- **Containerization**: Docker and Docker Compose

## Security Measures

This API implements robust security measures to protect against common web vulnerabilities:

### 1. Authentication & Authorization
- **JWT Token Implementation**: Short-lived access tokens with refresh token rotation
- **Token Blacklisting**: Prevents token reuse after logout or account deletion
- **Password Security**: Bcrypt hashing with adaptive cost factor

### 2. Protection Against Common Attacks

| Attack Vector | Protection Mechanism |
|---------------|----------------------|
| **SQL Injection** | Prisma ORM with parameterized queries |
| **XSS (Cross-Site Scripting)** | Input validation, output encoding, Content-Security-Policy |
| **CSRF (Cross-Site Request Forgery)** | Stateless architecture, properly implemented CORS |
| **Brute Force Attacks** | Rate limiting on authentication endpoints |
| **MITM (Man-in-the-Middle)** | HTTPS enforcement with secure cookies |
| **Data Exposure** | Data minimization, proper authorization checks |
| **Denial of Service** | Rate limiting, resource constraints for requests |
| **Broken Authentication** | Strong password policies, secure token management |

### 3. Data Validation & Sanitization
- Comprehensive input validation using class-validator
- Data sanitization to prevent injection attacks

### 4. API Security
- Rate limiting to prevent abuse
- Request validation middleware
- Proper error handling that doesn't leak sensitive information

## Installation

### Prerequisites
- Node.js (v16+)
- PostgreSQL
- Redis
- Docker and Docker Compose (optional but recommended)

### Manual Setup
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run prisma:migrate:dev

# Start the development server
npm run start:dev
```

## Development with Docker

The project includes Docker configuration for easy development and deployment:

```bash
# Start all services using docker-compose
docker-compose up

# Alternatively, use the Makefile (see below)
```

### Dockerfile

The included Dockerfile:
- Uses Node.js 22 Alpine as base image
- Sets up the application with all dependencies
- Configures Prisma
- Exposes port 3000
- Runs migrations and starts the development server

## Using the Makefile

The project includes a Makefile with various commands to simplify development:

```bash
# Start all services (build if needed)
make

# Build all containers
make build

# Start existing containers
make start

# Stop running containers
make stop

# Remove containers
make down

# View logs
make postgres-logs
make redis-logs
make api-logs

# Clean up (remove containers)
make clean

# Full clean (remove containers, images, volumes)
make fclean

# Rebuild and restart everything
make re
```

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate and receive tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout and invalidate tokens |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get current user profile |
| PATCH | `/api/users/profile` | Update profile information |
| PATCH | `/api/users/preferences` | Update user preferences |
| DELETE | `/api/users/profile` | Delete user account |

### Todo Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | List todos with filtering and pagination |
| POST | `/api/todos` | Create a new todo |
| GET | `/api/todos/:id` | Get a specific todo by ID |
| PATCH | `/api/todos/:id` | Update a todo |
| DELETE | `/api/todos/:id` | Delete a todo |
| GET | `/api/todos/statistics` | Get todo statistics |

### Request Examples

#### Creating a Todo

```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project",
    "description": "Finish the NestJS todo API project",
    "priority": "HIGH",
    "tags": ["work", "coding"],
    "dueDate": "2023-12-31T23:59:59Z"
  }'
```

#### Filtering Todos

```bash
# Get high priority todos
curl -X GET "http://localhost:3000/api/todos?priority=HIGH&sortBy=dueDate&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search todos
curl -X GET "http://localhost:3000/api/todos?search=project&tag=work" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing

The application includes comprehensive test coverage using Jest:

```bash
# Run unit tests
npm run test

# Run end-to-end tests
npm run test:e2e

# Generate test coverage report
npm run test:cov
```

### Testing Strategy

- Development of tests occurs in a dedicated testing branch
- Unit tests for all services and controllers
- E2E tests for API endpoints using a test database
- Minimum 80% test coverage requirement
- Mock external dependencies for isolation

## Environment Variables

```
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todo_db

# Authentication
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Database Schema

```prisma
model User {
  id             Int      @id @default(autoincrement())
  email          String   @unique
  password       String
  firstName      String?
  lastName       String?
  isActive       Boolean  @default(true)
  refreshToken   String?
  preferences    Json?    @default("{}")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  todos          Todo[]
  resetToken     String?
  resetTokenExp  DateTime?

  @@map("users")
}

model Todo {
  id          Int       @id @default(autoincrement())
  title       String
  description String?
  isCompleted Boolean   @default(false)
  dueDate     DateTime?
  priority    Priority  @default(MEDIUM)
  tags        String[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      Int

  @@map("todos")
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

## Performance Optimizations

To ensure high performance, the API implements:

- Redis caching for frequently accessed data
- Efficient database queries with proper indexing
- Pagination to limit resource usage
- Optimized JWT handling with token size minimization

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.