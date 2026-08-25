package model

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// User representa um usuário administrador.
type User struct {
	ID        string         `gorm:"primaryKey;type:uuid;default:90124376-7887-4b7b-99d8-91fb55dfc022" json:"id"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Name      string         `json:"name"`
	AvatarURL string         `json:"avatarUrl"`
	Forms     []Form         `gorm:"foreignKey:UserID" json:"forms,omitempty"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// Form representa a estrutura principal de um formulário.
type Form struct {
	ID          string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID      string `gorm:"index;not null" json:"userId"`
	Title       string `gorm:"not null" json:"title"`
	Description string `json:"description"`
	Slug        string `gorm:"uniqueIndex;not null" json:"slug"`
	Published   bool   `gorm:"default:true" json:"published"`

	Fields    []FormField    `gorm:"foreignKey:FormID;constraint:OnDelete:CASCADE" json:"fields,omitempty"`
	Responses []FormResponse `gorm:"foreignKey:FormID;constraint:OnDelete:CASCADE" json:"responses,omitempty"`

	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// FormField representa uma pergunta ou campo dinâmico dentro de um formulário.
type FormField struct {
	ID         string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	FormID     string `gorm:"index;not null" json:"formId"`
	Label      string `gorm:"not null" json:"label"`
	FieldType  string `gorm:"not null" json:"fieldType"`
	Required   bool   `gorm:"default:false" json:"required"`
	OrderIndex int    `gorm:"default:0" json:"orderIndex"`

	// @swaggertype object
	Options datatypes.JSON `gorm:"type:jsonb" json:"options,omitempty"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// FormResponse armazena a submissão efetuada por um usuário final.
type FormResponse struct {
	ID     string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	FormID string `gorm:"index;not null" json:"formId"`

	// @swaggertype object
	Answers datatypes.JSON `gorm:"type:jsonb;not null" json:"answers"`

	SubmittedAt time.Time `gorm:"autoCreateTime" json:"submittedAt"`
}
