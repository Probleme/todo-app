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

# View logs of specific containers
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

# # New command to create an admin user
# create-admin:
# 	@echo "Creating admin user..."
# 	docker-compose exec backend node scripts/seedInitialAdmin.js "$(EMAIL)" "$(NAME)"

.PHONY: all build down clean fclean re up start stop postgres-logs redis-logs api-logs