# 🏗 NR Construções — Centro de Controle de Obras

Sistema completo e profissional de **Gestão de Obras Públicas, Vistorias e Licitações**.

**Stack:** React 18 · TypeScript · Tailwind CSS · Zustand (persist + localStorage) · Recharts · Lucide React · Leaflet / react-leaflet (OpenStreetMap real).

---

## 🚀 Como rodar localmente

```bash
npm install
npm run dev        # ambiente de desenvolvimento (http://localhost:5173)
```

Build de produção:

```bash
npm run build      # gera a pasta dist/
npm run preview    # pré-visualiza a build
```

---

## 🔐 Login / Contas de acesso

A tela de login traz **3 contas demo** (clique para preencher):

| Papel    | E-mail                         | Senha       |
|----------|--------------------------------|-------------|
| Admin    | admin@nrconstrucoes.com.br     | admin123    |
| Fiscal   | fiscal@nrconstrucoes.com.br    | fiscal123   |
| Gestor   | gestor@nrconstrucoes.com.br    | gestor123   |

> Autenticação local (localStorage). Para criar/editar usuários, ajuste `src/store/seed.ts`.

---

## 🌐 Link de acesso externo (deploy)

### Opção A — Vercel (recomendado, 1 clique)
1. Suba este projeto para um repositório no GitHub.
2. Acesse [vercel.com](https://vercel.com) → **Add New → Project** → importe o repo.
3. Framework: **Vite** · Build: `npm run build` · Output: `dist` (já configurado em `vercel.json`).
4. Deploy → você recebe um **link público** (ex.: `https://nr-construcoes.vercel.app`).

### Opção B — Netlify
1. [netlify.com](https://netlify.com) → **Add new site → Import** → selecione o repo.
2. Configurações já vêm de `netlify.toml` (build `npm run build`, publish `dist`).

### Opção C — Servidor próprio + WhatsApp (tudo junto)
```bash
npm run start      # build + sobe o bridge que serve o app em http://localhost:8080
```
Exponha a porta 8080 (ngrok, Cloudflare Tunnel, VPS) para obter um link externo
que entrega **o sistema + o webhook do WhatsApp** no mesmo endereço.

---

## 📱 Integração WhatsApp (whatsapp-agentkit)

Referência: https://github.com/Hainrixz/whatsapp-agentkit

O sistema possui o módulo **Central WhatsApp** + um **bridge Node real** em `server/whatsapp-bridge.cjs`
(sem dependências externas — usa o `http` nativo).

### Como conectar
1. `npm run build`
2. `node server/whatsapp-bridge.cjs` (ou `npm run serve`)
3. Acesse `http://localhost:8080`
4. Configure o `whatsapp-agentkit` para enviar **POST** ao webhook:

```
POST http://SEU_HOST:8080/api/whatsapp/webhook
Content-Type: application/json

{
  "from": "5592999990000",
  "nome": "João Pedreiro",
  "texto": "Fissura na viga V3, preciso de cimento",
  "midia": "data:image/jpeg;base64,...."   // opcional
}
```

O frontend faz polling de `/api/whatsapp/messages` a cada 8s e injeta as mensagens
na **Central WhatsApp**, onde cada uma pode ser convertida em **Vistoria** com 1 clique.

> **Modo standalone:** sem o servidor rodando, use o botão **"Simular Mensagem"** na
> Central WhatsApp para testar todo o fluxo (demanda → vistoria → laudo).

Endpoints do bridge:
- `POST /api/whatsapp/webhook` — recebe do agentkit
- `GET  /api/whatsapp/messages` — frontend lê a inbox
- `POST /api/whatsapp/ack` — confirma importação `{ ids: [...] }`
- `GET  /api/health` — status

---

## 📦 Módulos

1. **Painel Tático** — KPIs, fluxo de caixa (AreaChart), vistorias por status (PieChart), orçado×gasto (BarChart), central de alertas clicável, obras em andamento, próximas vistorias.
2. **Mapa Digital** — OpenStreetMap real, marcadores coloridos por status (pulsação em obras em andamento), modo "Adicionar Unidade" (clique no mapa → cadastro), filtros, zoom.
3. **Vistorias & Infraestrutura** — upload/compressão de fotos, drag&drop, lightbox, diagnóstico (IA), demandas, checklist com % de conformidade automático, **laudo PDF de engenharia**.
4. **Gestão de Obras** — CRUD, cronograma com sliders por etapa (recalcula progresso geral), execução física/financeira.
5. **Almoxarifado** — estoque, alerta de mínimo, entradas/saídas, histórico de movimentações.
6. **Orçamento & Contas** — receitas/despesas, KPIs, PieChart por categoria, marcar como pago.
7. **Equipe** — colaboradores, alocação em obra, CRUD.
8. **Documentos** — upload real (base64), download, preview (imagem/PDF), validade.
9. **Empenhos** — CRUD com anexo digitalizado, KPIs, vínculo com licitações.
10. **Licitações** — Lei 14.133/2021, modalidades, status, detalhes.
11. **Agenda & Eventos** — timeline colorida, prioridades, concluir, CRUD.
12. **Central WhatsApp** — mensagens recebidas, conversão em vistoria.
13. **Hub de Relatórios** — 5 relatórios PDF profissionais + IA de Auditoria.
14. **Configurações** — empresa/logo, tema, módulos, notificações, obras públicas, backup JSON.

---

## 💾 Persistência & Backup

- Estado salvo em `localStorage` (`nr-construcoes-storage`, versão 3 com migração segura).
- **Configurações → Backup**: exportar/importar JSON e restaurar dados seed.
- Botão de **reset** no topbar (ícone ↺).
