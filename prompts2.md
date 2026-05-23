# World Film — Prompts2: Acesso Cruzado
## Vendedor no Web + Admin no Mobile

**Baseado em:** `spec.md` v1.3 + `prompts.md` (fases 1–6 concluídas)  
**Pré-requisito:** Todas as fases 1–6 do `prompts.md` concluídas com sucesso.  
**Stack:** React Native · React · Node.js · MySQL  

> Executar na ordem. Cada prompt assume que o anterior foi concluído com sucesso.  
> Marcar com ✅ ao concluir cada um.

---

## FASE A — Web: área do vendedor

### A.1 Roteamento dual (admin × vendedor) no web

```
No projeto /web, refatore o sistema de rotas para suportar dois perfis distintos com layouts separados:

Estrutura de rotas:
- /login → detecta o role do token e redireciona para a área correta
- /admin/* → layout atual (sidebar + header de admin), acessível apenas por role = 'admin'
- /vendedor/* → novo layout para vendedor (header + bottom nav), acessível apenas por role = 'vendedor'
- / → redireciona para /admin/dashboard ou /vendedor/home conforme role

Mudanças necessárias:
1. Em src/App.tsx, crie dois grupos de rotas com PrivateRoute por role
2. Crie o componente AdminLayout (extrai do atual App.tsx)
3. Crie o componente VendedorLayout:
   - Header fixo: logo World Film + nome do vendedor + ícone de sino com badge
   - Navegação inferior com 4 abas: Home, Campanhas, Financeiro, Perfil
   - Área de conteúdo centralizada (max-width: 480px) para simular visual mobile
4. O serviço de autenticação já existe — ajuste apenas para ler o campo 'role' do JWT e redirecionar corretamente após login

Não altere nenhuma rota /admin existente. Apenas adicione as novas.
```

### A.2 Login do vendedor no web

```
No projeto /web, adapte a tela de login (/login) para suportar tanto admin quanto vendedor:

Comportamento atual: formulário de e-mail + senha → chama POST /auth/admin/login

Novo comportamento:
- Adicione toggle "Sou vendedor" abaixo do formulário
- Quando toggle ativo:
  - Troca campo e-mail por campo CPF com máscara (000.000.000-00)
  - Chama POST /auth/vendedor/login em vez de /auth/admin/login
  - Em erro 403 com status pendente/reprovado: exibe mensagem específica (não redireciona)
- Quando toggle inativo: comportamento atual (e-mail, admin)
- Após login bem-sucedido: redireciona conforme role ('admin' → /admin/dashboard, 'vendedor' → /vendedor/home)

Adicione também link "Cadastrar-se" visível apenas quando toggle de vendedor estiver ativo.
Link de recuperação de senha apenas para vendedores (chama POST /auth/vendedor/recover).

Mantenha a tela de login com visual atual (preto e vermelho).
```

### A.3 Cadastro do vendedor no web

```
No projeto /web, crie a tela de cadastro do vendedor em /cadastro (fora do VendedorLayout, sem autenticação):

Wizard de 3 passos com barra de progresso visual:

Passo 1 — Dados pessoais:
- Nome completo (mínimo 3 palavras)
- CPF com máscara e validação de dígitos verificadores
- CNPJ com máscara (opcional, valida se preenchido)
- WhatsApp com máscara +55 (DDD) 9XXXX-XXXX

Passo 2 — Acesso:
- Senha (mínimo 8 caracteres, 1 número, 1 maiúscula)
- Confirmar senha
- E-mail (opcional)

Passo 3 — Vinculação:
- Busca e seleção de distribuidor (GET /distribuidores/lista-publica — crie essa rota no backend se não existir, retorna apenas id + razao_social dos ativos)
- Chave PIX (CPF, e-mail, telefone ou chave aleatória)
- Checkbox de aceite dos termos de uso

Após submissão (POST /auth/vendedor/register):
- Exibe tela de confirmação: "Cadastro enviado! Aguarde a aprovação da World Film."
- Botão "Voltar para login"

Validação em tempo real com Zod em cada campo.
```

### A.4 Home do vendedor (web)

