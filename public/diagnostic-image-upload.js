// 🔧 SCRIPT DE DIAGNÓSTICO - Upload de Imagens
// Cole isso no console (F12 > Console) e execute para diagnosticar problemas

console.log("🚀 Iniciando diagnóstico de upload de imagens...\n");

async function diagnoseFImageUpload() {
  const { supabase } = await import("./src/integrations/supabase/client");
  
  // 1. Testar conexão com Supabase
  console.log("1️⃣ Testando conexão com Supabase...");
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("❌ Erro ao obter sessão:", sessionError);
    return;
  }
  console.log("✅ Conexão OK. User:", sessionData?.session?.user?.email);

  // 2. Verificar se tabela produto_images existe
  console.log("\n2️⃣ Verificando se tabela product_images existe...");
  const { data: tableData, error: tableError } = await supabase
    .from("product_images")
    .select("count(*)", { count: "exact", head: true });
  
  if (tableError) {
    console.error("❌ Erro ao acessar product_images:", tableError);
    console.log("📝 Verifique se:");
    console.log("   - Tabela product_images existe no Supabase");
    console.log("   - Tem permissão de INSERT (RLS policies)");
    return;
  }
  console.log("✅ Tabela product_images existe");

  // 3. Tentar inserir registro de teste
  console.log("\n3️⃣ Tentando inserir imagem de teste...");
  const { data: insertData, error: insertError } = await supabase
    .from("product_images")
    .insert({
      product_id: "TEST_PRODUCT_123",
      image_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      alt_text: "Imagem teste",
      display_order: 0,
      is_primary: true
    })
    .select()
    .single();

  if (insertError) {
    console.error("❌ Erro ao inserir:", insertError);
    console.log("\n📝 CÓDIGO DO ERRO:", insertError.code);
    console.log("📝 MENSAGEM:", insertError.message);
    
    if (insertError.code === "PGRST301") {
      console.log("\n⚠️ Erro 301: Acesso Negado - Verificar RLS policies em Supabase");
      console.log("   1. Abrir Supabase Dashboard");
      console.log("   2. Ir para Authentication > Policies");
      console.log("   3. Verificar políticas de INSERT em product_images");
    } else if (insertError.code === "42501") {
      console.log("\n⚠️ Erro 42501: Permissão Negada - Verificar RLS policies");
    }
    return;
  }

  console.log("✅ Inserção de teste bem-sucedida!");
  console.log("📊 ID gerado:", insertData.id);

  // 4. Verificar se foi realmente salvo
  console.log("\n4️⃣ Verificando se registro foi realmente salvo...");
  const { data: checkData, error: checkError } = await supabase
    .from("product_images")
    .select("*")
    .eq("id", insertData.id)
    .single();

  if (checkError) {
    console.error("❌ Erro ao verificar:", checkError);
    return;
  }
  console.log("✅ Registro confirmado no banco!");
  console.log("📊 Dados salvos:", checkData);

  // 5. Deletar registro de teste
  console.log("\n5️⃣ Limpando registro de teste...");
  await supabase
    .from("product_images")
    .delete()
    .eq("id", insertData.id);
  console.log("✅ Teste removido");

  console.log("\n✅ DIAGNÓSTICO COMPLETO - Tudo funcionando!");
}

// Executar diagnóstico
diagnoseFImageUpload().catch(error => {
  console.error("❌ Erro durante diagnóstico:", error);
});

/*
COMO USAR:
1. Abrir http://localhost:8084 no navegador
2. Pressionar F12 para abrir DevTools
3. Ir até a aba "Console"
4. Copiar todo este script
5. Colar na console
6. Pressionar Enter

INTERPRET RESULTADOS:
- ✅ em tudo = Sistema funcionando, problema está no componente
- ❌ em Conexão = Autenticação com erro
- ❌ em Tabela = RLS policies bloqueando
- ❌ em Inserção = Problema com banco de dados ou RLS
*/
