import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { getPublicFormBySlug, submitPublicForm } from '../api-client'
import type { BackendInternalModelForm } from '../api-client'

export default function PublicFormPage() {
  const { slug } = useParams<{ slug: string }>()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: form, isLoading, isError } = useQuery({
    queryKey: ['publicForm', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug inválido.')
      const res = await getPublicFormBySlug({
        path: { slug },
      })
      return res.data
    },
    enabled: Boolean(slug),
  })

  const handleChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!slug) return

    try {
      setIsSubmitting(true)
      await submitPublicForm({
        path: { slug },
        body: { answers: formData },
      })
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Erro ao submeter formulário.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Carregando formulário...</Typography>
      </Container>
    )
  }

  if (isError || !form) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">Formulário não encontrado ou inativo.</Alert>
      </Container>
    )
  }

  if (submitted) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Sua resposta foi registrada com sucesso!
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Obrigado por preencher este formulário.
          </Typography>
        </Card>
      </Container>
    )
  }

  const publicForm = form as BackendInternalModelForm & {
    title?: string
    description?: string
    fields?: Array<{
      id?: string
      label?: string
      fieldType?: string
      required?: boolean
      options?: string[] | string
    }>
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ color: '#000000' }}>
            {publicForm.title}
          </Typography>
          {publicForm.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {publicForm.description}
            </Typography>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {publicForm.fields?.map((field) => {
              const fieldType = field.fieldType
              const fieldKey = field.label || field.id || ''
              
              const options: string[] = Array.isArray(field.options)
                ? field.options.map((option) => String(option))
                : typeof field.options === 'string'
                ? (field.options as string).split(',').map((o) => o.trim()).filter(Boolean)
                : []

              return (
                <Box key={field.id || field.label} sx={{ mb: 3 }}>
                  {(fieldType === 'text' || fieldType === 'string') && (
                    <TextField
                      fullWidth
                      label={field.label}
                      required={field.required}
                      onChange={(e) => handleChange(fieldKey, e.target.value)}
                    />
                  )}

                  {fieldType === 'number' && (
                    <TextField
                      fullWidth
                      type="number"
                      label={field.label}
                      required={field.required}
                      onChange={(e) => handleChange(fieldKey, e.target.value)}
                    />
                  )}

                  {fieldType === 'select' && (
                    <FormControl fullWidth required={field.required}>
                      <InputLabel>{field.label}</InputLabel>
                      <Select
                        label={field.label}
                        value={formData[fieldKey] || ''}
                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                      >
                        {options.map((opt: string, i: number) => (
                          <MenuItem key={i} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {fieldType === 'checkbox' && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          onChange={(e) => handleChange(fieldKey, e.target.checked)}
                        />
                      }
                      label={field.label}
                    />
                  )}
                </Box>
              )
            })}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 2, py: 1.5 }}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Resposta'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}