```
No projeto /web, crie a tela /vendedor/home:

Layout de cima para baixo (coluna única, max-width 480px centralizado):

1. Card de saldo (fundo preto, texto branco):
   - "Disponível para saque" em R$ grande
   - "Bloqueado: R$ X,XX" menor abaixo
   - Botão "Solicitar pagamento" em vermelho (desabilitado se saldo < R$ 20,00)
   Dados de: GET /financeiro/saldo

2. Resumo do mês (3 cards horizontais):
   - Vendas registradas no mês
   - Prêmio acumulado no mês
   - Posição no ranking do distribuidor
   Dados de: GET /vendedor/resumo-mes (crie esse endpoint se não existir, retorna os 3 valores)

3. Campanhas ativas (carrossel horizontal com scroll):
   - Card por campanha: nome, prazo restante em dias, prêmio máximo do produto mais premiado
   - Link "Ver todas" no canto direito
   Dados de: GET /campanhas

4. Últimas vendas (lista vertical, máx 3):
   - Produto, data formatada (DD/MM/YYYY), metragem, badge de status colorido
   - Link "Ver todas" no rodapé
   Dados de: GET /vendas?limit=3

Pull-to-refresh: botão de atualizar no header (ícone de reload).
Skeleton loader durante carregamento inicial (use shadcn/ui Skeleton).
```

### A.5 Campanhas do vendedor (web)

```
No projeto /web, crie as telas de campanhas do vendedor:

/vendedor/campanhas — lista:
- SearchBar para busca por nome
- Chips de filtro: Todas / Ativas / Encerradas
- Cards por campanha:
  - Nome, tipo (badge)
  - Vigência com countdown ("Encerra em X dias" ou "Encerrada")
  - Prêmio máximo do produto mais premiado da campanha
  - Indicador do desempenho do próprio vendedor: "Você já ganhou R$ X,XX"
- Estado vazio com mensagem motivacional se não houver campanhas
Dados de: GET /campanhas

/vendedor/campanhas/:id — detalhe:
- Nome, descrição, datas (início e fim)
- Countdown "Encerra em X dias" (ou encerrada)
- Tabela de prêmios por produto: colunas Produto | A cada Xm | Prêmio
- Card "Meu desempenho": total de vendas e prêmio acumulado nessa campanha
- Botão "Registrar venda" destacado em vermelho → navega para /vendedor/venda/nova?campanha_id=X
Dados de: GET /campanhas/:id
```

### A.6 Registrar venda (web)

```
No projeto /web, crie o wizard de registro de venda em /vendedor/venda/nova:

Wizard de 4 etapas com barra de progresso:

Etapa 1 — Campanha:
- Lista de campanhas ativas em cards selecionáveis
- Se receber query param ?campanha_id=X, pré-selecionar e avançar automaticamente

Etapa 2 — Produto e metragem:
- Lista de produtos da campanha selecionada (cards selecionáveis)
- Campo de metragem numérico com teclado numérico (apenas inteiros positivos)
- Preview em tempo real: "Prêmio estimado: R$ X,XX" calculado localmente
  Fórmula: floor(metragem / metragem_corte) × valor_premio
- Exibir regra: "A cada Xm de [produto] = R$ X,XX"

Etapa 3 — Dados do cliente:
- Nome do cliente (opcional exceto políticas internas)
- CPF/CNPJ com máscara (opcional)
- Placa do veículo com máscara AAA-0000 ou AAA0A00 Mercosul (obrigatório para categoria 'pelicula')

Etapa 4 — Confirmação:
- Resumo completo: campanha, produto, metragem, cliente, placa
- Prêmio estimado em destaque (fundo verde claro)
- Aviso: "Será confirmado em até 3 dias úteis"
- Botão "Confirmar e registrar"

Após POST /vendas com sucesso:
- Tela de sucesso: "Venda registrada com sucesso! Prêmio estimado: R$ X,XX"
- Botões: "Ver minhas vendas" e "Registrar outra venda"

Em erro 409 (duplicidade): exibir alerta específico com o motivo.
```

### A.7 Financeiro do vendedor (web)

```
No projeto /web, crie a tela /vendedor/financeiro:

1. Card de saldo completo (fundo preto):
   - Disponível: R$ X,XX (destaque)
   - Bloqueado: R$ X,XX (tooltip: "Será liberado em breve")
   - Total acumulado histórico

2. Botão "Solicitar pagamento" (vermelho, desabilitado se saldo < R$ 20,00):
   - Abre Dialog (modal shadcn/ui):
     - Exibe chave PIX cadastrada
     - Campo de valor (mínimo R$ 20,00, máximo = saldo disponível)
     - Botão confirmar com aviso "Prazo: até 3 dias úteis"
     - Chama POST /financeiro/solicitar
     - Após sucesso: fecha modal, exibe toast de confirmação

3. Extrato (lista paginada abaixo do card):
   - Tabs: Todos | Créditos | Saques
   - Item: data (DD/MM/YYYY), descrição (produto + campanha para créditos, "Saque" para débitos), valor (+R$ verde / -R$ vermelho), badge de status
   - Ao clicar em transação do tipo 'saque' com status 'pago': abre Dialog com imagem/PDF do comprovante
   - Carregar mais: botão "Ver mais" (paginação manual)
Dados de: GET /financeiro/extrato + GET /financeiro/saldo
```

