package main

import (
	"fmt"
	"net/http"

	_ "backend/docs"
	"backend/internal/config"
	"backend/internal/handler"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	httpSwagger "github.com/swaggo/http-swagger"
)

// @title API Form Engine & Auth
// @version 1.0
// @description API para gerenciamento de formulários e autenticação OAuth2.
// @host localhost:8080
// @BasePath /
func main() {
	config.InitOAuth()
	config.InitDB() // Inicializa o Banco de Dados e AutoMigrate

	r := chi.NewRouter()

	// 1. CORS DEVE SER O PRIMEIRO MIDDLEWARE DA PILHA
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Middlewares secundários
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/swagger/*", httpSwagger.WrapHandler)
	r.Get("/api/health", handler.HealthCheck)

	r.Get("/auth/google", handler.HandleGoogleLogin)
	r.Get("/auth/google/callback", handler.HandleGoogleCallback)
	r.Post("/auth/login", handler.HandleEmailLogin)

	// Rotas Administrativas de Formulários
	r.Get("/api/admin/forms", handler.HandleListForms)
	r.Get("/api/forms", handler.HandleListForms) // Suporte para fetch na Dashboard
	r.Post("/api/forms", handler.HandleCreateForm)
	r.Get("/api/forms/{id}", handler.HandleGetFormByID)   // NOVO: Busca por ID para edição
	r.Put("/api/forms/{id}", handler.HandleUpdateForm)    // NOVO: Edição do formulário
	r.Delete("/api/forms/{id}", handler.HandleDeleteForm) // NOVO: Exclusão do formulário
	r.Get("/api/forms/{id}/responses", handler.HandleGetFormResponses)
	r.Patch("/api/admin/forms/{id}/publish", handler.HandleTogglePublish)
	//r.Patch("/api/admin/forms/{id}/restore", handler.HandleRestoreForm)
	r.Patch("/api/forms/{id}/restore", handler.HandleRestoreForm)

	// Rotas Públicas
	r.Get("/f/{slug}", handler.HandleGetPublicForm)
	r.Post("/f/{slug}/submit", handler.HandleSubmitPublicForm)

	fmt.Println("Servidor rodando na porta :8080")
	fmt.Println("Swagger disponível em: http://localhost:8080/swagger/index.html")
	http.ListenAndServe(":8080", r)
}
