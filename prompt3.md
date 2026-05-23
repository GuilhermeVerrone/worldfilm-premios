# Prompt — Aplicação de Esquema de Cores · World Film App

Você é um desenvolvedor frontend sênior especialista em React, TypeScript e Tailwind CSS.  
Sua única tarefa nessa sessão é **aplicar o esquema de cores abaixo** em todos os arquivos de `web/src`, sem alterar funcionalidade, estrutura de componentes, lógica de negócio ou tipografia.

---

## Regra inviolável

Utilize **somente** as cores listadas neste documento. Não invente variantes, não adicione gradientes, não use cores fora da paleta. Se um elemento não estiver mapeado aqui, mantenha a cor do design system atual sem alteração.

---

## Paleta de tokens

| Token | Hex | Tailwind |
|-------|-----|----------|
| Black | `#0A0A0A` | `[#0A0A0A]` / `wf-text-primary` |
| Black Surface | `#1A1A1A` | `[#1A1A1A]` |
| White | `#ffffff` | `white` / `wf-bg` |
| Surface Light | `#f7f7f7` | `wf-surface` |
| Surface Mid | `#e8e8e8` | `wf-surface-2` / `wf-border` |
| Red | `#cc0000` | `wf-red` |
| Red Dark | `#990000` | `wf-red-dark` |
| Text Primary | `#0a0a0a` | `wf-text-primary` |
| Text Secondary | `#5a5a5a` | `wf-text-secondary` |
| Text Muted | `#9a9a9a` | `wf-text-muted` |

---

## 1. Body / Fundo geral

| Propriedade | Valor |
|---|---|
| `body` background | `#ffffff` |
| `body` color | `#0a0a0a` |
| `<main>` background | `#ffffff` |
| Página de login (ambos painéis) | `#ffffff` |

---

## 2. Header · Sidebar · Bottom Navigation

Todos os elementos de navegação estrutural usam **fundo preto**.

| Elemento | Background | Texto | Ícone | Borda divisória |
|---|---|---|---|---|
| `<header>` admin | `#0A0A0A` | `#ffffff` | `#ffffff` | `1px solid #1A1A1A` (bottom) |
| Sidebar admin | `#0A0A0A` | `#ffffff` | `#ffffff` | `1px solid #1A1A1A` (right) |
| `<header>` vendedor | `#0A0A0A` | `#ffffff` | `#ffffff` | `1px solid #1A1A1A` (bottom) |
| Bottom nav vendedor | `#0A0A0A` | `#ffffff` | `#ffffff` | `1px solid #1A1A1A` (top) |
| Rodapé de seção (texto copyright) | `#0A0A0A` | `#5a5a5a` | — | `1px solid #1A1A1A` (top) |

**Estados de itens de navegação:**

| Estado | Texto | Background | Borda |
|---|---|---|---|
| Padrão | `#808080` | transparente | nenhuma |
| Hover | `#ffffff` | `#1A1A1A` | nenhuma |
| Ativo (sidebar admin) | `#cc0000` | `rgba(204,0,0,0.1)` | `2px solid #cc0000` (esquerda) |
| Ativo (bottom nav) | `#cc0000` | transparente | `2px solid #cc0000` (topo) |

**Logo no header/sidebar:**
- Exibir sem filtro CSS (`filter: none`). O arquivo `logo.png` já tem letras brancas e ícone vermelho e aparece corretamente sobre fundo `#0A0A0A`.
- Em fundos **claros** (login, cadastro): aplicar `style={{ filter: 'brightness(0)' }}` para tornar o logo todo preto e legível.

---

## 3. Área de conteúdo principal

| Elemento | Background | Texto | Borda |
|---|---|---|---|
| Cards e painéis | `#ffffff` | `#0a0a0a` | `1px solid #e8e8e8` |
| Card hover | `#f7f7f7` | `#0a0a0a` | `1px solid #e8e8e8` |
| Cabeçalho de card (label) | `#f7f7f7` | `#5a5a5a` | `1px solid #e8e8e8` (bottom) |
| Divisores / `<hr>` | — | — | `1px solid #e8e8e8` |
| Cabeçalho de tabela (`<thead>`) | `#f7f7f7` | `#0a0a0a` | `1px solid #e8e8e8` (bottom) |
| Linha de tabela par | `#ffffff` | `#0a0a0a` | `1px solid #e8e8e8` (bottom) |
| Linha de tabela ímpar | `#f7f7f7` | `#0a0a0a` | `1px solid #e8e8e8` (bottom) |
| Linha de tabela hover | `#f0f0f0` | `#0a0a0a` | — |
| Célula de ação em tabela | — | `#cc0000` | — |

---

## 4. Inputs, Selects, Textareas e Labels