### A.8 Perfil e notificações do vendedor (web)

```
No projeto /web, crie as telas de perfil e notificações do vendedor:

/vendedor/perfil:
Seções em cards:

1. Header:
   - Avatar com iniciais do nome (círculo preto com letra branca)
   - Nome completo
   - Distribuidor vinculado
   - Badge de status (aprovado = verde)

2. Dados pessoais (formulário editável):
   - Nome, WhatsApp, Chave PIX — editáveis
   - CPF e CNPJ — somente leitura (exibir com máscara)
   - Botão "Salvar alterações" → PUT /vendedor/perfil
   - Formulário com React Hook Form + Zod

3. Alterar senha:
   - Senha atual, nova senha, confirmar nova senha
   - Botão "Alterar senha" → PUT /vendedor/senha

4. Botão "Sair" (vermelho) → logout e redireciona para /login

/vendedor/notificacoes (acessível pelo sino no header):
- Lista de notificações ordenadas por data (GET /notificacoes)
- Item não lido com fundo cinza claro e ponto azul à esquerda
- Clicar em item → marca como lida (PATCH /notificacoes/:id/lida)
- Botão "Marcar todas como lidas" no topo (PATCH /notificacoes/todas-lidas)
- Badge no ícone de sino: GET /notificacoes/nao-lidas/count (atualizar a cada 60 segundos)
- Estado vazio com ícone e texto "Nenhuma notificação"
```

### A.9 Lista de vendas do vendedor (web)

```
No projeto /web, crie a tela /vendedor/vendas:

Tabela de vendas do próprio vendedor (GET /vendas):
- Colunas: Data, Produto, Campanha, Metragem, Prêmio estimado, Status
- Filtros acima da tabela:
  - Status (select): Todos / Pendente / Aprovada / Reprovada
  - Campanha (select): lista das campanhas
  - Período: date range picker (data início e data fim)
- Badge colorido por status: pendente=amarelo, aprovada=verde, reprovada=vermelho, em_analise=azul
- Paginação no rodapé (10 por página)
- Ao clicar em uma linha: abre /vendedor/vendas/:id

/vendedor/vendas/:id — detalhe da venda:
- Todos os dados da venda
- Prêmio estimado e prêmio apurado (se já validado)
- Histórico de status com data e motivo (se reprovada)
- Botão "Voltar"
```

---

## FASE B — Mobile: área do admin

### B.1 Autenticação dual no mobile (admin × vendedor)

```
No projeto /mobile, refatore o sistema de autenticação para suportar dois roles: 'vendedor' e 'admin'.

Mudanças na inicialização (App.tsx ou navigation/index.tsx):
1. Ao verificar o token salvo, leia também o campo 'role' do payload JWT
2. Se role = 'vendedor' → AppStack atual (Bottom Tab Navigator do vendedor)
3. Se role = 'admin' → AdminStack (novo Bottom Tab Navigator do admin, implementado em B.2)
4. Se sem token → AuthStack atual

Mudanças na tela de Login:
- Adicione toggle "Acesso admin" (Switch) no topo da tela
- Quando admin ativo:
  - Campo CPF vira campo E-mail
  - Chama POST /auth/admin/login em vez de /auth/vendedor/login
  - Ao autenticar com sucesso: navega para AdminStack
- Quando vendedor ativo (padrão): comportamento atual

Não altere nenhuma tela existente do fluxo do vendedor.
```

### B.2 Navegação e layout admin (mobile)

