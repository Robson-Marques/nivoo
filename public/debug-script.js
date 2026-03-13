// Script de Debug para Upload de Imagens
// Cole no console do navegador (DevTools > Console > Cole este código)

console.log("🔍 DEBUG: Script de Verificação de Upload de Imagens Ativado");

// 1. Verificar se Supabase está conectado
console.log("\n📌 1. Status Supabase:");
try {
  const supabaseCheck = window.localStorage.getItem("sb-szzzqpkqlmslsuhjafkd-auth-token");
  console.log("✅ Token de autenticação encontrado:", !!supabaseCheck);
} catch (e) {
  console.log("❌ Erro ao verificar Supabase:", e);
}

// 2. Verificar se hooks estão injetados (React DevTools)
console.log("\n📌 2. Estado do Componente:");
console.log("💡 Dica: Use React DevTools para inspecionar ProductForm > savedProductId state");

// 3. Monitorar erros de rede
console.log("\n📌 3. Monitorando requisições de API:");
const originalFetch = window.fetch;
window.fetch = function (...args) {
  const [url, options] = args;
  if (url.includes("product_images") || url.includes("addProductImage")) {
    console.log(`📤 API Call: ${url}`);
    console.log(`   Method: ${options?.method || "GET"}`);
    console.log(`   Body: ${options?.body ? JSON.stringify(JSON.parse(options.body)).substring(0, 100) : "none"}`);
  }
  return originalFetch.apply(this, args)
    .then(response => {
      if ((url.includes("product_images") || url.includes("addProductImage")) && !response.ok) {
        console.error(`❌ Erro API: ${response.status} ${response.statusText}`);
      }
      return response;
    })
    .catch(error => {
      if (url.includes("product_images") || url.includes("addProductImage")) {
        console.error(`❌ Erro Fetch: ${error.message}`);
      }
      throw error;
    });
};

console.log("✅ Monitoramento de API ativado");

// 4. Função para testar insert direto no Supabase
console.log("\n📌 4. Funções de teste disponíveis:");
console.log("📍 Use: testImageInsert(productId, imageUrl) - Testar insert na tabela product_images");
window.testImageInsert = async function(productId, imageUrl) {
  console.log(`🧪 Testando insert de imagem...`);
  console.log(`   Product ID: ${productId}`);
  console.log(`   Image URL (primeiros 50 chars): ${imageUrl.substring(0, 50)}...`);
  
  try {
    const response = await fetch("https://szzzqpkqlmslsuhjafkd.supabase.co/rest/v1/product_images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Será preenchido pelo auth
      },
      body: JSON.stringify({
        product_id: productId,
        image_url: imageUrl,
        display_order: 0,
        is_primary: true,
      }),
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log("✅ Insert bem-sucedido:", data);
    } else {
      console.error("❌ Erro no insert:", data);
    }
  } catch (error) {
    console.error("❌ Erro na requisição:", error);
  }
};

console.log("📍 Use: checkProductImages(productId) - Listar imagens de um produto");
window.checkProductImages = async function(productId) {
  console.log(`🔍 Verificando imagens do produto: ${productId}`);
  
  try {
    const response = await fetch(
      `https://szzzqpkqlmslsuhjafkd.supabase.co/rest/v1/product_images?product_id=eq.${productId}`,
      {
        headers: {
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      }
    );
    
    const images = await response.json();
    console.log(`✅ Imagens encontradas: ${images.length}`);
    console.table(images);
  } catch (error) {
    console.error("❌ Erro ao verificar imagens:", error);
  }
};

console.log("\n✅ Debug script carregado!");
console.log("📝 Próximas ações:");
console.log("   1. Criar novo produto");
console.log("   2. Verificar se seções aparecem imediatamente");
console.log("   3. Fazer upload de imagem");
console.log("   4. Verificar console para logs de API");
console.log("   5. Usar checkProductImages(productId) para verificar banco");
