import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import CancelIcon from '@mui/icons-material/Cancel'
import { useNavigate, useParams } from 'react-router-dom'

import { getApiFormsId, postApiForms, putApiFormsId } from '../api-client'

type FieldType = 'text' | 'number' | 'select' | 'checkbox'

interface Field {
  id: string
  label: string
  type: FieldType
  required: boolean
  options?: string
}

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export default function FormBuilderPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [published, setPublished] = useState(false)
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  useEffect(() => {
    if (!isEditing || !id) return

    const loadForm = async () => {
      setFetchingData(true)
      try {
        const res = await getApiFormsId({
          path: { id },
        })
        
        if (!res.data) {
          throw new Error('Formulário não encontrado.')
        }

        const data = res.data

        setTitle(data.title || '')
        setSlug(data.slug || '')
        setDescription(data.description || '')
        setPublished(Boolean(data.published))

        if (data.fields && Array.isArray(data.fields)) {
          const mappedFields: Field[] = data.fields.map((f: any) => ({
            id: f.id || generateUUID(),
            label: f.label || '',
            type: (f.field_type as FieldType) || 'text',
            required: Boolean(f.required),
            options: typeof f.options === 'string' ? f.options : JSON.stringify(f.options || ''),
          }))
          setFields(mappedFields)
        }
      } catch (err: any) {
        setToast({ open: true, message: err.message || 'Erro ao carregar dados', severity: 'error' })
      } finally {
        setFetchingData(false)
      }
    }

    loadForm()
  }, [id, isEditing])

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!isEditing) {
      const autoSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
      setSlug(autoSlug)
    }
  }

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { id: generateUUID(), label: '', type: 'text', required: false, options: '' },
    ])
  }

  const removeField = (fieldId: string) => {
    setFields((prev) => prev.filter((field) => field.id !== fieldId))
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= fields.length) return

    const [movedItem] = newFields.splice(index, 1)
    newFields.splice(targetIndex, 0, movedItem)
    setFields(newFields)
  }

  const updateField = <K extends keyof Field>(fieldId: string, key: K, value: Field[K]) => {
    setFields((prev) =>
      prev.map((field) => (field.id === fieldId ? { ...field, [key]: value } : field))
    )
  }

  const validate = (): boolean => {
    if (!title.trim()) {
      setToast({ open: true, message: 'Informe o título do formulário.', severity: 'error' })
      return false
    }
    if (!slug.trim()) {
      setToast({ open: true, message: 'Informe o slug (URL amigável) do formulário.', severity: 'error' })
      return false
    }
    if (fields.length === 0) {
      setToast({ open: true, message: 'Adicione pelo menos um campo ao formulário.', severity: 'error' })
      return false
    }

    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) {
        setToast({ open: true, message: `O campo #${i + 1} precisa ter um Rótulo/Pergunta.`, severity: 'error' })
        return false
      }
    }
    return true
  }

  const handleSave = async () => {
    if (!validate()) return

    setLoading(true)

    const formattedFields = fields.map((f, index) => {
      let optionsPayload: string[] = []
      if (f.type === 'select' && f.options) {
        optionsPayload = f.options
          .split(',')
          .map((opt) => opt.trim())
          .filter(Boolean)
      }

      return {
        id: f.id,
        label: f.label.trim(),
        fieldType: f.type,
        field_type: f.type,
        required: f.required,
        orderIndex: index + 1,
        order_index: index + 1,
        // Envia como array de strings se preenchido, ou array vazio para evitar NULL/panic no GORM
        options: optionsPayload,
      }
    })

    const payload = {
      title: title.trim(),
      description: description.trim(),
      slug: slug.trim(),
      published,
      fields: formattedFields,
    }

    try {
      if (isEditing && id) {
        await putApiFormsId({
          path: { id },
          body: payload as any,
        })
      } else {
        await postApiForms({
          body: payload as any,
        })
      }
      navigate('/admin')
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Falha ao salvar formulário.', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }


  if (fetchingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/admin')} sx={{ mr: 1 }} aria-label="Voltar">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          {isEditing ? 'Editar Formulário' : 'Novo Formulário'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Configurações Gerais
        </Typography>
        <TextField
          fullWidth
          label="Título do Formulário"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          sx={{ mb: 2 }}
          required
        />
        <TextField
          fullWidth
          label="Slug (URL Amigável)"
          placeholder="ex: pesquisa-satisfacao"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          sx={{ mb: 2 }}
          helperText="Identificador único para a URL pública do formulário."
          required
        />
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              color="primary"
            />
          }
          label={published ? 'Publicado' : 'Rascunho'}
        />
      </Paper>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Campos do Formulário
      </Typography>

      {fields.map((field, index) => (
        <Card key={field.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight="bold">
                Campo #{index + 1}
              </Typography>
              <Box display="flex" gap={0.5}>
                <IconButton size="small" disabled={index === 0} onClick={() => moveField(index, 'up')}>
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" disabled={index === fields.length - 1} onClick={() => moveField(index, 'down')}>
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton color="error" size="small" onClick={() => removeField(field.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box display="flex" gap={2} mb={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <TextField
                fullWidth
                label="Rótulo / Pergunta"
                value={field.label}
                onChange={(e) => updateField(field.id, 'label', e.target.value)}
                required
              />
              <FormControl sx={{ minWidth: 200, mb: 2, mt: 4 }}>
                <InputLabel id={`type-label-${field.id}`}>Tipo de Campo</InputLabel>
                <Select
                  labelId={`type-label-${field.id}`}
                  value={field.type}
                  label="Tipo de Campo"
                  onChange={(e) => updateField(field.id, 'type', e.target.value as FieldType)}
                >
                  <MenuItem value="text">Texto Curto</MenuItem>
                  <MenuItem value="number">Número</MenuItem>
                  <MenuItem value="select">Seleção (Dropdown)</MenuItem>
                  <MenuItem value="checkbox">Caixa de Seleção</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {field.type === 'select' && (
              <TextField
                fullWidth
                label="Opções (separadas por vírgula)"
                placeholder="Opção 1, Opção 2, Opção 3"
                value={field.options || ''}
                onChange={(e) => updateField(field.id, 'options', e.target.value)}
                sx={{ mb: 2 }}
                required
              />
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={field.required}
                  onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                />
              }
              label="Obrigatório"
            />
          </CardContent>
        </Card>
      ))}

      <Button
        fullWidth
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addField}
        sx={{ mb: 3, py: 1.5, borderStyle: 'dashed' }}
      >
        Adicionar Campo
      </Button>

      <Divider sx={{ my: 2 }} />

      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="outlined"
          color="inherit"
          size="large"
          startIcon={<CancelIcon />}
          onClick={() => navigate('/admin')}
          disabled={loading}
        >
          Voltar sem Salvar
        </Button>
        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar Formulário'}
        </Button>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}