```
No projeto /mobile, crie o AdminStack em src/navigation/AdminNavigator.tsx:

Bottom Tab Navigator com 5 abas:
- Dashboard (ícone: chart-bar)
- Vendedores (ícone: people)
- Vendas (ícone: clipboard-check)
- Financeiro (ícone: currency-dollar)
- Mais (ícone: menu) → Stack com: Distribuidores, Campanhas, Produtos, Notificações, Logout

Cada aba tem seu próprio Stack Navigator para suportar navegação interna (lista → detalhe).

Paleta de cores do admin no mobile: manter preto e vermelho World Film.
Header de cada tela: fundo preto, título branco, ícone de sino com badge (mesmo da tela do vendedor mas chamando /notificacoes/nao-lidas/count com token admin — crie essa rota no backend se necessário, reutilizando a mesma tabela de notificações mas filtrando por admin).

Crie o arquivo src/navigation/AdminNavigator.tsx com a estrutura completa (stacks vazios por enquanto, serão preenchidos nos prompts seguintes).
```

### B.3 Dashboard admin (mobile)

```
No projeto /mobile, crie a tela AdminDashboard em src/screens/admin/Dashboard.tsx:

Cards de resumo em grade 2×3 (ScrollView vertical):
- Vendedores ativos
- Pendentes de aprovação (em vermelho se > 0, navegável para lista)
- Vendas no mês
- Prêmios apurados no mês (R$)
- Total pago no mês (R$)
- Solicitações pendentes (em vermelho se > 0)

Dados de: GET /admin/dashboard/resumo (crie esse endpoint se não existir; deve retornar os 6 valores acima em um único request)

Lista de últimas 5 vendas aguardando validação:
- Item: nome do vendedor, produto, metragem, data
- Badge "há Xh" se > 48h (cor laranja)
- Tap → navega para detalhe da venda (AdminVendaDetalhe)
Dados de: GET /admin/vendas?status=pendente&limit=5&sort=created_at:asc

Pull-to-refresh com ActivityIndicator.
Skeleton loader no carregamento inicial.
```

### B.4 Gestão de vendedores (mobile)

```
No projeto /mobile, crie as telas de gestão de vendedores do admin:

AdminVendedoresList (src/screens/admin/VendedoresList.tsx):
- SearchBar para busca por nome/CPF
- Chips de filtro: Todos / Pendentes / Em análise / Aprovados / Reprovados / Bloqueados
- FlatList de vendedores (GET /admin/vendedores com paginação)
- Item: nome, distribuidor, status com badge colorido, data de cadastro
- Tap → AdminVendedorDetalhe

AdminVendedorDetalhe (src/screens/admin/VendedorDetalhe.tsx):
- Dados do vendedor: nome, CPF (mascarado), CNPJ, WhatsApp, chave PIX, distribuidor
- Card de saldo: disponível + bloqueado
- Status atual com badge colorido

Botões de ação (exibidos conforme status atual):
- "Aprovar" (verde) → PATCH /admin/vendedores/:id/aprovar → toast de sucesso + atualiza status
- "Reprovar" (vermelho) → abre BottomSheet com campo de motivo (obrigatório) → PATCH /admin/vendedores/:id/reprovar
- "Bloquear" → abre BottomSheet com campo de motivo → PATCH /admin/vendedores/:id/bloquear
- "Desbloquear" (se bloqueado) → PATCH /admin/vendedores/:id/desbloquear

Abas na parte inferior da tela (Tab View):
- "Vendas" → lista das últimas 10 vendas do vendedor (GET /admin/vendedores/:id com historico)
- "Extrato" → lista das últimas 10 transações
```

### B.5 Fila de validação de vendas (mobile)

```
No projeto /mobile, crie as telas de validação de vendas do admin:

AdminVendasList (src/screens/admin/VendasList.tsx):
- Chips de filtro: Pendentes / Em análise / Aprovadas / Reprovadas
- FlatList de vendas (GET /admin/vendas com paginação, padrão status=pendente)
- Item da lista:
  - Nome do vendedor + distribuidor
  - Produto + metragem
  - Prêmio estimado em destaque
  - Data + badge "há Xh" em laranja se pendente há > 48h
- Tap → AdminVendaDetalhe

AdminVendaDetalhe (src/screens/admin/VendaDetalhe.tsx):
- Todos os dados da venda
- Prêmio estimado destacado

3 botões de ação no rodapé:

1. "Aprovar" (verde):
   - Abre BottomSheet com campo opcional "Metragem ajustada" (número)
   - Exibe prévia do prêmio recalculado em tempo real conforme digita
   - Botão confirmar → PATCH /admin/vendas/:id/aprovar
   - Toast de sucesso + volta para lista

2. "Reprovar" (vermelho):
   - Abre BottomSheet com campo de motivo (obrigatório)
   - Botão confirmar → PATCH /admin/vendas/:id/reprovar

3. "Pedir revisão" (cinza):
   - Abre BottomSheet com campo de motivo (obrigatório)
   - Botão confirmar → PATCH /admin/vendas/:id/solicitar-revisao

Após qualquer ação: navega de volta para a lista e remove o item da fila (otimistic update).
```

