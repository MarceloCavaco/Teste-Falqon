import React, { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  TextField,
  Typography,
  Alert,
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Preencha todos os campos.')
      return
    }
    setError('')
    // Chamada de API de autenticação ou redirecionamento para a área admin
    navigate('/admin')
  }

  const handleGoogleLogin = () => {
    // Redireciona para o endpoint OAuth exposto pelo backend Go
    window.location.href = 'http://localhost:8080/auth/google'
  }

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography component="h1" variant="h5" align="center" gutterBottom
                        sx={{ color: 'primary.main', fontWeight: 'bold' }} >
              Form Builder <br></br> <small>Teste Falqon</small>
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Acesse sua conta para gerenciar formulários
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              onClick={handleGoogleLogin}
              startIcon={<GoogleIcon />}
              sx={{ mb: 2, textTransform: 'none', py: 1 }}
            >
              Entrar com o Google
            </Button>

            <Divider sx={{ my: 0.5, fontSize: '0.875rem', color: 'text.secondary' }}>ou</Divider>

            <Box component="form" onSubmit={handleEmailLogin}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="E-mail"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Senha"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.2 }}
              >
                Entrar
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}