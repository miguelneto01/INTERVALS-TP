# Intervals.icu ➜ TrainingPeaks Sync (Next.js & React)

Aplicação completa em **React (Next.js 15 App Router)** pronta para deploy imediato no **Vercel**, equipada com **duas interfaces dedicadas**: uma otimizada para **Mobile (celular)** com navegação inferior e botão de ação rápida (FAB), e uma para **Web / Desktop** com dashboard completo e visualização em grade e tabela.

---

## 🚀 Como Fazer o Deploy no Vercel

O projeto foi construído no padrão nativo do Next.js, a plataforma oficial da Vercel. O deploy leva menos de 2 minutos:

### Opção 1: Pelo GitHub (Recomendado)
1. Crie um repositório no seu GitHub.
2. Suba este projeto (`git init`, `git add .`, `git commit -m "feat: sync intervals tp"`, `git push`).
3. Acesse [vercel.com](https://vercel.com) e faça login.
4. Clique em **"Add New..." ➜ "Project"**.
5. Selecione o seu repositório do GitHub.
6. A Vercel detectará automaticamente o **Next.js**. Não precisa alterar nenhuma configuração de build.
7. Clique em **"Deploy"**!

### Opção 2: Pelo Terminal (Vercel CLI)
No terminal da sua máquina, dentro da pasta do projeto:
```bash
npm install -g vercel
vercel
```
Siga as instruções rápidas na tela e seu link de produção estará no ar!

---

## 📱 & 💻 Duas Interfaces Dedicadas

Você pode alternar entre os modos a qualquer momento através do seletor no topo:
1. **⚡ Auto**: Detecta a largura da tela automaticamente (Mobile em telas menores que 768px e Desktop em telas maiores).
2. **📱 Mobile**:
   - Barra de navegação inferior estilo aplicativo móvel (**Treinos**, **Acessos**, **Logs**).
   - Botão flutuante **FAB** na parte inferior para envio em lote com 1 toque.
   - Cards com toque ergonômico, informações de duração e TSS em destaque.
   - Filtros rápidos em carrossel horizontal de datas (**Hoje + 7d**, **14d**, **30d**, **Personalizado**).
   - Modal bottom-sheet para inspecionar blocos prescritos e baixar arquivos `.FIT` e `.ZWO`.
3. **💻 Web / Desktop**:
   - Dashboard com resumo de métricas em tempo real (Enviados, Pulados, Erros, Cache).
   - Tabela densa e grade de cards com seleção em lote.
   - Campo de busca instantânea por nome de treino ou esporte.
   - Terminal de logs com autoscroll, filtros por nível (Sucesso, Erro, Aviso) e botão de copiar.
   - Gerenciador de conexões com teste de latência e validade das chaves.

---

## ⚙️ Modos de Sincronização

- 📅 **Treinos Planejados (Futuros)**: Busca eventos da categoria `WORKOUT` no seu calendário do Intervals.icu e cria o treino correspondente diretamente no calendário do TrainingPeaks com duração estimada, TSS e estrutura.
- 🚴 **Atividades Realizadas (Passadas)**: Faz o download do arquivo binário `.FIT` original gravado pelo seu GPS e envia para a API de arquivos do TrainingPeaks.

---

## 🛠️ Tecnologias Utilizadas
- **Next.js 15+ (App Router)**
- **React 19**
- **Tailwind CSS**
- **Lucide Icons**
- **TypeScript**
