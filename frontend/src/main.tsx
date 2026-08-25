import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

// Importe o client da pasta api-client
import { client } from './api-client/client.gen'

// Ajuste a baseUrl para incluir o protocolo http://
client.setConfig({
  baseUrl: 'http://localhost:8080',
})

// Adiciona o cabeçalho de autenticação em todas as chamadas
client.interceptors.request.use((request) => {
  const token = localStorage.getItem('token') // Ou a chave exata onde você salva o token
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }
  return request
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)