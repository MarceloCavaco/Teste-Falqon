# Desafio Técnico - Full Stack Developer (Form Builder) - Teste Falqon

Aplicação web full-stack de alta performance desenvolvida para a criação, publicação e preenchimento dinâmico de formulários, acompanhada de um painel administrativo completo para gestão de cadastros, controle de publicação via slug e auditoria de respostas submetidas.

----

## Arquitetura e Organização do Projeto

O projeto segue padrões estritos de separação de responsabilidades (Clean Architecture / Camadas), garantindo manutenibilidade, testabilidade e excelente DX (Developer Experience).

* **`backend/`**: Desenvolvido em **Go** utilizando o roteador de alta performance **Chi** (`github.com/go-chi/chi/v5`), persistência robusta via **GORM** e PostgreSQL. Organizado em:
  * `cmd/`: Ponto de entrada da aplicação (`server run`).
  * `internal/model`: Definições de entidades de banco de dados e migrações automáticas.
  * `internal/repository`: Camada de acesso a dados (abstração de queries e transações).
  * `internal/handler`: Controladores HTTP, regras de validação de submissões e anotações do Swagger.
* **`frontend/`**: Desenvolvido em **React** e **TypeScript** empacotado via **Vite**, utilizando **Material-UI (MUI)** para componentes visuais[cite: 6], **React Router** para roteamento e **TanStack React Query** para gerenciamento de estado remoto assíncrono[cite: 6].

---

## Tecnologias Utilizadas

### **Backend**
* **Linguagem:** Go
* **Roteador HTTP:** Chi Router (`github.com/go-chi/chi/v5`)
* **ORM:** GORM
* **Banco de Dados:** PostgreSQL
* **Documentação de API:** Swaggo (`github.com/swaggo/swag`)

### **Frontend**
* **Framework:** React + TypeScript
* **Build Tool:** Vite
* **Biblioteca de UI:** Material-UI (MUI)
* **Gerenciamento de Estado/Cache:** TanStack React Query
* **Roteamento:** React Router
* **Cliente HTTP:** Gerado de forma automatizada via `@hey-api/openapi-ts`

---

## Como Executar o Projeto Localmente

### 1. Pré-requisitos
* Go (versão 1.22 ou superior) instalado.
* Node.js (versão 18 ou superior) instalado.
* Instância do PostgreSQL em execução local ou via container Docker.

### 2. Instruções para o Banco de Dados
A aplicação utiliza o PostgreSQL para persistência dos dados. O GORM (ORM utilizado no backend) gerencia automaticamente a criação e atualização das tabelas (AutoMigrate) ao iniciar o serviço.

É possível configurar o banco de dados escolhendo uma das duas abordagens abaixo:

1. Subindo o Banco de Dados com Docker (Recomendado)
Caso tenha o Docker instalado, você pode iniciar o PostgreSQL rapidamente executando na raiz do projeto:
docker compose up -d
Isso iniciará um container PostgreSQL (form_builder_db) na porta 5432 utilizando as seguintes credenciais padrão:
Usuário: postgres
Senha: postgres
Banco de Dados: form_builder

2. Banco Local Criado Manualmente
Caso prefira utilizar uma instalação nativa do PostgreSQL em sua máquina:
Acesse o seu cliente de banco de dados preferido (pgAdmin, DBeaver, psql, etc.).
Crie um novo banco de dados vazio (ex: form_builder).
Configure a string de conexão (DSN) através da variável de ambiente DB_DSN antes de iniciar o backend.
Exemplo de configuração (Linux/macOS):
export DB_DSN="host=localhost user=postgres password=postgres dbname=form_builder port=5432 sslmode=disable"
(No Windows/PowerShell, utilize $env:DB_DSN="...")

### 3. Configuração e Execução do Backend
1. Navegue até a pasta do backend:
   cd backend

2. Configure a string de conexão do banco de dados (via variável de ambiente ou arquivo de configuração conforme suportado pelo seu serviço). 
Exemplo:
export DB_DSN="host=localhost user=postgres password=postgres dbname=form_builder port=5432 sslmode=disable"

