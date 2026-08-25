package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"backend/internal/model"
	"backend/internal/repository"

	"github.com/go-chi/chi/v5"
	"gorm.io/datatypes"
)

var formRepo = repository.NewFormRepository()

// CreateFormRequest define o payload recebido para criar ou atualizar um formulário
type CreateFormRequest struct {
	Title       string            `json:"title"`
	Description string            `json:"description"`
	Slug        string            `json:"slug"`
	Published   bool              `json:"published"`
	Fields      []model.FormField `json:"fields"`
}

// HandleGetFormByID busca um formulário pelo ID
// @Summary Buscar Formulário por ID
// @Description Retorna a estrutura completa do formulário e seus campos para edição
// @Id getApiFormsId
// @Tags Forms
// @Produce json
// @Param id path string true "ID do Formulário"
// @Success 200 {object} model.Form
// @Failure 404 {string} string "Formulário não encontrado"
// @Router /api/forms/{id} [get]
func HandleGetFormByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	form, err := formRepo.GetFormByID(id)
	if err != nil {
		http.Error(w, "Formulário não encontrado", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(form)
}

// HandleUpdateForm atualiza as informações de um formulário existente
// @Summary Atualizar Formulário
// @Description Atualiza título, descrição, slug e reescreve os campos do formulário
// @Id putApiFormsId
// @Tags Forms
// @Accept json
// @Produce json
// @Param id path string true "ID do Formulário"
// @Param request body handler.CreateFormRequest true "Dados atualizados do formulário"
// @Success 200 {object} map[string]string
// @Failure 400 {string} string "Payload inválido"
// @Failure 500 {string} string "Erro ao atualizar formulário"
// @Router /api/forms/{id} [put]
func HandleUpdateForm(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "ID é obrigatório", http.StatusBadRequest)
		return
	}

	// pegar o user_id da sessão:
	userIDVal, err := getUserIDFromRequest(r)
	log.Printf("userIDVal Valor: %v", userIDVal)
	if err != nil || userIDVal == "" {
		http.Error(w, "Usuário não autenticado ou token inválido", http.StatusUnauthorized)
		return
	}

	var req CreateFormRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[ERROR] Falha ao decodificar JSON: %v", err)
		http.Error(w, "Payload inválido", http.StatusBadRequest)
		return
	}

	form := model.Form{
		ID:          id,
		UserID:      userIDVal,
		Title:       req.Title,
		Description: req.Description,
		Slug:        req.Slug,
		Published:   req.Published,
		Fields:      req.Fields,
	}

	// Insere a nova lista de campos zerando a chave primária
	if len(form.Fields) > 0 {
		for i := range form.Fields {
			form.Fields[i].ID = "" // zera o ID para o banco gerar um novo UUID
			form.Fields[i].FormID = form.ID
		}
	}

	if err := formRepo.UpdateForm(&form); err != nil {
		http.Error(w, "Erro ao atualizar formulário no banco: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Formulário atualizado com sucesso"})
}

// HandleDeleteForm realiza a exclusão de um formulário
// @Summary Excluir Formulário
// @Description Remove o formulário e suas dependências pelo ID
// @Id deleteApiFormsId
// @Tags Forms
// @Produce json
// @Param id path string true "ID do Formulário"
// @Success 200 {object} map[string]string
// @Failure 500 {string} string "Erro ao excluir formulário"
// @Router /api/forms/{id} [delete]
func HandleDeleteForm(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "ID é obrigatório", http.StatusBadRequest)
		return
	}

	if err := formRepo.DeleteForm(id); err != nil {
		http.Error(w, "Erro ao excluir formulário: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Formulário excluído com sucesso"})
}

