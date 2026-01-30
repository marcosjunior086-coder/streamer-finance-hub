

# 🚀 Sistema Financeiro - Bloom Agency

Sistema completo de gestão financeira para agência de lives com gestão massiva de streamers, cálculos automáticos, histórico confiável e dashboard executivo.

---

## 🎨 Design & Identidade Visual

- **Tema escuro profissional** com fundo #0B0B0D e superfícies #141414
- **Cores da marca**: Rosa primário (#FF2F92) + Roxo secundário (#7B3FE4)
- **Logo Bloom Agency** integrado em toda a interface
- **Bordas suaves** com roxo translúcido
- **Layout responsivo** desktop-first com adaptação mobile completa

---

## 🔐 Autenticação & Segurança

- **Tela de login** com logo centralizada e campo de senha
- **Senha global**: 0159 (para acesso ao sistema)
- **Proteção por senha** apenas para ações destrutivas (excluir streamer, limpar histórico)
- **Sessão persistente** até logout manual

---

## 🧑‍💼 Gestão de Streamers

### Cadastro & Edição
- **Formulário completo** com todos os campos iniciando vazios
- **Campos**: ID, Nome, Presentes da Sorte, Exclusivos, Cristais Host (manual), Minutos, Dias Efetivos (1-31)
- **Suporte a números grandes** (milhões) com formatação visual (26.153.249)
- **Conversão automática** de minutos para formato horas:minutos
- **Validação de duplicados** por ID ou Nome com alerta visual

### Cálculos Automáticos
- **Valor do Host (USD)**: Cristais Host ÷ 10.000
- **Valor da Agência (USD)**: (Cristais Host × 10%) ÷ 10.000
- Campo Cristais Host sempre manual, nunca calculado

### Tabela de Streamers
- **Colunas**: Ranking, Nome, ID, Sorte, Exclusivo, Cristais, Host $, Agência $, Total Cristais, Horas, Dias
- **Ordenação flexível** por qualquer coluna (maior → menor)
- **Ações rápidas**: Editar, Excluir (com senha), Copiar dados
- **Busca e filtros** para encontrar streamers rapidamente
- **Paginação** otimizada para 600+ streamers

---

## 📊 Exportação & Cópia

- **Modal de seleção** com checkboxes para cada campo
- **Filtros de exportação**: Todos, Específico, Por Período, Intervalo de Datas
- **Formato padronizado** pronto para WhatsApp, Excel e Google Docs
- **Cópia real** para clipboard com confirmação visual
- **Download** opcional em formato CSV/TXT

---

## 📂 Sistema de Snapshots

- **Salvamento por período**: Semanal, Mensal, Anual
- **Snapshots imutáveis** com timestamp automático
- **Histórico navegável** por mês (Janeiro, Fevereiro, etc.)
- **Consulta flexível** por streamer, período ou data específica
- **Proteção** contra sobrescrita acidental

---

## 📈 Dashboard Executivo

### Cards Principais
- Cristais Totais | Receita Total ($) | Gastos Totais ($)
- Lucro Líquido ($) | Margem (%)
- Top Streamer do Período | Maior Custo | Crescimento %

### Navegação Interna
- Seletor integrado: Controle Semanal | Fechamento Mensal | Visão Anual
- Troca dinâmica sem mudar de tela
- Seleção de período específico (semana, mês, ano)

### Gráficos
- Receita ao longo do tempo (linha)
- Cristais movimentados (barras)
- Lucro da agência (área)
- Distribuição de gastos (pizza/donut)
- Ranking de streamers (barras horizontais)
- Evolução de margem (linha com tendência)

---

## 📱 Responsividade

### Desktop
- Layout em grid com sidebar de navegação
- Tabelas completas com todas as colunas
- Dashboard com gráficos lado a lado

### Mobile
- Cards empilhados verticalmente
- Tabelas com scroll horizontal
- Botões grandes e touch-friendly
- Menu hamburger para navegação

---

## ☁️ Backend (Supabase)

- **Banco de dados** para streamers, snapshots e configurações
- **Autenticação** para controle de acesso da equipe
- **Backup automático** dos dados
- **Sincronização** em tempo real entre usuários
- **Segurança RLS** para proteger os dados

