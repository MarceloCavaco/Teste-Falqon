package handler

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	// Substitua pelo caminho correto do seu módulo
	"backend/internal/config"
	"backend/internal/model"
)

// HandleGoogleLogin redireciona para a tela de login do Google
// @Summary Login com Google
// @Description Inicia o fluxo de autenticação OAuth2 gerando o cookie de estado
// @Tags Auth
// @Success 307
// @Router /auth/google [get]
func HandleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	oauthState, err := config.GenerateStateOauthCookie(w)
	if err != nil {
		http.Error(w, "Erro interno ao gerar sessão de login", http.StatusInternalServerError)
		return
	}
	url := config.GoogleOAuthConfig.AuthCodeURL(oauthState)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// HandleGoogleCallback recebe o código do Google
// @Summary Callback do Google OAuth2
// @Description Processa o retorno do OAuth2, valida o estado via Cookie e redireciona ao Frontend
// @Tags Auth
// @Success 302
// @Failure 400 {string} string "Estado inválido ou Cookie ausente"
// @Failure 500 {string} string "Falha na troca de código pelo token"
// @Router /auth/google/callback [get]
func HandleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	oauthCookie, err := r.Cookie("oauthstate")
	if err != nil {
		http.Error(w, "Cookie de estado ausente ou expirado", http.StatusBadRequest)
		return
	}

	state := r.URL.Query().Get("state")
	if state != oauthCookie.Value {
		http.Error(w, "Estado inválido", http.StatusBadRequest)
		return
	}

	// Destroi o cookie de estado imediatamente após o uso
	expiredCookie := http.Cookie{
		Name:     "oauthstate",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		MaxAge:   -1,
		HttpOnly: true,
		Path:     "/",
	}
	http.SetCookie(w, &expiredCookie)

	code := r.URL.Query().Get("code")
	token, err := config.GoogleOAuthConfig.Exchange(r.Context(), code)
	if err != nil {
		http.Error(w, "Falha ao obter token", http.StatusInternalServerError)
		return
	}

	// Cria um client HTTP usando o token do Google para buscar os dados do usuário
	client := config.GoogleOAuthConfig.Client(r.Context(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		http.Error(w, "Falha ao buscar dados do usuário", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Decodifique os dados (email, nome, etc.) em uma struct própria
	var googleUser struct {
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		http.Error(w, "Erro ao processar dados do usuário", http.StatusInternalServerError)
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173" // fallback padrão para desenvolvimento local
	}

	http.Redirect(w, r, frontendURL+"/admin", http.StatusFound)
}

// HandleEmailLogin realiza o login por email e senha
// @Summary Login com Email e Senha
// @Description Realiza autenticação simples e retorna um JWT fictício
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body model.LoginRequest true "Credenciais do usuário"
// @Success 200 {object} model.AuthResponse
// @Failure 400 {string} string "Dados inválidos"
// @Router /auth/login [post]
func HandleEmailLogin(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(model.AuthResponse{Token: "mock-jwt-token"})
}

// Função auxiliar para extrair o user_id do token no Header da requisição
func getUserIDFromRequest(r *http.Request) (string, error) {
	/*
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			return "", errors.New("token não fornecido")
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return "", errors.New("formato de token inválido")
		}

		tokenString := parts[1]

		claims, err := parseAndVerifyJWT(tokenString)
		if err != nil {
			return "", err
		}
		return claims.UserID, nil
	*/
	const DefaultUserID = "90124376-7887-4b7b-99d8-91fb55dfc022"
	return DefaultUserID, nil
}

type jwtClaims struct {
	UserID  string `json:"user_id"`
	Subject string `json:"sub"`
}

func parseAndVerifyJWT(tokenString string) (jwtClaims, error) {
	var claims jwtClaims
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return claims, errors.New("token JWT inválido")
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return claims, errors.New("payload JWT inválido")
	}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return claims, errors.New("claims JWT inválidas")
	}
	if claims.UserID == "" {
		claims.UserID = claims.Subject
	}
	if claims.UserID == "" {
		return claims, errors.New("user_id ausente no token")
	}
	return claims, nil
}