3. Execute o servidor Go:
go run cmd/server/main.go run
O servidor da API iniciará escutando na porta configurada (ex: http://localhost:8080). As migrations do banco de dados (tabelas de usuários, formulários, campos e respostas) são executadas automaticamente pelo GORM ao iniciar.

### 4. Configuração e Execução do Frontend
1. Acesse a pasta do frontend:
cd frontend

2. Instale as dependências:
npm install

3. Inicie o servidor de desenvolvimento:
npm run dev
A aplicação web estará acessível em http://localhost:5173

### 5. Pipeline de Especificação OpenAPI e Geração de Client TypeScript
Em conformidade com as diretrizes do desafio, a aplicação garante que o contrato da API e o código do front-end estejam sempre sincronizados de forma automatizada e reproduzível:

1. Gerar a especificação Swagger no Backend:
No diretório do backend, utilize a ferramenta Swaggo para escanear os metadados dos handlers e gerar a especificação JSON:
swag init -g cmd/server/main.go --parseDependency --parseInternal
(Atualiza o arquivo swagger.json dentro da pasta de documentação do backend).

2. Gerar o Client TypeScript no Frontend:
No diretório do frontend, execute o script configurado para ler a spec gerada e atualizar as tipagens e métodos de requisição:
npm run generate-client
(Atualiza os arquivos seguros de tipagem e comunicação em src/api-client).

## Regras de Negócio e Funcionalidades Implementadas
Form Builder Dinâmico: O administrador cria formulários estruturados contendo múltiplos tipos de campos (texto, opções, numéricos) e define quais campos são obrigatórios (required: true).

Publicação via Slug: Cada formulário possui uma flag de publicação e uma URL pública amigável (/f/{slug}) acessível por qualquer visitante sem necessidade de autenticação[cite: 6].

Validação Rigorosa no Backend: Submissões realizadas por usuários externos passam por uma validação automatizada na API que cruza os dados enviados com a modelagem do formulário, bloqueando submissões com falhas em campos obrigatórios (400 Bad Request).

Auditoria e Gestão de Respostas: O painel administrativo permite a listagem de formulários ativos/excluídos (com suporte a Soft Delete e restauração lógica) e a visualização detalhada das respostas coletadas.

## Funcionalidades Adicionais & Diferenciais de UX/UI
Além de atender aos requisitos essenciais do desafio, a aplicação foi concebida com um olhar atento à experiência do usuário (*UX*), à segurança operacional e à robustez de dados:

* **Gerenciamento de Lixeira & Soft Delete (Segurança de Dados):** 
  * *O problema resolvido:* Em sistemas de formulários, exclusões acidentais resultam em perda catastrófica de dados e respostas coletadas.
  * *A solução aplicada:* Implementação de exclusão lógica (*Soft Delete*). Ao remover um formulário, ele é movido para uma lixeira isolada no banco de dados, permitindo auditoria e **restauração imediata com um único clique** direto pelo painel administrativo, garantindo total segurança contra erros operacionais.

* **Navegação Fluida & Feedback Visual Aprimorado (UX / MUI):**
  * *O problema resolvido:* Interfaces administrativas densas frequentemente frustram o usuário por falta de caminhos claros de retorno ou navegação truncada.
  * *A solução aplicada:* Reestruturação completa dos fluxos de navegação com inclusão de botões contextuais de retorno, breadcrumbs visuais e iconografia padronizada em alta qualidade utilizando o ecossistema do **Material-UI (MUI)**. O resultado é uma experiência de uso limpa, intuitiva e altamente profissional, reduzindo a curva de aprendizado para o usuário final.

## Decisões de Arquitetura & Limitações Conhecidas
Nota de transparência técnica alinhada às premissas do teste: 

"Preferi manter uma limitação explicitamente documentada a uma solução parcialmente implementada sem explicação".

1. Autenticação e Gestão de Sessão (Abstração por Restrição de Prazo):

Decisão: Optou-se por concentrar os esforços de engenharia na robustez do ecossistema central do Form Builder (modelagem relacional com GORM, integridade de campos obrigatórios, rotas públicas isoladas, soft delete/restore e geração automatizada de contratos OpenAPI/Client TypeScript). A camada de múltiplos provedores de identidade (Google OAuth e login por e-mail/senha) foi temporariamente abstraída por meio de um contexto de usuário fixado no backend.

Justificativa: Essa escolha estratégica garantiu a entrega de um software 100% funcional, estável e testável em seus fluxos críticos de ponta a ponta, evitando componentes de autenticação parciais ou inseguros decorrentes de limitações temporais do escopo.