// HandleCreateForm cria um novo formulário
// @Summary Criar formulário
// @Description Cria um novo formulário com os campos especificados
// @Id postApiForms
// @Tags Forms
// @Accept json
// @Produce json
// @Param request body handler.CreateFormRequest true "Dados de criação do formulário"
// @Success 201 {object} model.Form
// @Failure 400 {object} map[string]string
// @Router /api/forms [post]
func HandleCreateForm(w http.ResponseWriter, r *http.Request) {

	userIDVal, err := getUserIDFromRequest(r)
	log.Printf("userIDVal Valor: %v", userIDVal)

	if err != nil || userIDVal == "" {
		http.Error(w, "Usuário não autenticado ou token inválido", http.StatusUnauthorized)
		return
	}

	var req CreateFormRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("[ERROR] Falha ao decodificar JSON: %v", err)
		http.Error(w, "Payload inválido", http.StatusBadRequest)
		return
	}

	form := model.Form{
		UserID:      userIDVal, // Use o ID do usuário autenticado
		Title:       req.Title,
		Description: req.Description,
		Slug:        req.Slug,
		Published:   req.Published,
		Fields:      req.Fields,
	}

	if err := formRepo.CreateForm(&form); err != nil {
		http.Error(w, "Erro ao salvar formulário no banco: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(form)
}

// HandleGetPublicForm busca a estrutura pública de um formulário pelo slug
// @Summary Buscar Formulário Público
// @Description Retorna o formulário e seus campos visíveis usando o slug único
// @Id getPublicFormBySlug
// @Tags Public
// @Produce json
// @Param slug path string true "Slug do formulário"
// @Success 200 {object} model.Form
// @Failure 404 {string} string "Formulário não encontrado ou inativo"
// @Router /f/{slug} [get]
func HandleGetPublicForm(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	form, err := formRepo.GetFormBySlugOrID(slug)
	if err != nil {
		http.Error(w, "Formulário não encontrado ou inativo", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(form)
}

// HandleSubmitPublicForm salva a submissão de respostas de um formulário com validação de campos obrigatórios
// @Summary Submeter Resposta de Formulário
// @Description Recebe um objeto JSON com os pares de pergunta/resposta, valida campos obrigatórios e persiste no banco
// @Id submitPublicForm
// @Tags Public
// @Accept json
// @Produce json
// @Param slug path string true "Slug do formulário"
// @Param request body object true "Objeto JSON contendo as respostas"
// @Success 201 {object} map[string]string
// @Failure 400 {string} string "Payload de resposta inválido ou campo obrigatório ausente"
// @Failure 404 {string} string "Formulário não encontrado"
// @Failure 500 {string} string "Erro ao salvar resposta no banco"
// @Router /f/{slug}/submit [post]
func HandleSubmitPublicForm(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	// Busca o formulário juntamente com seus campos cadastrados para conseguir validar as regras
	form, err := formRepo.GetFormBySlugOrID(slug)
	if err != nil {
		http.Error(w, "Formulário não encontrado", http.StatusNotFound)
		return
	}

	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		log.Printf("[ERROR] Falha ao decodificar JSON: %v", err)
		http.Error(w, "Payload de resposta inválido", http.StatusBadRequest)
		return
	}

	// Validação de campos obrigatórios com base na definição do formulário
	for _, field := range form.Fields {
		if field.Required {
			// Verifica se a chave correspondente ao nome do campo existe nas respostas enviadas
			val, exists := body[field.Label]

			// Se o campo não foi enviado, ou se veio nulo/vazio, barramos a submissão
			if !exists || val == nil || val == "" {
				http.Error(w, "O campo obrigatório '"+field.Label+"' não foi preenchido.", http.StatusBadRequest)
				return
			}
		}
	}

	answersJSON, err := json.Marshal(body)
	if err != nil {
		log.Printf("[ERROR] Falha Marshal JSON: %v", err)
		http.Error(w, "Erro ao processar respostas", http.StatusInternalServerError)
		return
	}

	response := model.FormResponse{
		FormID:  form.ID,
		Answers: datatypes.JSON(answersJSON),
	}

	if err := formRepo.SaveResponse(&response); err != nil {
		http.Error(w, "Erro ao gravar resposta no banco", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message":    "Resposta registrada com sucesso!",
		"responseId": response.ID,
	})
}

// HandleTogglePublish altera o status de publicação do formulário
// @Summary Alternar Publicação
// @Id patchApiFormsPublish
// @Tags Admin
// @Accept json
// @Produce json
// @Param id path string true "ID do Formulário"
// @Param request body map[string]bool true "Payload contendo {published: bool}"
// @Success 200 {object} map[string]string
// @Router /api/admin/forms/{id}/publish [patch]
func HandleTogglePublish(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "ID é obrigatório", http.StatusBadRequest)
		return
	}

	var req struct {
		Published bool `json:"published"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Payload inválido", http.StatusBadRequest)
		return
	}

	if err := formRepo.UpdatePublishStatus(id, req.Published); err != nil {
		http.Error(w, "Erro ao atualizar status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Status atualizado com sucesso"})
}

// HandleGetFormResponses lista todas as respostas submetidas para um formulário
// @Summary Listar Respostas do Formulário
// @Id getApiFormsResponses
// @Tags Forms
// @Produce json
// @Param id path string true "ID do Formulário (UUID)"
// @Success 200 {array} model.FormResponse
// @Failure 500 {string} string "Erro ao buscar respostas"
// @Router /api/forms/{id}/responses [get]
func HandleGetFormResponses(w http.ResponseWriter, r *http.Request) {
	formID := chi.URLParam(r, "id")

	responses, err := formRepo.GetResponsesByFormID(formID)
	if err != nil {
		log.Printf("[ERROR] Falha GetResponsesByFormID: %v", err)
		http.Error(w, "Erro ao buscar respostas", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responses)
}

// HandleListForms lista todos os formulários cadastrados
// @Summary Listar Formulários
// @Id getApiAdminForms
// @Tags Admin
// @Produce json
// @Param deleted query bool false "Exibir excluídos"
// @Success 200 {array} model.FormSummary
// @Failure 500 {string} string "Erro ao buscar formulários"
// @Router /api/admin/forms [get]
func HandleListForms(w http.ResponseWriter, r *http.Request) {
	showDeleted := r.URL.Query().Get("deleted") == "true"

	forms, err := formRepo.ListAllForms(showDeleted)
	if err != nil {
		http.Error(w, "Erro ao buscar formulários", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(forms)
}

// HandleRestoreForm restaura um formulário excluído
// @Summary Restaurar Formulário
// @Id restoreApiFormsId
// @Tags Admin
// @Produce json
// @Param id path string true "ID do Formulário"
// @Success 200 {object} map[string]string
// @Failure 500 {string} string "Erro ao restaurar formulário"
// @Router /api/forms/{id}/restore [patch]
func HandleRestoreForm(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "ID é obrigatório", http.StatusBadRequest)
		return
	}

	if err := formRepo.RestoreForm(id); err != nil {
		log.Printf("[ERROR] Falha ao restaurar formulário %s: %v", id, err)
		http.Error(w, "Erro ao restaurar formulário: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Formulário restaurado com sucesso"})
}
