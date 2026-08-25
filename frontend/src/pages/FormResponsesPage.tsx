import {
  Box,
  Container,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { getApiFormsResponses } from '../api-client'
import type { BackendInternalModelFormResponse } from '../api-client'

export default function FormResponsesPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: responses = [], isLoading } = useQuery<BackendInternalModelFormResponse[]>({
    queryKey: ['form-responses', id],
    queryFn: async () => {
      if (!id) return []
      const res = await getApiFormsResponses({
          path: { id: id! },
        })
      return res.data || []
    },
    enabled: Boolean(id),
  })

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Botão Voltar visível com texto */}
      <Box mb={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin')}
        >
          Voltar para o Dashboard
        </Button>
      </Box>

      <Box display="flex" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="text.secondary">
          Respostas do Formulário #{id}
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 2, p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID da Submissão</strong></TableCell>
              <TableCell><strong>Data de Envio</strong></TableCell>
              <TableCell><strong>Respostas</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Carregando respostas...
                </TableCell>
              </TableRow>
            ) : responses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Nenhuma resposta enviada até o momento.
                </TableCell>
              </TableRow>
            ) : (
              responses.map((resp) => (
                <TableRow key={resp.id} hover>
                  <TableCell>{resp.id}</TableCell>
                  <TableCell>
                    {resp.submittedAt ? new Date(resp.submittedAt).toLocaleString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {resp.answers &&
                        Object.entries(resp.answers).map(([key, val]) => (
                          <Chip
                            key={key}
                            label={`${key}: ${String(val)}`}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  )
}