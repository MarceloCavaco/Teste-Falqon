package repository

import (
	"backend/internal/config"
	"backend/internal/model"

	"gorm.io/gorm"
)

type FormRepository struct{}

func NewFormRepository() *FormRepository {
	return &FormRepository{}
}

func (r *FormRepository) ListAllForms(showDeleted bool) ([]model.FormSummary, error) {
	var summaries []model.FormSummary
	db := config.DB

	query := db.Table("forms").
		Select("forms.id, forms.title, forms.description, forms.published, forms.created_at, COUNT(form_responses.id) as responses_count").
		Joins("LEFT JOIN form_responses ON form_responses.form_id = forms.id").
		Group("forms.id")

	if showDeleted {
		query = query.Unscoped().Where("forms.deleted_at IS NOT NULL")
	} else {
		query = query.Where("forms.deleted_at IS NULL")
	}

	err := query.Scan(&summaries).Error
	return summaries, err
}

func (r *FormRepository) CreateForm(form *model.Form) error {
	return config.DB.Create(form).Error
}

func (r *FormRepository) GetFormBySlug(slug string) (*model.Form, error) {
	var form model.Form
	err := config.DB.Preload("Fields").Where("slug = ? AND published = ?", slug, true).First(&form).Error
	if err != nil {
		return nil, err
	}
	return &form, nil
}

// GetFormByID busca um formulário pelo ID (incluindo seus campos)
func (r *FormRepository) GetFormByID(id string) (*model.Form, error) {
	var form model.Form
	err := config.DB.Preload("Fields").Where("id = ?", id).First(&form).Error
	if err != nil {
		return nil, err
	}
	return &form, nil
}

func (r *FormRepository) GetFormBySlugOrID(identifier string) (*model.Form, error) {
	var form model.Form
	err := config.DB.Preload("Fields").
		Where("(slug = ? OR id = ?) AND published = ?", identifier, identifier, true).
		First(&form).Error
	if err != nil {
		return nil, err
	}
	return &form, nil
}

// UpdateForm atualiza os metadados do formulário e substitui a coleção de campos
func (r *FormRepository) UpdateForm(form *model.Form) error {

	return config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Atualiza os dados principais da tabela 'forms'
		if err := tx.Model(form).Where("id = ?", form.ID).Updates(map[string]interface{}{
			"title":       form.Title,
			"description": form.Description,
			"slug":        form.Slug,
			"published":   form.Published,
		}).Error; err != nil {
			return err
		}

		// 2. Remove fisicamente os campos antigos vinculados a este formulário
		if err := tx.Unscoped().Where("form_id = ?", form.ID).Delete(&model.FormField{}).Error; err != nil {
			return err
		}

		// 3. Insere a nova lista de campos zerando a chave primária
		if len(form.Fields) > 0 {
			for i := range form.Fields {
				form.Fields[i].ID = "" // AJUSTE DO PASSO 2: Zera o ID para forçar a geração de novos UUIDs
				form.Fields[i].FormID = form.ID
			}
			if err := tx.Create(&form.Fields).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// DeleteForm remove o formulário (respeitando Soft Delete configurado no model.Form)
func (r *FormRepository) DeleteForm(id string) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("id = ?", id).Delete(&model.Form{}).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *FormRepository) UpdatePublishStatus(id string, published bool) error {
	return config.DB.Model(&model.Form{}).Where("id = ?", id).Update("published", published).Error
}

func (r *FormRepository) SaveResponse(response *model.FormResponse) error {
	return config.DB.Create(response).Error
}

func (r *FormRepository) GetResponsesByFormID(formID string) ([]model.FormResponse, error) {
	var responses []model.FormResponse
	err := config.DB.Where("form_id = ?", formID).Order("submitted_at desc").Find(&responses).Error
	return responses, err
}

// RestoreForm restaura um formulário excluído logicamente zerando o campo deleted_at
func (r *FormRepository) RestoreForm(id string) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Restaura o formulário principal usando Unscoped para achar o registro deletado
		if err := tx.Unscoped().Model(&model.Form{}).Where("id = ?", id).Update("deleted_at", nil).Error; err != nil {
			return err
		}
		return nil
	})
}
