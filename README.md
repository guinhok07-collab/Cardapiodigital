# Cardápio Digital

Projeto de **cardápio online**: categorias → itens → **carrinho** → formulário (nome, WhatsApp, endereço, **PIX / cartão / dinheiro**) → pedido no **WhatsApp**. Painel **admin** (`/admin/`, senha padrão `admin123`) para editar `menu-data.json`.

## Testar no PC

```powershell
cd "C:\Users\Guimi\Cardapio Digital"
npm install
npm start
```

Abre em **http://localhost:3456**. Não use só `file://` no `index.html`.

## Publicar (GitHub Pages)

1. Crie um repositório vazio no GitHub.
2. `git remote add origin ...` e `git push -u origin main`
3. **Settings → Pages → Source: GitHub Actions**

## Estrutura

- `public/index.html` — categorias  
- `public/cardapio.html?cat=...` — itens  
- `public/carrinho.html` — carrinho e checkout  
- `public/data/menu-data.json` — dados  
- `public/admin/` — admin  
