# World Film — Spec de Testes Manuais

**Versão:** 1.0  
**Data:** Maio de 2026  
**Ambiente:** Desenvolvimento local (backend `http://localhost:3001`, web `http://localhost:5173`)

> **Legenda:**  
> ✅ Passou &nbsp;|&nbsp; ❌ Falhou &nbsp;|&nbsp; ⚠️ Comportamento inesperado &nbsp;|&nbsp; ⬜ Não testado

---

## Índice

1. [Cadastro de vendedor](#1-cadastro-de-vendedor)
2. [Aprovação de vendedor (admin)](#2-aprovação-de-vendedor-admin)
3. [Login](#3-login)
4. [Cadastro de campanha (admin)](#4-cadastro-de-campanha-admin)
5. [Registrar venda (vendedor)](#5-registrar-venda-vendedor)
6. [Validação de venda (admin)](#6-validação-de-venda-admin)
7. [Solicitação de pagamento (vendedor)](#7-solicitação-de-pagamento-vendedor)
8. [Pagamento de prêmio (admin)](#8-pagamento-de-prêmio-admin)
9. [Recuperação de senha](#9-recuperação-de-senha)

---

## 1. Cadastro de vendedor

**Pré-condição:** pelo menos 1 distribuidor ativo cadastrado no sistema.

### TC-001 — Cadastro com dados válidos

| #   | Ação                                                  | Resultado esperado                                                     | Status |
| --- | ----------------------------------------------------- | ---------------------------------------------------------------------- | ------ |
| 1   | Abrir o app / web e acessar "Criar conta"             | Tela de cadastro exibida                                               | ⬜     |
| 2   | Preencher nome: `João da Silva Santos`                | Campo aceita, sem erro                                                 | ⬜     |
| 3   | Preencher CPF válido: `123.456.789-09`                | Campo aceita após validação de dígito                                  | ⬜     |
| 4   | Preencher chave PIX (e-mail válido): `joao@email.com` | Campo aceita                                                           | ⬜     |
| 5   | Preencher WhatsApp: `+55 11 91234-5678`               | Campo aceita                                                           | ⬜     |
| 6   | Selecionar um distribuidor da lista                   | Distribuidor selecionado                                               | ⬜     |
| 7   | Marcar aceite dos termos de uso                       | Checkbox marcado                                                       | ⬜     |
| 8   | Submeter o formulário                                 | Cadastro criado com status `PENDENTE`, mensagem de confirmação exibida | ⬜     |

### TC-002 — Cadastro com CPF inválido

| #   | Ação                            | Resultado esperado                                                  | Status |
| --- | ------------------------------- | ------------------------------------------------------------------- | ------ |
| 1   | Preencher CPF: `111.111.111-11` | Mensagem de erro "CPF inválido" exibida, formulário não é submetido | ⬜     |

### TC-003 — Cadastro com CPF já existente

| #   | Ação                                                      | Resultado esperado                                 | Status |
| --- | --------------------------------------------------------- | -------------------------------------------------- | ------ |
| 1   | Tentar cadastrar usando o CPF de um vendedor já existente | API retorna erro 409, mensagem "CPF já cadastrado" | ⬜     |

### TC-004 — Campos obrigatórios vazios

| #   | Ação                                                    | Resultado esperado                                              | Status |
| --- | ------------------------------------------------------- | --------------------------------------------------------------- | ------ |
| 1   | Submeter o formulário com campos obrigatórios em branco | Validação inline destaca cada campo faltante, sem chamada à API | ⬜     |

### TC-005 — Nome com menos de 3 palavras

| #   | Ação                                      | Resultado esperado                                   | Status |
| --- | ----------------------------------------- | ---------------------------------------------------- | ------ |
| 1   | Preencher nome: `João Silva` (2 palavras) | Mensagem "Informe nome completo (mínimo 3 palavras)" | ⬜     |

---

## 2. Aprovação de vendedor (admin)

**Pré-condição:** vendedor cadastrado com status `PENDENTE` (TC-001 concluído).

### TC-010 — Visualizar fila de aprovação

| #   | Ação                                            | Resultado esperado                                                  | Status |
| --- | ----------------------------------------------- | ------------------------------------------------------------------- | ------ |
| 1   | Fazer login como admin no painel web            | Dashboard admin carregado                                           | ⬜     |
| 2   | Navegar até "Vendedores > Aprovações pendentes" | Vendedor cadastrado no TC-001 aparece na fila                       | ⬜     |
| 3   | Abrir o detalhe do vendedor                     | Nome, CPF, distribuidor, chave PIX e WhatsApp exibidos corretamente | ⬜     |

### TC-011 — Aprovar vendedor

| #   | Ação                                                    | Resultado esperado                                              | Status |
| --- | ------------------------------------------------------- | --------------------------------------------------------------- | ------ |
| 1   | Clicar em "Aprovar" no detalhe do vendedor              | Confirmação solicitada                                          | ⬜     |
| 2   | Confirmar a aprovação                                   | Status muda para `APROVADO`, vendedor some da fila de pendentes | ⬜     |
| 3   | _(Verificar no banco)_ `vendedores.status = 'aprovado'` | Campo atualizado                                                | ⬜     |

### TC-012 — Reprovar vendedor com motivo

| #   | Ação                                                             | Resultado esperado                                            | Status |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| 1   | Clicar em "Reprovar" em um vendedor pendente                     | Modal/campo de motivo exibido                                 | ⬜     |
| 2   | Tentar reprovar sem preencher o motivo                           | Botão de confirmação desabilitado ou erro de validação        | ⬜     |
| 3   | Preencher motivo: `Dados incorretos. Verificar CPF.` e confirmar | Status muda para `REPROVADO`, campo `motivo_reprovacao` salvo | ⬜     |
| 4   | Reabrir o perfil do vendedor                                     | Motivo de reprovação visível para o admin                     | ⬜     |

### TC-013 — Reenvio após reprovação (fluxo do vendedor)

| #   | Ação                                           | Resultado esperado                                                | Status |
| --- | ---------------------------------------------- | ----------------------------------------------------------------- | ------ |
| 1   | Vendedor reprovado tenta fazer login           | Acesso bloqueado, exibe motivo da reprovação                      | ⬜     |
| 2   | Vendedor corrige os dados e reenvia o cadastro | Status volta para `PENDENTE`, contador de tentativas incrementado | ⬜     |
| 3   | Reprovar 3 vezes o mesmo vendedor              | Status muda para `BLOQUEADO` após 3ª reprovação                   | ⬜     |

---

## 3. Login

**Pré-condição:** vendedor com status `APROVADO` e admin ativo cadastrados.

### TC-020 — Login de vendedor com credenciais válidas

| #   | Ação                                                             | Resultado esperado                                    | Status |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------- | ------ |
| 1   | Acessar tela de login e inserir CPF + senha corretos do vendedor | Login bem-sucedido, redireciona para Home do app      | ⬜     |
| 2   | Verificar se access token e refresh token são retornados         | Tokens presentes na resposta / armazenados localmente | ⬜     |

### TC-021 — Login de admin com credenciais válidas

| #   | Ação                                                          | Resultado esperado                                     | Status |
| --- | ------------------------------------------------------------- | ------------------------------------------------------ | ------ |
| 1   | Acessar painel web e inserir e-mail + senha corretos do admin | Login bem-sucedido, redireciona para o Dashboard admin | ⬜     |

### TC-022 — Login com senha incorreta

| #   | Ação                               | Resultado esperado                                                              | Status |
| --- | ---------------------------------- | ------------------------------------------------------------------------------- | ------ |
| 1   | Inserir CPF correto e senha errada | API retorna 401, mensagem "Credenciais inválidas" — sem revelar se o CPF existe | ⬜     |

### TC-023 — Login com vendedor pendente / reprovado

| #   | Ação                                         | Resultado esperado                                               | Status |
| --- | -------------------------------------------- | ---------------------------------------------------------------- | ------ |
| 1   | Tentar login com vendedor status `PENDENTE`  | Acesso negado, mensagem indicando que o cadastro está em análise | ⬜     |
| 2   | Tentar login com vendedor status `REPROVADO` | Acesso negado, motivo de reprovação exibido                      | ⬜     |
| 3   | Tentar login com vendedor status `BLOQUEADO` | Acesso negado, mensagem para contatar o distribuidor             | ⬜     |

### TC-024 — Refresh token

| #   | Ação                                                       | Resultado esperado                                                  | Status |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------- | ------ |
| 1   | Com access token expirado, realizar requisição autenticada | Sistema usa o refresh token automaticamente e renova o access token | ⬜     |
| 2   | Com refresh token expirado, realizar requisição            | Usuário redirecionado para o login                                  | ⬜     |

### TC-025 — Logout

| #   | Ação                                            | Resultado esperado                                   | Status |
| --- | ----------------------------------------------- | ---------------------------------------------------- | ------ |
| 1   | Clicar em "Sair"                                | Tokens invalidados, redirecionado para tela de login | ⬜     |
| 2   | Tentar usar o access token anterior após logout | API retorna 401                                      | ⬜     |

---

## 4. Cadastro de campanha (admin)

**Pré-condição:** admin logado, ao menos 2 produtos cadastrados no sistema.

### TC-030 — Criar campanha com dados válidos

| #   | Ação                                                                               | Resultado esperado                                         | Status |
| --- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------ |
| 1   | Navegar até "Campanhas > Nova campanha"                                            | Formulário de criação exibido                              | ⬜     |
| 2   | Preencher nome: `Campanha Teste Maio`                                              | Campo aceita                                               | ⬜     |
| 3   | Selecionar tipo: `Lançamento`                                                      | Tipo selecionado                                           | ⬜     |
| 4   | Definir data início: hoje, data fim: 30 dias à frente                              | Datas aceitas                                              | ⬜     |
| 5   | Adicionar produto `Insuline Green` com metragem de corte `30m` e prêmio `R$ 15,00` | Linha adicionada à tabela de prêmios                       | ⬜     |
| 6   | Adicionar produto `HP Line` com metragem `30m` e prêmio `R$ 15,00`                 | Segunda linha adicionada                                   | ⬜     |
| 7   | Selecionar segmentação: `Todos`                                                    | Segmentação definida                                       | ⬜     |
| 8   | Salvar como `Rascunho`                                                             | Campanha criada com status `RASCUNHO`, aparece na listagem | ⬜     |

### TC-031 — Publicar campanha (Rascunho → Ativa)

| #   | Ação                                            | Resultado esperado                                                  | Status |
| --- | ----------------------------------------------- | ------------------------------------------------------------------- | ------ |
| 1   | Abrir a campanha em rascunho criada no TC-030   | Detalhe da campanha exibido                                         | ⬜     |
| 2   | Clicar em "Ativar campanha"                     | Status muda para `ATIVA`                                            | ⬜     |
| 3   | No app do vendedor, acessar "Campanhas"         | Campanha aparece na listagem de ativas com nome e vigência corretos | ⬜     |
| 4   | No app do vendedor, abrir o detalhe da campanha | Tabela de prêmios com Insuline Green e HP Line exibida corretamente | ⬜     |

### TC-032 — Criar campanha sem produtos

| #   | Ação                                                      | Resultado esperado                                          | Status |
| --- | --------------------------------------------------------- | ----------------------------------------------------------- | ------ |
| 1   | Preencher todos os campos exceto produtos e tentar salvar | Erro de validação "Adicione ao menos um produto à campanha" | ⬜     |

### TC-033 — Criar campanha com data fim anterior à data início

| #   | Ação                                                    | Resultado esperado                               | Status |
| --- | ------------------------------------------------------- | ------------------------------------------------ | ------ |
| 1   | Definir data fim anterior à data início e tentar salvar | Erro "Data fim deve ser posterior à data início" | ⬜     |

### TC-034 — Encerrar campanha

| #   | Ação                                                | Resultado esperado                                               | Status |
| --- | --------------------------------------------------- | ---------------------------------------------------------------- | ------ |
| 1   | Encerrar a campanha ativa do TC-031                 | Status muda para `ENCERRADA`                                     | ⬜     |
| 2   | No app do vendedor, verificar listagem de campanhas | Campanha aparece somente no filtro "Encerradas", não em "Ativas" | ⬜     |

---

## 5. Registrar venda (vendedor)

**Pré-condição:** vendedor aprovado e logado, campanha `ATIVA` com produtos cadastrados.

### TC-040 — Registrar venda com dados válidos

| #   | Ação                                                | Resultado esperado                                      | Status |
| --- | --------------------------------------------------- | ------------------------------------------------------- | ------ |
| 1   | Acessar "Registrar venda"                           | Wizard na Etapa 1 (selecionar campanha)                 | ⬜     |
| 2   | Selecionar a campanha ativa do TC-031               | Avança para Etapa 2                                     | ⬜     |
| 3   | Selecionar produto `Insuline Green`, informar `60m` | Prévia do prêmio exibe `R$ 30,00` (2 × R$ 15,00)        | ⬜     |
| 4   | Avançar para Etapa 3 — informar placa `ABC-1234`    | Campo aceita                                            | ⬜     |
| 5   | Avançar para Etapa 4 — revisar resumo               | Produto, metragem e prêmio estimado corretos            | ⬜     |
| 6   | Confirmar e registrar                               | Venda criada com status `PENDENTE`, confirmação exibida | ⬜     |
| 7   | Verificar "Últimas vendas" na Home                  | Nova venda aparece com status `PENDENTE`                | ⬜     |

### TC-041 — Cálculo de prêmio por metragem (regra de múltiplos)

| Metragem informada | Prêmio esperado (Insuline Green, corte 30m = R$ 15,00) | Status |
| ------------------ | ------------------------------------------------------ | ------ |
| 29m                | R$ 0,00 (não atinge o corte)                           | ⬜     |
| 30m                | R$ 15,00 (1 faixa)                                     | ⬜     |
| 45m                | R$ 15,00 (1 faixa — 45 ÷ 30 = 1)                       | ⬜     |
| 60m                | R$ 30,00 (2 faixas)                                    | ⬜     |
| 90m                | R$ 45,00 (3 faixas)                                    | ⬜     |

### TC-042 — Registrar venda sem placa (película automotiva)

| #   | Ação                                                              | Resultado esperado                       | Status |
| --- | ----------------------------------------------------------------- | ---------------------------------------- | ------ |
| 1   | Selecionar produto de película automotiva e não preencher a placa | Erro de validação na Etapa 3, não avança | ⬜     |

### TC-043 — Registrar venda em campanha encerrada

| #   | Ação                                                      | Resultado esperado                        | Status |
| --- | --------------------------------------------------------- | ----------------------------------------- | ------ |
| 1   | Tentar registrar venda em campanha com status `ENCERRADA` | Campanha não aparece na seleção (Etapa 1) | ⬜     |

---

## 6. Validação de venda (admin)

**Pré-condição:** venda registrada com status `PENDENTE` (TC-040 concluído).

### TC-050 — Aprovar venda

| #   | Ação                                           | Resultado esperado                                                           | Status |
| --- | ---------------------------------------------- | ---------------------------------------------------------------------------- | ------ |
| 1   | Admin navega para "Vendas > Fila de validação" | Venda do TC-040 aparece na lista                                             | ⬜     |
| 2   | Abrir o detalhe da venda                       | Vendedor, produto, metragem e prêmio estimado exibidos corretamente          | ⬜     |
| 3   | Clicar em "Aprovar"                            | Status muda para `APROVADA`, prêmio creditado no saldo bloqueado do vendedor | ⬜     |
| 4   | No app do vendedor, verificar "Financeiro"     | Saldo bloqueado incrementado com o valor do prêmio                           | ⬜     |

### TC-051 — Aprovar venda com ajuste de metragem

| #   | Ação                                                      | Resultado esperado                                                | Status |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------- | ------ |
| 1   | Abrir uma venda pendente e clicar em "Aprovar com ajuste" | Campo de metragem editável                                        | ⬜     |
| 2   | Alterar metragem de `60m` para `30m` e confirmar          | Prêmio recalculado para `R$ 15,00`, venda aprovada com novo valor | ⬜     |
| 3   | Verificar saldo do vendedor                               | Reflete o valor ajustado, não o estimado original                 | ⬜     |

### TC-052 — Reprovar venda com motivo

| #   | Ação                                       | Resultado esperado                                   | Status |
| --- | ------------------------------------------ | ---------------------------------------------------- | ------ |
| 1   | Clicar em "Reprovar" em uma venda pendente | Campo de motivo exibido                              | ⬜     |
| 2   | Confirmar sem motivo                       | Bloqueado — motivo obrigatório                       | ⬜     |
| 3   | Preencher motivo e confirmar               | Status → `REPROVADA`, saldo do vendedor não alterado | ⬜     |

### TC-053 — Exportar planilha de vendas

| #   | Ação                                                | Resultado esperado                                                                                  | Status |
| --- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| 1   | Na fila de validação, clicar em "Exportar"          | Download de arquivo `.xlsx` iniciado                                                                | ⬜     |
| 2   | Abrir o arquivo                                     | Colunas: ID, data, distribuidor, vendedor, CPF, campanha, produto, metragem, prêmio, status, motivo | ⬜     |
| 3   | Aplicar filtro "por Distribuidor" antes de exportar | Arquivo contém apenas vendas do distribuidor selecionado                                            | ⬜     |

---

## 7. Solicitação de pagamento (vendedor)

**Pré-condição:** vendedor com saldo disponível ≥ R$ 20,00 (venda aprovada e carência encerrada).

### TC-060 — Solicitar pagamento com saldo suficiente

| #   | Ação                            | Resultado esperado                                                       | Status |
| --- | ------------------------------- | ------------------------------------------------------------------------ | ------ |
| 1   | Acessar "Financeiro"            | Saldo disponível exibido corretamente                                    | ⬜     |
| 2   | Clicar em "Solicitar pagamento" | Confirmação da chave PIX exibida                                         | ⬜     |
| 3   | Confirmar a solicitação         | Solicitação criada com status `SOLICITADO`, saldo bloqueado para o saque | ⬜     |

### TC-061 — Solicitar pagamento abaixo do mínimo

| #   | Ação                                               | Resultado esperado                                                  | Status |
| --- | -------------------------------------------------- | ------------------------------------------------------------------- | ------ |
| 1   | Com saldo disponível de R$ 15,00, tentar solicitar | Botão desabilitado ou mensagem "Saldo mínimo para saque é R$ 20,00" | ⬜     |

### TC-062 — Verificar extrato após solicitação

| #   | Ação              | Resultado esperado                                     | Status |
| --- | ----------------- | ------------------------------------------------------ | ------ |
| 1   | Acessar "Extrato" | Nova entrada de débito com status `SOLICITADO` visível | ⬜     |

---

## 8. Pagamento de prêmio (admin)

**Pré-condição:** solicitação de pagamento com status `SOLICITADO` criada no TC-060.

### TC-070 — Marcar solicitação como "Em processamento"

| #   | Ação                                                    | Resultado esperado                                           | Status |
| --- | ------------------------------------------------------- | ------------------------------------------------------------ | ------ |
| 1   | Admin navega para "Financeiro > Solicitações pendentes" | Solicitação do TC-060 aparece na lista com chave PIX e valor | ⬜     |
| 2   | Clicar em "Processar"                                   | Status muda para `EM_PROCESSAMENTO`                          | ⬜     |

### TC-071 — Registrar pagamento com comprovante

| #   | Ação                                             | Resultado esperado                             | Status |
| --- | ------------------------------------------------ | ---------------------------------------------- | ------ |
| 1   | Clicar em "Marcar como pago" na solicitação      | Campo de upload de comprovante exibido         | ⬜     |
| 2   | Tentar confirmar sem anexar comprovante          | Bloqueado — comprovante obrigatório            | ⬜     |
| 3   | Anexar um arquivo `.jpg` válido e confirmar      | Status muda para `PAGO`, comprovante salvo     | ⬜     |
| 4   | No app do vendedor, verificar "Extrato"          | Transação aparece com status `PAGO`            | ⬜     |
| 5   | No app do vendedor, verificar "Saldo disponível" | Saldo descontado corretamente após o pagamento | ⬜     |

---

## 9. Recuperação de senha

### TC-080 — Solicitar recuperação de senha

| #   | Ação                                                        | Resultado esperado                                                         | Status |
| --- | ----------------------------------------------------------- | -------------------------------------------------------------------------- | ------ |
| 1   | Na tela de login, clicar em "Esqueci minha senha"           | Tela de recuperação exibida                                                | ⬜     |
| 2   | Informar CPF (vendedor) ou e-mail (admin) válido e submeter | Mensagem genérica de confirmação exibida (não revela se o cadastro existe) | ⬜     |

### TC-081 — Redefinir senha com token válido

| #   | Ação                                   | Resultado esperado                         | Status |
| --- | -------------------------------------- | ------------------------------------------ | ------ |
| 1   | Acessar o link de redefinição recebido | Formulário de nova senha exibido           | ⬜     |
| 2   | Informar nova senha e confirmação      | Senha atualizada, redirecionado para login | ⬜     |
| 3   | Fazer login com a nova senha           | Login bem-sucedido                         | ⬜     |

### TC-082 — Redefinir senha com token expirado/inválido

| #   | Ação                                                    | Resultado esperado                                                 | Status |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------ | ------ |
| 1   | Acessar um link de recuperação já utilizado ou expirado | Mensagem "Link inválido ou expirado", opção de solicitar novo link | ⬜     |
