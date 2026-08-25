import { Routes, Route, Navigate } from 'react-router-dom'
import './api/config' // Inicializa OpenAPI.BASE

// Páginas (criaremos na sequência)
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import FormBuilderPage from './pages/FormBuilderPage'
import FormResponsesPage from './pages/FormResponsesPage'
import PublicFormPage from './pages/PublicFormPage'



function App() {
  return (
    <Routes>
      {/* Rotas de Autenticação */}
      <Route path="/login" element={<LoginPage />} />

      {/* Área Administrativa (Protegida) */}
      <Route path="/admin" element={<DashboardPage />} />
      <Route path="/admin/forms/new" element={<FormBuilderPage />} />
      <Route path="/admin/forms/:id/edit" element={<FormBuilderPage />} />
      <Route path="/admin/forms/:id/responses" element={<FormResponsesPage />} />

      {/* Rota Pública (Acesso sem autenticação) */}
      <Route path="/f/:slug" element={<PublicFormPage />} />

      {/* Redirecionamento Padrão */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App