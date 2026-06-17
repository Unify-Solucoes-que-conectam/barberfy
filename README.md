# Barberfy 💈

Barberfy é uma aplicação web modernizada e responsiva para gestão e agendamento de barbearias (Whitelabel). Desenvolvido com tecnologias modernas e focado em alta performance e excelente experiência do usuário.

---

## 🚀 Como Iniciar o Projeto

Siga os passos abaixo para configurar e rodar o projeto localmente em sua máquina.

### 📋 Pré-requisitos

Para rodar este projeto, você precisará ter o **[Bun](https://bun.sh/)** instalado em sua máquina. O Bun é um toolkit Javascript rápido e completo (gerenciador de pacotes, executor de tarefas e muito mais).

Caso ainda não tenha o Bun instalado:
- **Windows (PowerShell):**
  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
- **macOS & Linux:**
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

---

### 🛠️ Passo a Passo para Execução

#### 1. Configurar as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do diretório `barberfy` com base no arquivo de exemplo `.env.example`:

```bash
cp .env.example .env
```

Abra o arquivo `.env` recém-criado e configure as variáveis de ambiente necessárias:

```env
# URL da API do backend
VITE_API_URL='http://localhost:8000/api'
# Modo do aplicativo (ex: client, admin, etc)
VITE_APP_MODE='client'
# ID da barbearia (UUID) cadastrada no backend
VITE_BARBERSHOP_ID='uuid-da-barbearia'

# Configurações do Reverb (Websockets/Real-time)
VITE_REVERB_APP_KEY="sua_chave_reverb"
VITE_REVERB_HOST="localhost"
VITE_REVERB_PORT="8080"
VITE_REVERB_SCHEME="http"
```

#### 2. Instalar as Dependências

Com o Bun instalado, execute o comando abaixo para baixar todas as dependências necessárias do projeto:

```bash
bun install
```

#### 3. Rodar o Servidor de Desenvolvimento

Para iniciar o servidor local com hot reload, execute:

```bash
bun run dev
```

Após rodar o comando, o terminal exibirá a URL local (`http://localhost:3000`) para acessar o aplicativo no navegador.

---

## 🛠️ Outros Scripts Disponíveis

No arquivo `package.json`, você também encontrará outros comandos úteis:

*   **Construir para produção:**
    ```bash
    bun run build
    ```
*   **Análise estática de código (Lint):**
    ```bash
    bun run lint
    ```
*   **Formatação automática do código:**
    ```bash
    bun run format
    ```
*   **Visualizar a build de produção localmente:**
    ```bash
    bun run preview
    ```

---

## 🧰 Tecnologias Utilizadas

- **React 19**
- **Vite** (Build tool rápida)
- **Tailwind CSS v4** (Estilização moderna)
- **Framer Motion** (Animações fluidas)
- **TypeScript** (Tipagem estática)
- **Radix UI** (Componentes acessíveis e sem estilo)
- **React Router 7** (Roteamento de páginas)
- **Zod & React Hook Form** (Validação e manipulação de formulários de forma robusta)
