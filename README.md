# World Film — App de Premiação de Vendas

Sistema de premiação para vendedores da World Film, composto por:

- **backend** — API REST (Node.js + Express + TypeScript + MySQL)
- **web** — Painel admin (React + Vite + TypeScript)
- **mobile** — App do vendedor (React Native + TypeScript)
- **shared** — Tipos TypeScript compartilhados entre os pacotes

---

## 🚀 Quick Start — do zero ao ar

Guia completo para subir o projeto pela primeira vez em uma máquina local.

### 1. Instale as dependências do sistema

- [Node.js 20+](https://nodejs.org/) (inclui `npm`)
- [MySQL 8+](https://dev.mysql.com/downloads/) rodando localmente

Verifique:

```bash
node -v   # >= 20
npm -v    # >= 10
mysql --version
```

### 2. Clone o repositório

```bash
git clone https://github.com/seu-org/worldfilm-premios.git
cd worldfilm-premios
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e ajuste os valores abaixo para a sua máquina:

| Variável                        | Descrição                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`                  | Connection string do MySQL (ex: `mysql://root:senha@localhost:3306/worldfilm_dev`) |
| `JWT_SECRET`                    | String aleatória longa (mín. 64 chars)                                             |
| `JWT_REFRESH_SECRET`            | String aleatória longa diferente da anterior                                       |
| `PORT`                          | Porta da API (padrão `3001`)                                                       |
| `VITE_API_URL`                  | URL da API para o frontend (padrão `http://localhost:3001`)                        |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Caminho para o JSON do Firebase Admin (opcional em dev)                            |

### 4. Crie o banco de dados

```bash
mysql -u root -p -e "CREATE DATABASE worldfilm_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 5. Instale todas as dependências do monorepo

```bash
npm install
```

### 6. Compile o pacote shared

```bash
npm run build:shared
```

### 7. Rode as migrations e seeds

```bash
npm run migrate   # cria as tabelas
npm run seed      # popula dados iniciais de desenvolvimento
```

### 8. Inicie os servidores em desenvolvimento

Em dois terminais separados:

```bash
# Terminal 1 — API
npm run dev:backend
# → http://localhost:3001

# Terminal 2 — Painel web
npm run dev:web
# → http://localhost:5173
```

Pronto. Acesse [http://localhost:5173](http://localhost:5173) no navegador.

---

## Pré-requisitos

- [Node.js 20+](https://nodejs.org/)
- [npm 10+](https://www.npmjs.com/)
- [MySQL 8+](https://dev.mysql.com/downloads/)
- [React Native CLI](https://reactnative.dev/docs/environment-setup) (para mobile)
- Xcode (iOS) ou Android Studio (Android)

---

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-org/worldfilm-premios.git
cd worldfilm-premios
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com suas credenciais locais
```

### 3. Instale todas as dependências do monorepo

```bash
npm install
```

### 4. Configure o banco de dados

```bash
# Crie o banco no MySQL
mysql -u root -p -e "CREATE DATABASE worldfilm_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Rode as migrations
npm run migrate

# Popule com dados de desenvolvimento
npm run seed
```

---

## Rodando em desenvolvimento

### Backend

```bash
npm run dev:backend
# Disponível em http://localhost:3001
```

### Web (painel admin)

```bash
npm run dev:web
# Disponível em http://localhost:5173
```

### Mobile

```bash
# iOS
cd mobile && npx react-native run-ios

# Android
cd mobile && npx react-native run-android
```

---

## Build para produção

```bash
# Backend
npm run build:backend

# Web
npm run build:web
```

---

## Estrutura do projeto

```
worldfilm-premios/
├── backend/          # API Node.js + Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
│
├── web/              # Painel React (admin)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/           # App React Native
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
│
├── shared/           # Tipos TypeScript compartilhados
│   ├── src/
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
│
├── .env.example
├── .gitignore
├── package.json      # Raiz do monorepo (workspaces)
└── README.md
```

---

## Setup em VPS limpa (Ubuntu 22.04)

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# MySQL 8
sudo apt-get install -y mysql-server
sudo mysql_secure_installation

# Nginx
sudo apt-get install -y nginx

# PM2
npm install -g pm2

# Certbot (SSL)
sudo apt-get install -y certbot python3-certbot-nginx

# Clone do projeto
git clone https://github.com/seu-org/worldfilm-premios.git /var/www/worldfilm
cd /var/www/worldfilm

# Instalar dependências e buildar
npm install
npm run build:backend
npm run build:web

# Migrations e seeds
npm run migrate
npm run seed

# Iniciar com PM2
pm2 start backend/ecosystem.config.js
pm2 save
pm2 startup
```
