import React, { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Container,
  Grid,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material'

import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import PollIcon from '@mui/icons-material/Poll'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getApiAdminForms,
  patchApiFormsPublish,
  restoreApiFormsId,
  deleteApiFormsId,
} from '../api-client'
import type { BackendInternalModelFormSummary } from '../api-client'

export default function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleted, setShowDeleted] = useState(false)

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // React Query para buscar formulários utilizando o SDK Hey-API
  const { data: forms, isLoading, isError, error } = useQuery<BackendInternalModelFormSummary[]>({
    queryKey: ['admin-forms', showDeleted],
    queryFn: async () => {
      const response = await getApiAdminForms({
        query: { deleted: showDeleted },
      })
      return response.data || []
    },
  })

  // Mutação para excluir
  const deleteFormMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteApiFormsId({ path: { id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-forms'] })
      setToast({ open: true, message: 'Formulário excluído com sucesso!', severity: 'success' })
    },
    onError: () => {
      setToast({ open: true, message: 'Erro ao excluir formulário.', severity: 'error' })
    },
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este formulário?')) {
      deleteFormMutation.mutate(id)
    }
  }

  // Mutação para restaurar
  const restoreFormMutation = useMutation({
    mutationFn: async (id: string) => {
      await restoreApiFormsId({ path: { id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-forms'] })
      setToast({ open: true, message: 'Formulário restaurado com sucesso!', severity: 'success' })
    },
    onError: () => {
      setToast({ open: true, message: 'Erro ao restaurar formulário.', severity: 'error' })
    },
  })

  const handleRestore = (id: string) => {
    restoreFormMutation.mutate(id)
  }

  // Mutação para publicar/despublicar
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      await patchApiFormsPublish({
        path: { id },
        body: { published: !published },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-forms'] })
      setToast({ open: true, message: 'Status atualizado com sucesso!', severity: 'success' })
    },
    onError: () => {
      setToast({ open: true, message: 'Erro ao alterar publicação do formulário.', severity: 'error' })
    },
  })

  const copyPublicLink = (slug?: string, formId?: string) => {
    const url = slug ? `${window.location.origin}/f/${slug}` : `${window.location.origin}/f/${formId}`
    navigator.clipboard.writeText(url)
    setToast({ open: true, message: 'Link público copiado para a área de transferência!', severity: 'success' })
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Painel de Formulários {showDeleted && '(Lixeira)'} - Teste Falqon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {showDeleted
              ? 'Exibindo apenas formulários excluídos logicamente.'
              : 'Crie, publique e acompanhe as respostas dos seus formulários.'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                color="warning"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <DeleteSweepIcon fontSize="small" />
                <Typography variant="body2" fontWeight="medium">
                  {showDeleted ? 'Ver Ativos' : 'Ver Lixeira'}
                </Typography>
              </Box>
            }
          />

          {!showDeleted && (
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/forms/new')}
            >
              Novo Formulário
            </Button>
          )}
        </Box>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(error as Error)?.message || 'Ocorreu um erro ao buscar os formulários.'}
        </Alert>
      )}

      {!isLoading && !isError && forms?.length === 0 && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {showDeleted
              ? 'A lixeira está vazia.'
              : 'Nenhum formulário cadastrado até o momento.'}
          </Typography>
          {!showDeleted && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/forms/new')}
              sx={{ mt: 2 }}
            >
              Criar Primeiro Formulário
            </Button>
          )}
        </Card>
      )}

      <Grid container spacing={3}>
        {forms?.map((form) => (
          <Grid xs={12} sm={6} md={4} key={form.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: showDeleted ? '1px dashed' : '1px solid',
                borderColor: showDeleted ? 'error.main' : 'divider',
                bgcolor: 'background.paper',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { boxShadow: 4 },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Chip
                    label={showDeleted ? 'Excluído' : form.published ? 'Publicado' : 'Rascunho'}
                    color={showDeleted ? 'error' : form.published ? 'success' : 'default'}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {`${form.responsesCount ?? 0} ${(form.responsesCount ?? 0) === 1 ? 'resposta' : 'respostas'}`}
                  </Typography>
                </Box>

                <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mt: 1, color: 'text.primary' }}>
                  {form.title}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, minHeight: '2.5em' }}>
                  {form.description
                    ? form.description.length > 80
                      ? `${form.description.substring(0, 80)}...`
                      : form.description
                    : 'Sem descrição.'}
                </Typography>
              </CardContent>

              <Divider />

              {showDeleted ? (
                <CardActions sx={{ justifyContent: 'flex-end', px: 2, py: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<RestoreFromTrashIcon />}
                    onClick={() => form.id && handleRestore(form.id)}
                    disabled={restoreFormMutation.isPending}
                  >
                    Restaurar
                  </Button>
                </CardActions>
              ) : (
                <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => navigate(`/admin/forms/${form.id}/edit`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Ver Respostas">
                      <IconButton size="small" onClick={() => navigate(`/admin/forms/${form.id}/responses`)}>
                        <PollIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Excluir Formulário">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => form.id && handleDelete(form.id)}
                        disabled={deleteFormMutation.isPending}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {form.published && (
                      <>
                        <Tooltip title="Abrir Link Público">
                          <IconButton size="small" onClick={() => window.open(`/f/${form.publicUrl || form.id}`, '_blank')}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Copiar Link Público">
                          <IconButton size="small" onClick={() => copyPublicLink(form.publicUrl, form.id)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>

                  <Button
                    size="small"
                    color={form.published ? 'warning' : 'primary'}
                    onClick={() => form.id && togglePublishMutation.mutate({ id: form.id, published: Boolean(form.published) })}
                    disabled={togglePublishMutation.isPending}
                  >
                    {form.published ? 'Despublicar' : 'Publicar'}
                  </Button>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}