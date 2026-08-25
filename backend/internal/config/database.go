package config

import (
	"log"
	"os"
	"time"

	"backend/internal/model"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	var err error
	dsn := os.Getenv("DATABASE_URL")
	isPostgres := false

	// 1. Tenta conectar ao PostgreSQL se DATABASE_URL estiver definida
	if dsn != "" {
		log.Println("[DB] Tentando conectar ao PostgreSQL...")

		dbPg, errPg := gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})

		if errPg == nil {
			sqlDB, errSql := dbPg.DB()
			if errSql == nil {
				sqlDB.SetConnMaxLifetime(time.Minute * 5)
				// Teste de conexão efetiva (ping)
				if pingErr := sqlDB.Ping(); pingErr == nil {
					DB = dbPg
					isPostgres = true
					log.Println("[DB] Conectado com SUCESSO ao PostgreSQL!")
				}
			}
		}

		if !isPostgres {
			log.Printf("[DB] Falha na conexão/ping com PostgreSQL: %v. Acionando Fallback...", errPg)
		}
	} else {
		log.Println("[DB] DATABASE_URL não foi informada. Redirecionando para SQLite local...")
	}

	// 2. Fallback para SQLite caso o Postgres não esteja disponível ou a URL esteja vazia
	if DB == nil {
		sqlitePath := os.Getenv("SQLITE_PATH")
		if sqlitePath == "" {
			sqlitePath = "formbuilder.db"
		}

		log.Printf("[DB] Conectando ao SQLite local (%s)...", sqlitePath)
		DB, err = gorm.Open(sqlite.Open(sqlitePath), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})

		if err != nil {
			log.Fatalf("[DB] Falha crítica: não foi possível conectar nem ao PostgreSQL nem ao SQLite: %v", err)
		}

		log.Println("[DB] Conectado com SUCESSO ao SQLite!")
	}

	// 3. Executa extensões específicas apenas se for PostgreSQL
	if isPostgres {
		DB.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
	}

	// 4. Executa as migrações automáticas das tabelas (funciona perfeitamente em ambos os drivers)
	err = DB.AutoMigrate(
		&model.User{},
		&model.Form{},
		&model.FormField{},
		&model.FormResponse{},
	)
	if err != nil {
		log.Fatalf("[DB] Falha ao executar AutoMigrate: %v", err)
	}

	log.Println("[DB] Conexão com o banco de dados estabelecida e migrações executadas com sucesso!")
}