| Elemento | Background | Texto | Borda padrão | Foco | Erro |
|---|---|---|---|---|---|
| `<input>` | `#f7f7f7` | `#0a0a0a` | `1px solid #0A0A0A` | `#cc0000` | `#cc0000` |
| `<select>` | `#f7f7f7` | `#0a0a0a` | `1px solid #0A0A0A` | `#cc0000` | `#cc0000` |
| `<textarea>` | `#f7f7f7` | `#0a0a0a` | `1px solid #0A0A0A` | `#cc0000` | `#cc0000` |
| `<label>` do campo | — | `#0a0a0a` | — | — | `#cc0000` |
| Placeholder | — | `#9a9a9a` | — | — | — |
| Mensagem de erro inline | — | `#cc0000` | — | — | — |
| Checkbox / Radio não marcado | `#ffffff` | — | `1px solid #0A0A0A` | — | — |
| Checkbox / Radio marcado | `#cc0000` | `#ffffff` | `1px solid #cc0000` | — | — |

> A borda padrão de qualquer campo de entrada é `#0A0A0A`. Ao receber foco, a borda muda para `#cc0000`. Em estado de erro, a borda permanece `#cc0000`.

---

## 5. Botões

| Variante | Background | Texto | Borda | Hover bg | Hover texto |
|---|---|---|---|---|---|
| **Primary** | `#cc0000` | `#ffffff` | — | `#990000` | `#ffffff` |
| **Secondary** | `#f7f7f7` | `#0a0a0a` | `1px solid #e8e8e8` | `#e8e8e8` | `#0a0a0a` |
| **Ghost** | transparente | `#9a9a9a` | — | `#f7f7f7` | `#0a0a0a` |
| **Outline** | transparente | `#5a5a5a` | `1px solid #e8e8e8` | `#0A0A0A` | `#ffffff` |
| **Danger** | transparente | `#cc0000` | `1px solid rgba(204,0,0,0.4)` | `rgba(204,0,0,0.08)` | `#cc0000` |
| **Qualquer desabilitado** | — | — | — | opacidade `40%`, `cursor: not-allowed` |

> **Regra crítica:** Todo botão de CTA ou ação principal usa `bg-wf-red` (`#cc0000`). Nunca use preto como fundo de botão primário — preto é exclusivo de header/footer/sidebar.

---

## 6. Badges e Tags de Status

| Status semântico | Background | Texto | Borda |
|---|---|---|---|
| Aprovado / Ativo / Pago / Disponível | `rgba(34,197,94,0.1)` | `#16a34a` | `1px solid rgba(34,197,94,0.25)` |
| Pendente / Em análise / Solicitado | `rgba(234,179,8,0.1)` | `#ca8a04` | `1px solid rgba(234,179,8,0.25)` |
| Reprovado / Bloqueado / Cancelado / Erro | `rgba(204,0,0,0.1)` | `#cc0000` | `1px solid rgba(204,0,0,0.25)` |
| Encerrado / Inativo / Arquivado | `#f7f7f7` | `#9a9a9a` | `1px solid #e8e8e8` |
| Em processamento / Rascunho | `rgba(0,191,255,0.1)` | `#0284c7` | `1px solid rgba(0,191,255,0.25)` |

---

## 7. Tabs / Abas

| Estado | Texto | Borda inferior | Background |
|---|---|---|---|
| Inativa | `#9a9a9a` | `2px solid transparent` | transparente |
| Ativa | `#cc0000` | `2px solid #cc0000` | transparente |
| Hover | `#0a0a0a` | `2px solid #e8e8e8` | transparente |

---

## 8. Modal

| Elemento | Background | Texto | Borda |
|---|---|---|---|
| Overlay (backdrop) | `rgba(0,0,0,0.6)` | — | — |
| Container do modal | `#ffffff` | `#0a0a0a` | — |
| Header do modal | `#0A0A0A` | `#ffffff` | — |
| Botão fechar (`×`) | transparente | `#ffffff` | — |
| Divisores internos | — | — | `1px solid #e8e8e8` |
| Rodapé do modal (ações) | `#f7f7f7` | `#0a0a0a` | `1px solid #e8e8e8` (top) |

---

## 9. Dropdown / Menu flutuante

| Estado | Background | Texto | Borda container |
|---|---|---|---|
| Container | `#ffffff` | `#0a0a0a` | `1px solid #e8e8e8` |
| Item padrão | `#ffffff` | `#0a0a0a` | — |
| Item hover | `#f7f7f7` | `#0a0a0a` | — |
| Item destrutivo (ex: Sair) | `#ffffff` | `#cc0000` | — |
| Item destrutivo hover | `rgba(204,0,0,0.05)` | `#cc0000` | — |

---

## 10. Paginação

| Estado | Background | Texto |
|---|---|---|
| Item padrão | transparente | `#5a5a5a` |
| Item hover | `#f7f7f7` | `#0a0a0a` |
| **Item ativo** | `#cc0000` | `#ffffff` |
| Setas prev/next | transparente | `#9a9a9a` |

---

## 11. Alertas, Toasts e Feedback inline

