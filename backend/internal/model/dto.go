package model

import "time"

type LoginRequest struct {
	Email    string `json:"email" example:"user@example.com"`
	Password string `json:"password" example:"123456"`
}

type AuthResponse struct {
	Token string `json:"token" example:"mock-jwt-token"`
}

type ResponseMock struct {
	ID          string                 `json:"id" example:"resp-1"`
	SubmittedAt string                 `json:"submittedAt" example:"2026-08-24 14:32"`
	Answers     map[string]interface{} `json:"answers"`
}

type SubmitFormRequest struct {
	Answers map[string]interface{} `json:"answers"`
}

type SubmitFormResponse struct {
	Message string `json:"message" example:"Resposta registrada com sucesso"`
}

type FieldMock struct {
	ID       string `json:"id" example:"f1"`
	Label    string `json:"label" example:"Qual o seu nome?"`
	Type     string `json:"type" example:"text"`
	Required bool   `json:"required" example:"true"`
}

type PublicFormResponse struct {
	Title       string      `json:"title" example:"Pesquisa de Satisfação"`
	Description string      `json:"description" example:"Formulário de avaliação do serviço."`
	Slug        string      `json:"slug" example:"pesquisa-satisfacao"`
	Fields      []FieldMock `json:"fields"`
}

type FormSummary struct {
	ID             string    `json:"id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	Published      bool      `json:"published"`
	PublicUrl      string    `json:"publicUrl"`
	ResponsesCount int       `json:"responsesCount"`
	CreatedAt      time.Time `json:"createdAt"`
}
