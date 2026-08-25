package handler

import "net/http"

// HealthCheck verifica se a API está online
// @Summary Health Check
// @Description Retorna OK se a aplicação estiver respondendo
// @Tags System
// @Produce plain
// @Success 200 {string} string "OK"
// @Router /api/health [get]
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
