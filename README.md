# 🚀 Projeto Método Dark - Plataforma de Cursos

Bem-vindo ao repositório oficial da plataforma **Método Dark**. Este projeto é uma solução completa para venda e hospedagem de cursos online, com área de membros integrada, sistema de autenticação e processamento de pagamentos via Mercado Pago.

---

## 🛠️ Tech Stack

O projeto foi construído utilizando as seguintes tecnologias:

-   **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
-   **Backend**: Next.js API Routes (Serverless Functions)
-   **Banco de Dados**: [MySQL](https://www.mysql.com/) (gerenciado via [Prisma ORM](https://www.prisma.io/))
-   **Autenticação**: [NextAuth.js](https://next-auth.js.org/)
-   **Pagamentos**: [Mercado Pago SDK](https://www.mercadopago.com.br/developers/pt/docs/sdks-library/server-side/node)
-   **Email**: [Nodemailer](https://nodemailer.com/) (SMTP)

---

## 🧩 Sistemas do Site

-   **Site público**: página inicial, vitrine de cursos e detalhes do curso
-   **Autenticação**: login, registro, recuperação e reset de senha
-   **Área do aluno**: dashboard de cursos, player de aulas, progresso e perfil
-   **Carrinho e checkout**: carrinho, checkout e confirmação de pagamento
-   **Pagamentos**: Mercado Pago (cartão/PIX) com webhook de aprovação, rejeição e pendência
-   **Assinaturas**: planos, contratação, status (sucesso/pendente/erro) e acesso aos cursos
-   **Notificações**: dropdown de notificações, página de notificações e marcação como lida
-   **Suporte**: chats por aula/curso com anexos e atribuição de atendente
-   **Chat em grupo**: chat de curso e moderação administrativa
-   **Administração**: painel, cursos, conteúdos, usuários, pedidos, financeiro, receita, assinaturas e notificações
-   **Backups**: geração de backup e gestão de retenção
-   **E-mails automatizados**: confirmações de compra, redefinição de senha e lembretes
-   **Webhooks**: Mercado Pago e Stripe para atualização de pedidos
-   **Rotinas**: endpoint de cron para disparo de lembretes por email

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

-   [Node.js](https://nodejs.org/) (Versão 18 ou superior)
-   [MySQL](https://www.mysql.com/) (Local ou em nuvem, ex: PlanetScale, Railway)
-   [Git](https://git-scm.com/)

---

## ⚙️ Configuração do Ambiente

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/seu-usuario/metodo-dark.git
    cd metodo-dark
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**

    Crie um arquivo `.env` na raiz do projeto e preencha com as suas credenciais (baseado no `.env.example` se houver):

    ```env
    # Banco de Dados (MySQL)
    DATABASE_URL="mysql://usuario:senha@host:porta/nome_do_banco"

    # Autenticação (NextAuth.js)
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="sua-chave-secreta-gerada-com-openssl-rand-base64-32"

    # Mercado Pago (Pagamentos)
    MERCADOPAGO_ACCESS_TOKEN="APP_USR-seu-token-de-acesso-aqui"
    MERCADOPAGO_WEBHOOK_SECRET="seu-segredo-webhook-opcional"

    # Email (Gmail - Senha de App)
    # Gere sua senha de app em: https://myaccount.google.com/apppasswords
    EMAIL_USER="seu-email@gmail.com"
    EMAIL_APP_PASSWORD="senha-de-app-gerada"
    EMAIL_FROM="Nome do Remetente <seu-email@gmail.com>"
    ```

4.  **Configure o Banco de Dados:**

    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Inicie o servidor de desenvolvimento:**

    ```bash
    npm run dev
    ```

    O projeto estará rodando em `http://localhost:3000`.

---

## 💳 Configuração do Mercado Pago

Para processar pagamentos, você precisa configurar sua integração no Mercado Pago:

1.  Acesse o [Painel de Desenvolvedores do Mercado Pago](https://www.mercadopago.com.br/developers/panel).
2.  Crie uma nova aplicação.
3.  Vá em **Credenciais de Produção** e copie o `Access Token`.
4.  Cole o token no seu arquivo `.env` na variável `MERCADOPAGO_ACCESS_TOKEN`.

### Webhooks (Notificações de Pagamento)

Para que a liberação dos cursos seja automática, configure o Webhook:

1.  No painel do Mercado Pago, vá em **Notificações Webhooks**.
2.  Configure a URL de produção: `https://seu-dominio.com/api/webhooks/mercadopago`
3.  Selecione os eventos: `Pagamentos` (payment) e `Assinaturas` (subscription/preapproval).

> **Dica:** Para testar localmente, use o [Ngrok](https://ngrok.com/) para expor sua porta 3000 e use a URL gerada pelo Ngrok no painel do Mercado Pago.

---

## 🐙 Como Subir para o GitHub

1.  **Crie um novo repositório** no GitHub (sem inicializar com README/gitignore).
2.  **Inicialize o git no projeto local:**

    ```bash
    git init
    git add .
    git commit -m "Primeiro commit: Configuração inicial do projeto"
    ```

3.  **Conecte ao repositório remoto:**

    ```bash
    git remote add origin https://github.com/seu-usuario/nome-do-repositorio.git
    git branch -M main
    git push -u origin main
    ```

---

## ☁️ Como Fazer Deploy na VPS (Ubuntu)

Este guia assume que você tem uma VPS com Ubuntu 20.04 ou 22.04 e acesso root/sudo.

### 1. Prepare o Servidor

Atualize os pacotes e instale as dependências básicas:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

### 2. Instale o Node.js (v18+)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Instale o Gerenciador de Processos (PM2)

```bash
sudo npm install -g pm2
```

### 4. Configure o Banco de Dados (MySQL)

Se você não usar um banco externo (como PlanetScale), instale o MySQL na VPS:

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

Crie o banco e o usuário:

```sql
sudo mysql
CREATE DATABASE metododark;
CREATE USER 'metodouser'@'localhost' IDENTIFIED BY 'sua_senha_segura';
GRANT ALL PRIVILEGES ON metododark.* TO 'metodouser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Clone e Configure o Projeto

```bash
cd /var/www
sudo git clone https://github.com/seu-usuario/metodo-dark.git
sudo chown -R $USER:$USER /var/www/metodo-dark
cd metodo-dark
npm install
```

Crie o arquivo `.env` com suas configurações de produção:

```bash
nano .env
# Cole suas variáveis de ambiente aqui (DATABASE_URL, NEXTAUTH_URL, etc.)
```

Build do projeto e configuração do banco:

```bash
npx prisma generate
npx prisma db push
npm run build
```

### 6. Inicie a Aplicação com PM2

```bash
pm2 start npm --name "metodo-dark" -- start
pm2 save
pm2 startup
```

### 7. Configure o Nginx (Proxy Reverso)

Instale o Nginx:

```bash
sudo apt install -y nginx
```

Crie a configuração do site:

```bash
sudo nano /etc/nginx/sites-available/metodo-dark
```

Cole o seguinte conteúdo (altere `seu-dominio.com`):

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative o site e reinicie o Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/metodo-dark /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Configure o SSL (HTTPS) com Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

Pronto! Sua aplicação está rodando com HTTPS na sua VPS. 🚀