### B.6 Financeiro admin (mobile)

```
No projeto /mobile, crie as telas do módulo financeiro do admin:

AdminFinanceiroList (src/screens/admin/FinanceiroList.tsx):
- Tabs no topo: Pendentes | Em processamento | Pagas
- FlatList de solicitações (GET /admin/financeiro/solicitacoes?status=solicitado|em_processamento|pago)
- Item: nome do vendedor, chave PIX, valor (destaque), data da solicitação, status badge
- Tap → AdminFinanceiroDetalhe

AdminFinanceiroDetalhe (src/screens/admin/FinanceiroDetalhe.tsx):
- Dados da solicitação: vendedor, distribuidor, chave PIX, valor, data
- Status atual

Botões de ação conforme status:
- Se 'solicitado':
  - "Marcar como processando" → PATCH /admin/financeiro/solicitacoes/:id/processar

- Se 'em_processamento':
  - "Registrar pagamento" → abre BottomSheet com:
    - Upload de comprovante: botão que abre picker de imagem/documento (react-native-document-picker ou launchImageLibrary do react-native-image-picker)
    - Preview do arquivo selecionado
    - Botão "Confirmar pagamento" → multipart POST para PATCH /admin/financeiro/solicitacoes/:id/pagar
    - Loading durante upload + toast de sucesso

- Se 'pago':
  - Exibir comprovante: se URL for imagem (.jpg/.png), abre modal com Image; se PDF, abre com Linking.openURL
  - Data do pagamento e quem pagou
```

### B.7 Campanhas — leitura e gestão básica (mobile)

```
No projeto /mobile, crie as telas de campanhas do admin:

AdminCampanhasList (src/screens/admin/CampanhasList.tsx):
- Chips de filtro: Todas / Rascunho / Ativas / Encerradas
- FlatList de campanhas (GET /admin/campanhas)
- Card por campanha: nome, tipo, vigência, status badge, total de vendas no período
- Tap → AdminCampanhaDetalhe

AdminCampanhaDetalhe (src/screens/admin/CampanhaDetalhe.tsx):
- Nome, tipo, descrição, datas (início e fim)
- Status atual com badge

Mudar status (apenas transições válidas):
- Rascunho → Ativa: botão "Ativar campanha" (verde)
- Ativa → Encerrada: botão "Encerrar campanha" (laranja) com confirmação (Alert.alert)
- Encerrada → Arquivada: botão "Arquivar" (cinza) com confirmação
- Chama PATCH /admin/campanhas/:id/status

Tabela de prêmios (ScrollView horizontal):
- Colunas: Produto | Metragem corte | Valor prêmio
- Uma linha por produto participante

Estatísticas simples abaixo da tabela:
- Total de vendas nessa campanha
- Total de prêmios apurados (R$)
Dados de: GET /admin/campanhas/:id

Nota: criação e edição de campanha ficam apenas no painel web (complexidade de formulário multi-step).
```

### B.8 Distribuidores (mobile)

```
No projeto /mobile, crie as telas de distribuidores do admin:

AdminDistribuidoresList (src/screens/admin/DistribuidoresList.tsx):
- SearchBar (busca por nome/CNPJ)
- Chips: Todos / Ativos / Inativos
- FlatList (GET /admin/distribuidores)
- Item: razão social, CNPJ (mascarado), responsável, região, vendedores ativos, status badge
- Tap → AdminDistribuidorDetalhe

AdminDistribuidorDetalhe (src/screens/admin/DistribuidorDetalhe.tsx):
- Todos os dados do distribuidor (somente leitura)
- Contagem de vendedores ativos/totais

Ação de status:
- Se ativo: botão "Inativar" (vermelho) com confirmação Alert.alert
  "Inativar este distribuidor bloqueará X vendedores vinculados. Confirmar?"
- Se inativo: botão "Reativar" (verde) com confirmação
- Chama PATCH /admin/distribuidores/:id/status

Lista de vendedores vinculados (FlatList simples, não paginada — limite 50):
- Nome, status badge
- Tap → AdminVendedorDetalhe (reaproveitando a tela da B.4)

Nota: criação e edição de distribuidores ficam apenas no painel web.
```

