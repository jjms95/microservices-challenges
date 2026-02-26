# ─────────────────────────────────────────────────────────────────
#  Makefile — Microservices Challenges
#  Uso: make <target>
# ─────────────────────────────────────────────────────────────────
.PHONY: help prod dev dev-db down clean logs logs-employees logs-departments install

# Muestra los comandos disponibles
help:
	@echo ""
	@echo "  🚀  Microservices Challenges — Comandos disponibles"
	@echo ""
	@echo "  Producción:"
	@echo "    make prod             Levanta todos los servicios en modo producción (--build)"
	@echo ""
	@echo "  Desarrollo:"
	@echo "    make dev              Hot-reload completo en Docker (docker compose watch)"
	@echo "    make dev-db           Solo levanta las bases de datos en Docker"
	@echo "                         → Corre los servicios localmente con 'npm run start:dev'"
	@echo ""
	@echo "  Utilidades:"
	@echo "    make down             Detiene todos los contenedores"
	@echo "    make clean            Detiene contenedores y elimina volúmenes (reset de BD)"
	@echo "    make logs             Muestra logs de todos los servicios (follow)"
	@echo "    make logs-employees   Logs solo del employees-service"
	@echo "    make logs-departments Logs solo del departments-service"
	@echo "    make install          npm install en ambos servicios"
	@echo ""

# ── Producción ─────────────────────────────────────────────────
prod:
	docker compose up --build

# ── Desarrollo Opción A: hot-reload completo en Docker ──────────
# Requiere Docker Desktop >= 4.24 / Docker Compose >= 2.22
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --watch

# ── Desarrollo Opción B (híbrida): solo bases de datos en Docker ─
# Luego corre manualmente en terminales separadas:
#   cd employees-service && npm run start:dev
#   cd departments-service && npm run start:dev
dev-db:
	docker compose up database-employees database-departments

# ── Utilidades ─────────────────────────────────────────────────
down:
	docker compose down

clean:
	docker compose down -v
	@echo "⚠️  Volúmenes eliminados. Las bases de datos han sido reseteadas."

logs:
	docker compose logs -f

logs-employees:
	docker compose logs -f employees-service

logs-departments:
	docker compose logs -f departments-service

install:
	cd employees-service && npm install
	cd departments-service && npm install