| Tipo | Background | Texto | Borda |
|---|---|---|---|
| **Erro / Crítico** | `rgba(204,0,0,0.08)` | `#cc0000` | `1px solid rgba(204,0,0,0.3)` |
| **Sucesso** | `rgba(34,197,94,0.08)` | `#16a34a` | `1px solid rgba(34,197,94,0.3)` |
| **Aviso** | `rgba(234,179,8,0.08)` | `#ca8a04` | `1px solid rgba(234,179,8,0.3)` |
| **Info** | `rgba(0,191,255,0.08)` | `#0284c7` | `1px solid rgba(0,191,255,0.3)` |

---

## 12. Elementos de destaque e atenção — uso do vermelho

Os seguintes elementos **obrigatoriamente** usam `#cc0000`:

- Badge de notificações não lidas (número sobre ícone do sino)
- Botões primários e CTAs principais
- Item de navegação ativo (sidebar e bottom nav)
- Borda de foco em inputs
- Mensagens e estados de erro
- Links de ação textual (ex: "Cadastrar-se →", "Ver detalhes")
- Indicador de nova campanha / prazo urgente (< 24h restantes)
- Tab ativa
- Paginação item ativo

---

## 13. Elementos que NÃO usam vermelho

Não aplique `#cc0000` nos seguintes contextos, mesmo que sejam visualmente importantes:

- Valores monetários positivos (prêmios, saldo): use verde `#16a34a`
- Datas e prazos normais: use `#5a5a5a`
- Textos de status neutros ou secundários: use `#9a9a9a`
- Ícones de navegação no estado padrão: use `#808080`
- Separadores, divisores e bordas de layout: use `#e8e8e8`
- Fundo de cards, painéis ou seções de conteúdo: use `#ffffff` ou `#f7f7f7`
- Textos de corpo e parágrafos descritivos: use `#0a0a0a` ou `#5a5a5a`

---

## 14. Cores mantidas do design system (não alterar)

| Finalidade | Cor |
|---|---|
| Sucesso / aprovado | `#16a34a` (green-600) |
| Aviso / pendente | `#ca8a04` (yellow-600) / `#edd14e` |
| Info | `#0284c7` (sky-600) / `#00bfff` |
| Saldo bloqueado | `#ca8a04` |
| Fundo superfície | `#f7f7f7` |
| Fundo superfície secundário | `#e8e8e8` |
| Texto secundário | `#5a5a5a` |
| Texto muted | `#9a9a9a` |

---

## O que NÃO fazer

- ❌ Não use `background: #000` ou `background: #0A0A0A` em cards, seções ou tabelas de conteúdo
- ❌ Não use `#cc0000` em textos de corpo, labels descritivas ou parágrafos
- ❌ Não invente tons de cinza fora da paleta definida
- ❌ Não aplique `filter: invert(1)` no logo em fundos escuros
- ❌ Não altere as cores semânticas de sucesso (verde), aviso (amarelo) ou info (azul)
- ❌ Não use vermelho em mais de um elemento por bloco de contexto (um destaque por agrupamento visual)
- ❌ Não modifique `tailwind.config.js` — use os tokens existentes (`wf-red`, `wf-bg`, etc.)

---

## Ordem de execução

1. `web/src/index.css` — variáveis CSS e estilos base do body
2. Componentes de layout: `Header.tsx`, `Sidebar.tsx`, `VendedorLayout.tsx`
3. Componentes de UI: `Button.tsx`, `Input.tsx`, `Badge.tsx`, `Card.tsx`, `Modal.tsx`, `Tabs.tsx`, `Pagination.tsx`
4. Páginas: `Login.tsx`, `Cadastro.tsx`, páginas admin (`/pages/*.tsx`), páginas vendedor (`/pages/vendedor/*.tsx`)

---

## Checklist de revisão final (obrigatório)

Após aplicar todas as mudanças, percorra cada item abaixo e confirme:

- [ ] Header / Sidebar / Footer → fundo `#0A0A0A`, textos e ícones brancos
- [ ] Área de conteúdo (`<main>`) → fundo `#ffffff`, texto `#0a0a0a`
- [ ] Todos os inputs, selects e textareas → borda `#0A0A0A`, foco `#cc0000`
- [ ] Todos os botões primários → fundo `#cc0000`, texto `#ffffff`
- [ ] Nenhum card ou seção de conteúdo com fundo preto
- [ ] Nenhuma cor fora da paleta deste documento
- [ ] Logo sem `filter: invert(1)` nos fundos escuros
- [ ] Alertas e mensagens de erro usando `#cc0000`
- [ ] Badges de status usando cores semânticas corretas (verde/amarelo/vermelho/cinza)
- [ ] Paginação ativa usando `#cc0000`
- [ ] Tab ativa usando `#cc0000`
- [ ] Dropdown: item "Sair" ou destrutivo em `#cc0000`
- [ ] Header do modal com fundo `#0A0A0A` e texto branco

Reporte qualquer inconsistência encontrada antes de finalizar.
