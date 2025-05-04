# Todo API - Testing Guide

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="NestJS Logo">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=jest&logoColor=white" alt="Jest">
</p>

This guide explains how to set up and run unit tests for the Todo API application using Jest.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Test Environment Setup](#test-environment-setup)
- [Running Tests](#running-tests)
- [Troubleshooting Common Test Issues](#troubleshooting-common-test-issues)
- [Writing New Tests](#writing-new-tests)
- [Continuous Integration](#continuous-integration)

## Prerequisites

Before you can run tests, you need to set up your local environment:

### Required Software

- Node.js (v16+)
- npm or yarn 
- **PostgreSQL running on port 5433** (non-default port)
- **Redis running on default port 6379**

### PostgreSQL Setup

1. Install PostgreSQL if you haven't already.
2. Configure PostgreSQL to run on port 5433:
   - For Linux/Mac: Edit postgresql.conf and set `port = 5433`, then restart PostgreSQL
   - For Windows: Edit postgresql.conf in the PostgreSQL data directory, change port to 5433, and restart the service

3. Create the test database:
   ```bash
   # Connect to PostgreSQL (adjust username as needed)
   psql -U postgres -p 5433

   # Create the test database and user (in psql)
   CREATE DATABASE todo_test_db;
   CREATE USER postgres WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE todo_test_db TO postgres;
   ```

### Redis Setup

Ensure Redis is installed and running on the default port (6379):

```bash
# Linux
sudo apt-get install redis-server
sudo systemctl start redis-server

# macOS
brew install redis
brew services start redis

# Windows
# Download and install Redis from https://github.com/tporadowski/redis/releases
```

## Test Environment Setup

1. Clone the repository (if you haven't already) and install dependencies:

```bash
git clone <repository-url>
cd todo-api
npm install
```

2. Ensure your `.env` file has the correct test configuration:

```dotenv
# Environment
NODE_ENV=test
PORT=3001

# Test Database
DATABASE_URL=postgresql://postgres:password@localhost:5433/todo_test_db

# JWT
JWT_SECRET=18aacb75f408e76316a0a8333b761f190e22a12aa16815cbc66515d53f28c298
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

3. Generate Prisma client:

```bash
npx prisma generate
```

## Running Tests

The project includes Jest-based unit tests that verify individual components in isolation:

```bash
# Run all unit tests
make test

# Alternatively, using npm directly
npm run test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:cov
```

### Using the Makefile

The project includes a Makefile with useful commands for testing:

```bash
# Setup the test environment
make setup

# Run unit tests
make test

# Reset the test database
make reset-test-db

# Lint code
make lint

# Format code
make format
```

## Troubleshooting Common Test Issues

### Database Connection Issues

If tests fail with database connection errors:

1. Verify PostgreSQL is running on port 5433:
   ```bash
   sudo lsof -i :5433   # Linux/Mac
   # or
   netstat -an | findstr 5433   # Windows
   ```

2. Check your database credentials in the `.env` file

3. Verify the test database exists:
   ```bash
   psql -U postgres -p 5433 -c "\l" | grep todo_test_db
   ```

### Redis Connection Issues

If tests fail with Redis connection errors:

1. Verify Redis is running:
   ```bash
   redis-cli ping   # Should return PONG
   ```
   
2. Check Redis connection settings in the `.env` file

### Pagination Response Structure

If tests fail expecting a different response structure:

```
Expected: [array of items]
Received: {"data": [array of items], "meta": {pagination metadata}}
```

Remember that the API returns paginated responses with this structure:
```json
{
  "data": [...items],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

Update your tests to expect this structure.

## Writing New Tests

Unit tests should be placed in `src/` next to the file they're testing with a `.spec.ts` suffix:

```typescript
// Example: src/modules/todos/todos.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TodosService } from './todos.service';
// more imports...

describe('TodosService', () => {
  let service: TodosService;
  
  // Test setup and mocks...
  
  it('should create a todo', async () => {
    // Test implementation...
  });
});
```

### Mocking Dependencies

When writing tests, use Jest's mocking capabilities to isolate the component under test:

```typescript
const mockPrismaService = {
  todo: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      TodosService,
      {
        provide: PrismaService,
        useValue: mockPrismaService,
      },
      {
        provide: CACHE_MANAGER,
        useValue: mockCacheManager,
      },
    ],
  }).compile();

  service = module.get<TodosService>(TodosService);
  
  // Reset all mocks before each test
  jest.clearAllMocks();
});
```

### Testing Paginated Responses

For services that return paginated responses, structure your tests like this:

```typescript
it('should return a paginated list of todos for a user', async () => {
  const userId = 1;
  const todosData = [
    {
      id: 1,
      title: 'Test Todo',
      description: 'Test Description',
      isCompleted: false,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Expected paginated response structure
  const expectedResponse = {
    data: todosData,
    meta: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    }
  };

  // Mock the count method to return a count
  mockPrismaService.todo.count.mockResolvedValue(1);
  mockPrismaService.todo.findMany.mockResolvedValue(todosData);

  // If the service accepts query parameters, provide them
  const todos = await service.findAll(userId, {});
  
  // Verify the response matches the expected structure
  expect(todos).toEqual(expectedResponse);
});
```

## Continuous Integration

The testing setup is compatible with most CI systems. A typical CI workflow includes:

1. Setting up PostgreSQL and Redis in the CI environment
2. Installing dependencies
3. Running linting
4. Running unit tests
5. Generating coverage reports

For local development and pre-commit testing, you can run:

```bash
# Run a complete test suite locally
make test
```

## API Endpoints

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.