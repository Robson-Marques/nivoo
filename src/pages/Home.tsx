import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShoppingCart,
  Search,
  Clock,
  MapPin,
  Star,
  ChevronRight,
  Phone,
  Info,
} from "lucide-react";
import { ProductList } from "@/components/home/ProductList";
import { RestaurantHeader } from "@/components/home/RestaurantHeader";
import { CategoryFilter } from "@/components/home/CategoryFilter";
import { FloatingCart } from "@/components/home/FloatingCart";
import { ActiveOrderBanner } from "@/components/home/ActiveOrderBanner";
import { Product, ProductAddon } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TooltipProvider } from "@/components/ui/tooltip";

// Interface para horários de funcionamento
interface BusinessHour {
  id: string;
  day_of_week: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
  updated_at?: string;
}

// Interface para restaurant
interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  banner_url: string | null;
  logo_url: string | null;
  open_time: string | null;
  close_time: string | null;
  delivery_fee: number | null;
  description: string | null;
  phone: string | null;
}

export default function Home() {
  // Estado para controlar se houve erro crítico
  const [criticalError, setCriticalError] = useState<string | null>(null);
  
  // Testar conexão com Supabase
  React.useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("count")
          .single();
        
        if (error) {
          setCriticalError("Erro de conexão com o banco de dados");
        }
      } catch (err) {
        setCriticalError("Erro ao testar conexão");
      }
    };
    
    testConnection();
  }, []);

  // Se houver erro crítico, mostrar tela de erro
  if (criticalError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Erro de Conexão
          </h1>
          <p className="text-muted-foreground mb-4">
            {criticalError}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Verifique sua conexão com a internet e tente novamente.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<
    {
      product: Product;
      quantity: number;
      selectedAddons?: ProductAddon[];
      selectedConfigurations?: Record<string, any>;
      configurationPrice?: number;
      notes?: string;
      productCouponCode?: string;
      productCouponDiscountTotal?: number;
    }[]
  >([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isFetchingProductsRef = useRef(false);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [isLoadingBusinessHours, setIsLoadingBusinessHours] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  // Função para formatar horário
  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    try {
      const [hours, minutes] = timeString.split(":");
      return `${hours}h${minutes !== "00" ? minutes : ""}`;
    } catch (e) {
      return timeString;
    }
  };

  // Função para obter horário do dia atual
  const getTodayBusinessHours = () => {
    if (!businessHours || businessHours.length === 0) {
      return "Horário não disponível";
    }

    // Obter dia da semana atual em português
    const daysInPortuguese = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];

    // Configurar a data para o timezone de São Paulo (UTC-3)
    const today = new Date();
    const dayOfWeek = daysInPortuguese[today.getDay()];

    // Formatar a data no padrão brasileiro (dia/mês/ano)
    const formattedDate = format(today, "dd/MM/yyyy", { locale: ptBR });

    // Encontrar o registro para hoje
    const todayIntervals = businessHours
      .filter((hour) => hour.day_of_week === dayOfWeek)
      .sort((a, b) => (a.open_time || "").localeCompare(b.open_time || ""));

    if (todayIntervals.length === 0) {
      return `Hoje dia ${formattedDate}, ${dayOfWeek} - Horário não disponível`;
    }

    const isClosed = todayIntervals.every((h) => h.is_closed);

    if (isClosed) {
      return `Hoje dia ${formattedDate}, ${dayOfWeek} estamos fechados`;
    }

    const openIntervals = todayIntervals.filter((h) => !h.is_closed);

    const formattedIntervals = openIntervals
      .map((h) => `${formatTime(h.open_time)} às ${formatTime(h.close_time)}`)
      .join(" e ");

    return `Hoje dia ${formattedDate}, ${dayOfWeek} estamos abertos das ${formattedIntervals}`;
  };

  // Efeito para carregar horários de funcionamento
  useEffect(() => {
    const fetchBusinessHours = async () => {
      setIsLoadingBusinessHours(true);

      try {
        const { data, error } = await supabase
          .from("business_hours")
          .select("*")
          .order("id");

        if (error) {
          throw error;
        }

        if (data) {
          setBusinessHours(data);
        }
      } catch (error) {
        console.error("Erro ao carregar horários de funcionamento:", error);
        toast.error("Erro ao carregar horários de funcionamento");
      } finally {
        setIsLoadingBusinessHours(false);
      }
    };

    fetchBusinessHours();
  }, []);

  // Efeito para carregar informações do restaurante
  useEffect(() => {
    async function fetchRestaurantInfo() {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .limit(1)
          .single();

        if (error) throw error;
        setRestaurant(data);
      } catch (err) {
        console.error("Error fetching restaurant info:", err);
        toast.error("Erro ao carregar informações do restaurante");
      }
    }

    fetchRestaurantInfo();
  }, [toast]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (isFetchingProductsRef.current) return;
      isFetchingProductsRef.current = true;

      try {
        setLoading(true);

        const { data: productsData, error: productsError } =
          await supabase.from("products").select(`
            *,
            categories:category_id (name)
          `).order('display_order', { ascending: true });

        if (productsError) throw productsError;

        const { data: addonsData, error: addonsError } = await supabase.rpc(
          "get_product_addons"
        );
        const productAddons = addonsError ? [] : addonsData || [];

        const { data: relationsData, error: relationsError } =
          await supabase.rpc("get_product_addon_relations");
        const addonRelations = relationsError ? [] : relationsData || [];

        const formattedProducts = (productsData || []).map((product) => {
          const productAddonIds = (addonRelations || [])
            .filter((relation) => relation.product_id === product.id)
            .map((relation) => relation.addon_id);

          const productAddonsForThisProduct = (productAddons || [])
            .filter((addon) => productAddonIds.includes(addon.id))
            .map((addon) => ({
              id: addon.id,
              name: addon.name,
              description: addon.description,
              price: addon.price,
              available: addon.available,
              isGlobal: addon.is_global,
              maxOptions: addon.max_options,
            }));

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: product.image_url,
            category: product.categories?.name || "Sem categoria",
            available: product.available,
            featured: product.featured,
            createdAt: new Date(product.created_at),
            addons: productAddonsForThisProduct,
          };
        });

        setProducts(formattedProducts);

        const uniqueCategories = [
          ...new Set(formattedProducts.map((product) => product.category)),
        ];
        setCategories(uniqueCategories);

        setError(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError(true);
        toast.error("Erro ao carregar produtos.");
      } finally {
        setLoading(false);
        isFetchingProductsRef.current = false;
      }
    };

    fetchProducts();

    // Realtime: se imagem principal mudar no admin (products.image_url), atualiza Home sem precisar abrir "Opções"
    const channel = supabase
      .channel("home-products-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper function to compare addons
  const compareAddons = (addons1?: ProductAddon[], addons2?: ProductAddon[]): boolean => {
    if ((!addons1 && addons2) || (addons1 && !addons2)) return false;
    if (!addons1 && !addons2) return true;
    if (addons1!.length !== addons2!.length) return false;

    return addons1!.every((itemAddon) => {
      const matchingAddon = addons2!.find((a) => a.id === itemAddon.id);
      return (
        matchingAddon && matchingAddon.quantity === itemAddon.quantity
      );
    });
  };

  // Memoized cart handler to improve performance
  const handleAddToCart = useCallback(
    (
      product: Product,
      quantity = 1,
      selectedAddons?: ProductAddon[],
      notes?: string,
      selectedConfigurations?: Record<string, any>,
      configurationPrice?: number
    ) => {
      setCartItems((prevItems) => {
        const productCouponMatch = (notes || '').match(/\bCupom-produto:\s*([A-Z0-9_-]+)\b/i);
        const productCouponCode = productCouponMatch ? String(productCouponMatch[1]).toUpperCase() : undefined;

        const productCouponDiscountMatch = (notes || '').match(/\bCupom-produto-desconto:\s*([0-9]+(?:\.[0-9]+)?)\b/i);
        const productCouponDiscountTotal = productCouponDiscountMatch
          ? Number(productCouponDiscountMatch[1])
          : undefined;

        const isQuickAdd =
          product.addons && product.addons.length > 0 && !selectedAddons;

        if (isQuickAdd) {
          const existingItemIndex = prevItems.findIndex(
            (item) =>
              item.product.id === product.id &&
              (!item.selectedAddons || item.selectedAddons.length === 0)
          );

          if (existingItemIndex >= 0) {
            const updatedItems = [...prevItems];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + 1,
            };
            return updatedItems;
          } else {
            return [...prevItems, { product, quantity: 1 }];
          }
        } else {
          // Sempre criar um novo item separado (não agrupar itens idênticos)
          return [
            ...prevItems,
            {
              product,
              quantity,
              selectedAddons,
              selectedConfigurations,
              configurationPrice: configurationPrice || 0,
              notes,
              productCouponCode,
              productCouponDiscountTotal,
            },
          ];
        }
      });

      toast.success(`${product.name} foi adicionado ao seu pedido`);
    },
    []
  );

  const handleRemoveFromCart = useCallback((productId: string, itemIndex: number) => {
    setCartItems((prevItems) => {
      const targetItem = prevItems[itemIndex];

      if (targetItem.quantity > 1) {
        return prevItems.map((item, idx) =>
          idx === itemIndex ? { ...item, quantity: item.quantity - 1 } : item
        );
      } else {
        return prevItems.filter((_, idx) => idx !== itemIndex);
      }
    });
  }, []);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = cartItems.reduce((sum, item) => {
    let itemTotal = item.product.price * item.quantity;

    if (item.selectedAddons && item.selectedAddons.length > 0) {
      const addonsTotal = item.selectedAddons.reduce(
        (addonSum, addon) => addonSum + addon.price * (addon.quantity || 1),
        0
      );
      itemTotal += addonsTotal * item.quantity;
    }

    if (item.configurationPrice && item.configurationPrice > 0) {
      itemTotal += item.configurationPrice * item.quantity;
    }

    if (item.productCouponDiscountTotal && item.productCouponDiscountTotal > 0) {
      itemTotal -= item.productCouponDiscountTotal;
    }

    return sum + itemTotal;
  }, 0);

  const handleCartToggle = useCallback((isOpen: boolean) => {
    setCartOpen(isOpen);
  }, []);

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-gray-50">
      <RestaurantHeader />

      <div className="flex flex-col flex-1">
        <div className="flex-1 p-4">
          <div className="max-w-5xl mx-auto">
            <ActiveOrderBanner />

            <div className="mb-6">
              <Tabs defaultValue="menu">
                <TabsList className="w-full">
                  <TabsTrigger value="menu" className="flex-1">
                    Menu
                  </TabsTrigger>
                  {/* <TabsTrigger value="reviews" className="flex-1">
                    Avaliações
                  </TabsTrigger> */}
                  <TabsTrigger value="info" className="flex-1">
                    Informações
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="menu" className="pt-4">
                  <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar produtos..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <CategoryFilter
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                  />

                  <ProductList
                    products={filteredProducts}
                    onAddToCart={handleAddToCart}
                    isLoading={loading}
                    isError={error}
                  />
                </TabsContent>
                <TabsContent value="reviews">
                  <div className="py-8 text-center">
                    <h3 className="text-lg font-medium mb-2">
                      Avaliações dos clientes
                    </h3>
                    <div className="flex justify-center items-center gap-2 mb-4">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <Star className="h-5 w-5 text-gray-300" />
                      {/* <span className="text-lg font-bold ml-2">4.2</span> */}
                    </div>
                    <p className="text-muted-foreground">
                      Baseado em 120 avaliações
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="info">
                  <div className="py-6">
                    <h3 className="text-lg font-medium mb-4">Informações do restaurante</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="shadow-sm">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Info className="h-4 w-4 text-delivery-500" />
                            Sobre
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {restaurant?.description && restaurant.description.trim() !== ""
                              ? restaurant.description
                              : "Descrição não disponível"}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="shadow-sm">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Phone className="h-4 w-4 text-delivery-500" />
                            Contato
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground">
                            {restaurant?.phone && restaurant.phone.trim() !== ""
                              ? restaurant.phone
                              : "Telefone não disponível"}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="shadow-sm">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-delivery-500" />
                            Endereço
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {restaurant?.address || "Endereço não disponível"}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="shadow-sm">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4 text-delivery-500" />
                            Funcionamento
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {getTodayBusinessHours()}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <FloatingCart
        cartItems={cartItems}
        onAddItem={handleAddToCart}
        onRemoveItem={handleRemoveFromCart}
        totalItems={totalItems}
        totalPrice={totalPrice}
        onOpenChange={handleCartToggle}
      />
      </div>
    </TooltipProvider>
  );
}
