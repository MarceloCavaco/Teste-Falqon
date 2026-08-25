# Variáveis de configuração
MAIN_FILE=./cmd/server/main.go
DOCS_DIR=./docs

.PHONY: swag docs build run

# Comando para gerar a documentação Swagger / OpenAPI 3
docs:
	@echo "Gerando especificação OpenAPI com swag..."
	swag init -g $(MAIN_FILE) -o $(DOCS_DIR) --parseDependency

# Alias para facilitar (permitir rodar 'make swagger' também)
swagger: docs

# Comando para rodar a aplicação Go
run: docs
	go run $(MAIN_FILE)

# Comando para compilar o binário
build: docs
	go build -o bin/server $(MAIN_FILE)