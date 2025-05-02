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

.PHONY: all build down clean fclean re up start stop postgres-logs redis-logs api-logs