### B.9 Enviar notificações (mobile)

```
No projeto /mobile, crie a tela de envio de notificações push do admin:

AdminNotificacoes (src/screens/admin/Notificacoes.tsx):

Formulário de envio:
- Campo "Título" (TextInput, máximo 100 caracteres)
- Campo "Mensagem" (TextInput multiline, máximo 500 caracteres)
- Seleção de destinatário (segmented control ou radio buttons):
  - "Todos os vendedores"
  - "Por distribuidor" → ao selecionar, exibe picker de distribuidor (GET /admin/distribuidores?status=ativo)
  - "Vendedor específico" → exibe SearchBar para buscar por nome/CPF (GET /admin/vendedores?busca=X)

Preview antes de enviar:
- Card estilizado como push notification do sistema (fundo escuro, ícone, título, corpo)
- Botão "Enviar notificação"
- Alert.alert de confirmação com destinatário resumido: "Enviar para: Todos (X vendedores)?"
- Chama POST /admin/notificacoes/enviar
- Toast de sucesso com "Notificação enviada!"

Histórico de notificações enviadas (lista abaixo do formulário, separada por Divider):
- Últimas 10 notificações (GET /admin/notificacoes/historico — crie esse endpoint se não existir, retorna notificacoes sem vendedor_id=null, ou seja, as broadcasts)
- Item: título, data, destinatário resumido
```

---

## FASE C — Backend: endpoints ausentes

### C.1 Endpoints novos necessários para as fases A e B

```
Revise o backend e implemente os endpoints que ainda não existem e são necessários para as fases A e B:

1. GET /distribuidores/lista-publica
   - Sem autenticação (público)
   - Retorna apenas: id, razao_social
   - Apenas distribuidores com status = 'ativo'
   - Ordenado por razao_social ASC

2. GET /vendedor/resumo-mes
   - Autenticado: authenticateVendedor
   - Retorna:
     {
       vendas_mes: number,           // total de vendas do vendedor no mês corrente
       premio_acumulado_mes: number, // soma de premio_estimado das vendas do mês
       ranking_distribuidor: number  // posição do vendedor por premio_acumulado entre os do mesmo distribuidor no mês
     }

3. GET /admin/dashboard/resumo
   - Autenticado: authenticateAdmin
   - Retorna:
     {
       vendedores_ativos: number,
       vendedores_pendentes: number,
       vendas_mes: number,
       premios_apurados_mes: number,
       total_pago_mes: number,
       solicitacoes_pendentes: number
     }
   - Buscar com queries eficientes (JOINs ou subqueries), não N+1

4. GET /admin/notificacoes/historico
   - Autenticado: authenticateAdmin
   - Retorna as últimas 20 notificações broadcast (vendedor_id IS NULL)
   - Ordenado por created_at DESC
   - Inclui: id, titulo, corpo, created_at

Para cada endpoint: adicionar a rota no arquivo de rotas correspondente, criar o controller, validar com Zod onde houver body.
```

---

## Apêndice — Prompts de correção para as fases A e B

```
# Rota não encontrada no VendedorLayout
O React Router está renderizando a tela errada ao navegar entre as rotas do vendedor.
Verifique se todas as rotas /vendedor/* estão dentro do componente PrivateRoute com role='vendedor' e dentro do VendedorLayout no App.tsx.
```

```
# Token admin não funciona nas rotas do mobile admin
As chamadas do admin no mobile estão retornando 403.
Verifique se o Axios do mobile está injetando o token correto. O token do admin e o do vendedor são armazenados com a mesma chave no AsyncStorage — garanta que o campo 'role' no JWT é verificado no middleware do backend (authenticateAdmin deve rejeitar tokens com role='vendedor').
```

```
# Upload de comprovante falha no mobile
O upload de comprovante em AdminFinanceiroDetalhe retorna erro de payload.
Verifique se o FormData está sendo construído corretamente com o campo 'file' e o Content-Type está como 'multipart/form-data' no cabeçalho da requisição Axios.
```

```
# Badge de notificações não atualiza no web
O badge no sino não reflete o número correto após marcar como lida.
Verifique se o intervalo de polling (setInterval de 60s) está sendo limpo no useEffect cleanup e se o estado local está sendo invalidado após a chamada de PATCH /notificacoes/:id/lida.
```

---

*Documento gerado em maio de 2026. Executar após conclusão das fases 1–6 do prompts.md.*
