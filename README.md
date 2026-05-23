# World Film — App de Premiação de Vendas

Sistema de premiação para vendedores da World Film, composto por:

- **backend** — API REST (Node.js + Express + TypeScript + MySQL)
- **web** — Painel admin (React + Vite + TypeScript)
- **mobile** — App do vendedor (React Native + TypeScript)
- **shared** — Tipos TypeScript compartilhados entre os pacotes

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
