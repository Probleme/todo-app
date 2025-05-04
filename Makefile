# Local development and testing commands
.PHONY: setup test test-e2e reset-test-db install dev

# Install dependencies
install:
	npm install

# Run the development server
dev:
	npm run start:dev

# Setup the test environment
setup:
	npx prisma generate
	npx prisma migrate reset --force --schema=./prisma/schema.prisma

# Reset test database
reset-test-db:
	npx prisma migrate reset --force --schema=./prisma/schema.prisma

# Run unit tests
test: reset-test-db
	npm run test

# Lint code
lint:
	npm run lint

# Format code
format:
	npm run format