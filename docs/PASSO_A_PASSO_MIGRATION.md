# 🔧 PASSO A PASSO - APLICAR MIGRATION NO SUPABASE

## ⏱️ Tempo Total: ~5 minutos

---

## PASSO 1: Acessar Supabase

1. Abra o navegador e vá para: https://supabase.com
2. Clique em "Login" se tiver conta, ou "Sign Up" para criar uma nova
3. Você já deve ter a conta criada
4. Na dashboard, você verá os projetos
5. **Clique no projeto "DELIVERY PRO OFICIAL"**

---

## PASSO 2: Abrir o SQL Editor

1. No painel esquerdo (lateral esquerda), procure por **"SQL Editor"** (ou "SQL")
2. Clique nele
3. Você verá uma página com um área branca para código SQL
4. Clique em **"New Query"** ou **"Create New Query"** (botão azul)

---

## PASSO 3: Copiar o Conteúdo da Migration

1. Na sua máquina, abra o arquivo:
   ```
   C:\Users\Admin\OneDrive\DELIVERY PRO OFICIAL\supabase\migrations\22_business_templates_system.sql
   ```

2. **Selecione TODO o conteúdo** (Ctrl+A)
3. **Copie** (Ctrl+C)

---

## PASSO 4: Colar no Editor do Supabase

1. Clique na área branca do editor SQL do Supabase
2. **Cole todo o conteúdo** (Ctrl+V)
3. Você verá centenas de linhas de código SQL

---

## PASSO 5: Executar a Migration

1. Procure por um botão **"RUN"** (geralmente azul) no canto superior direito
2. Ou use o atalho: **Ctrl + Enter**
3. Clique em RUN

**Aguarde ~3-10 segundos**

---

## PASSO 6: Verificar Execução

### ✅ Se tudo funcionou:
- Você verá uma mensagem verde: "Success" ou "Query executed successfully"
- Pode haver um aviso sobre "0 rows" - isso é normal, pois você está criando tabelas, não buscando dados

### ❌ Se der erro:
- Procure por mensagens de erro na cor vermelha
- **Erro comum:** "relation already exists" - significa que as tabelas já foram criadas (tudo bem!)
- **Outro erro:** Copie a mensagem de erro e procure na documentação do Supabase

---

## PASSO 7: Validar as Tabelas Criadas

1. No painel esquerdo, clique em **"Table Editor"** ou **"Tables"**
2. Role a página para baixo e procure por:
   - ✅ `business_type_templates`
   - ✅ `template_configurations`
   - ✅ `template_addons`
3. Se vir essas 3 tabelas, **a migration funcionou com sucesso!**

---

## PASSO 8: Validar os Dados

1. Vá para **"SQL Editor"**
2. Crie uma nova query
3. Cole este código:
   ```sql
   SELECT * FROM public.business_type_templates;
   ```
4. Clique em RUN
5. Você deve ver os 9 templates criados (Pizzaria, Hamburgueria, etc.)

---

## PASSO 9: Voltar para o Projeto

1. Feche a aba do Supabase (ou deixe aberta se quiser)
2. Volte para a pasta do projeto:
   ```
   C:\Users\Admin\OneDrive\DELIVERY PRO OFICIAL\
   ```
3. O código já está pronto para usar!

---

## PASSO 10: Testar No Sistema

### Testar a Aplicação:

1. Certifique-se de que `npm run dev` está rodando
2. Acesse: http://localhost:8080/
3. Faça login como admin
4. Vá para **Customização → Templates**
5. Você verá 9 cards com os templates:
   - 🍕 Pizzaria
   - 🍔 Hamburgueria
   - 🍽️ Restaurante
   - 🥐 Pastelaria
   - 🌭 Lanchonete
   - 🍓 Açaí Shop
   - 🍺 Bar
   - ☕ Café
   - 🥖 Padaria

### Testar Criação de Produto com Template:

1. Vá para **Produtos**
2. Clique em **"+ Novo Produto"**
3. Preencha:
   - Nome: "Pizza Margherita"
   - Descrição: "Pizza deliciosa com mozzarela e manjericão"
   - Preço: **0.00** (deixe zero!)
   - Categoria: "Pizzas" (ou crie uma)
4. Clique em **"Criar Produto"**
5. Na seção "Gerenciar Configurações", clique em **"Aplicar Template"**
6. Selecione **"Pizzaria"**
7. Clique em **"Aplicar Template"**
8. Aguarde 2-3 segundos
9. Você verá que foram criadas automaticamente:
   - Configurações: Tamanho, Borda, Sabor, etc.
   - Adicionais: Queijo Extra, Bacon, etc.

---

## 🎉 PRONTO!

Se você chegou até aqui, tudo está funcionando perfeitamente!

### O que fazer agora:

1. **Customize os templates** conforme necessário
2. **Crie produtos** usando os templates
3. **Teste na home page** para ver os produtos com preço R$0,00 sendo mostrados corretamente
4. **Teste no carrinho** para ver os preços calculados corretamente

---

## 🆘 TROUBLESHOOTING

### "Erro: relation already exists"
- **Solução:** Execute a migration novamente, o Supabase ignora objetos que já existem

### "Templates não aparecem no painel"
- **Solução:** 
  1. Atualize a página (Ctrl+F5)
  2. Limpe o cache (Ctrl+Shift+Del)
  3. Recarregue o navegador
  4. Faça login novamente

### "Erro de permissão ao aplicar template"
- **Solução:**
  1. Verifique se você está logado como admin
  2. Volte ao Supabase e confirme que as tabelas foram criadas
  3. Tente criar um novo produto simples primeiro

### "Produto salvo mas não carrega templates"
- **Solução:**
  1. Feche o dialog do produto
  2. Abra novamente
  3. Tente aplicar template de novo
  4. Se persistir, verifique console (F12) para erros

---

## 📞 DÚVIDAS?

Se tiver qualquer dúvida sobre os passos acima:

1. Releia este documento
2. Verifique o arquivo `MIGRATION_TEMPLATES_INSTRUCTIONS.md`
3. Consulte `IMPLEMENTACAO_COMPLETA_TEMPLATES.md` para entender melhor o sistema

---

**Últimas Mudanças:** 11 de Março de 2026
**Versão do Sistema:** 1.0.0
**Status:** Pronto para Produção ✅
