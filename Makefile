all: up

up: build
	docker-compose -f docker-compose.yml up #-d

build:
	docker-compose -f docker-compose.yml build

start:
	docker-compose -f docker-compose.yml start

stop:
	docker-compose -f docker-compose.yml stop

down:
	docker-compose -f docker-compose.yml down

postgres-logs:
	docker-compose -f docker-compose.yml logs -f postgres

redis-logs:
	docker-compose -f docker-compose.yml logs -f redis

api-logs:
	docker-compose -f docker-compose.yml logs -f api

clean: down

fclean: clean
	docker system prune -a --volumes -f

re: fclean all

# Run unit tests inside the test-api service
test:
	docker-compose up -d test-api test-db redis
	@echo "Waiting for test services to initialize..."
	sleep 10
	docker exec -it todo-test-api npm run test
	docker-compose down

# Run E2E tests inside the test-api service
test-e2e:
	docker-compose up -d test-api test-db redis
	@echo "Waiting for test services to initialize..."
	sleep 10
	docker exec -it todo-test-api npm run test:e2e
	docker-compose down

# Setup the test database
test-setup:
	docker-compose up -d test-api test-db redis
	@echo "Waiting for test services to initialize..."
	sleep 10
	docker exec -it todo-test-api npm run test:setup
	docker-compose down

.PHONY: all build down clean fclean re up start stop postgres-logs redis-logs api-logs test test-e2e test-setup