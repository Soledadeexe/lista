# 🛒 Lista de Compras de Supermercado em Tempo Real

Uma aplicação web moderna, rápida e responsiva criada com **HTML, CSS e JavaScript puro**, desenvolvida especialmente para **leitura e uso em smartphones** durante as compras no supermercado. Pode ser hospedada **100% gratuitamente no GitHub Pages**.

---

## 📱 Destaques & Otimização para Smartphones

- **Leitura Fácil no Corredor do Mercado:** Tipografia com tamanho ampliado (mínimo de 18px nos nomes dos itens) e alto contraste, legível mesmo sob a iluminação forte do supermercado ou com o celular apoiado no carrinho.
- **Botão de Fonte A+:** Permite alternar rapidamente entre o tamanho padrão e um modo de texto gigante com 1 toque.
- **Áreas de Toque Ergonômicas:** Checkboxes e botões grandes (mínimo de 40px) para marcar itens com o polegar enquanto você caminha.
- **Sem Zoom Automático no iPhone:** Inputs configurados com tamanhos e modos numéricos decimais (`inputmode="decimal"`) para abrir o teclado correto sem desalinhar a tela no Safari/Chrome.
- **Barra Fixa com Resumo Financeiro:** O total e o valor de cada pessoa ficam sempre visíveis na parte inferior da tela enquanto você rola a lista.

---

## 📋 Itens Separados por Setor (Baseados em `Lista.txt`)

Todos os 23 itens enviados pela Claudia no WhatsApp foram organizados nos corredores clássicos de supermercado:

1. 🥬 **Hortifrúti:** Alho, Cebolinha verde, Limão, Tomate
2. 🥖 **Padaria & Pães:** Pão
3. 🧀 **Laticínios & Frios:** Margarina, Mussarela, Requeijão
4. 🥫 **Mercearia & Despensa:** Açúcar demerara, Azeite, Chocolate em pó, Farelo de aveia, Feijão, Fubá, Nescau, Sal, Vinagre
5. 🧹 **Produtos de Limpeza:** Água sanitária, Amaciante, Detergente
6. 📦 **Utilidades & Descartáveis:** Papel manteiga, Saco de lixo para pia, Saco de Lixo

---

## ⚡ Atualização em Tempo Real (2 Pessoas ao Mesmo Tempo)

A sincronização em tempo real entre celulares diferentes sem precisar pagar servidores é feita através do **Firebase Realtime Database** (nível gratuito perpétuo do Google):

1. **Configuração de 1 Minuto (apenas 1 pessoa precisa fazer):**
   - Acesse [console.firebase.google.com](https://console.firebase.google.com/) com sua conta Google (grátis).
   - Crie um projeto (ex: `MercadoLista`).
   - No menu lateral, clique em **Criação > Realtime Database** > **Criar Banco de Dados**.
   - Escolha a opção **Modo de Teste** (permite leitura e escrita imediata).
   - Vá nas configurações do projeto (ícone de engrenagem) e copie o bloco de configuração `firebaseConfig`.
   - Abra a página da lista, clique no botão **Modo Local / ⚙️**, cole o código no campo indicado e clique em **Salvar & Conectar**.

2. **Compartilhamento com 1 Clique via WhatsApp:**
   - Clique no botão de compartilhar (🔗 ou WhatsApp).
   - A página gera um link especial que já inclui as credenciais e o nome da sala codificados de forma segura no link.
   - Quando a outra pessoa clicar no link pelo WhatsApp no celular dela, **ela se conectará automaticamente à mesma lista em tempo real**, sem precisar configurar nada!

3. **Sincronização entre abas no mesmo computador:**
   - Já possui suporte nativo imediato à API `BroadcastChannel`. Se você abrir a página em duas abas do navegador, elas se atualizam instantaneamente em tempo real sem qualquer configuração.

---

## 💰 Cálculo de Preço por Usuário

- **Modo 50% / 50%:** Divide o total dos produtos marcados igualmente pela metade (ideal para despesas conjuntas da casa).
- **Modo por Atribuição Individual:** Toque na tag ao lado do item para alternar quem paga (`👥 50/50` ➔ `👤 Lucas` ➔ `👤 Claudia`). O sistema calcula automaticamente os itens individuais + metade dos compartilhados.
- **Acerto de Contas:** Mostra uma mensagem orientando o pagamento no caixa e eventuais transferências via Pix.

---

## 🚀 Como Hospedar Grátis no GitHub Pages (Passo a Passo)

1. Crie um novo repositório no seu GitHub (exemplo: `lista-mercado`).
2. No seu computador, abra a pasta deste projeto no terminal e execute:
   ```bash
   git init
   git add .
   git commit -m "feat: lista de supermercado em tempo real para smartphone"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/lista-mercado.git
   git push -u origin main
   ```
3. No GitHub, acesse seu repositório e vá em **Settings** > **Pages** (no menu lateral esquerdo).
4. Na seção **Branch**, selecione `main` e a pasta `/ (root)`.
5. Clique em **Save**.
6. Em cerca de 1 a 2 minutos, o GitHub exibirá o link público:
   `https://SEU_USUARIO.github.io/lista-mercado/`

Abra esse link no celular, adicione aos favoritos ou à tela inicial do Android/iPhone (PWA rápido) e aproveite!
