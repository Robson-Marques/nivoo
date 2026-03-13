import React, { useState } from "react";
import { Product, ProductAddon } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  MinusCircle,
  PlusCircle,
  Trash2,
  Receipt,
  PlusCircle as Plus,
  MinusCircle as Minus,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  Store,
  Package2,
  Truck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentMethods } from "@/hooks/useOrders";
import {
  createPromotionNumberRecord,
  getActivePromotionsForOrder,
} from "@/services/promotionNumberService";
import { useZeroPriceLogic } from "@/hooks/useZeroPriceLogic";

interface PDVCartProps {
  items: {
    product: Product;
    quantity: number;
    selectedAddons?: ProductAddon[];
    selectedConfigurations?: Record<string, any>;
    configurationPrice?: number;
    notes?: string;
  }[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function PDVCart({ items, onUpdateQuantity, onRemove }: PDVCartProps) {
  const { toast } = useToast();
  const { isZeroPriceProduct } = useZeroPriceLogic();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [orderType, setOrderType] = useState<"instore" | "takeaway" | "delivery">(
    "instore"
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const { data: paymentMethods = [], isLoading: loadingPaymentMethods } =
    usePaymentMethods();

  // Definir o método de pagamento padrão quando os métodos são carregados
  React.useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethodId) {
      setPaymentMethodId(paymentMethods[0].id);
    }
  }, [paymentMethods, paymentMethodId]);

  const subtotal = items.reduce((sum, item) => {
    let itemTotal = item.product.price * item.quantity;
    if (item.selectedAddons) {
      itemTotal +=
        item.selectedAddons.reduce(
          (addonSum, addon) => addonSum + addon.price * (addon.quantity || 1),
          0
        ) * item.quantity;
    }

    if (item.configurationPrice && item.configurationPrice > 0) {
      itemTotal += item.configurationPrice * item.quantity;
    }
    return sum + itemTotal;
  }, 0);

  const taxAmount = (subtotal * taxPercentage) / 100;
  const totalAfterTax = subtotal + taxAmount + deliveryFee;
  const finalTotal = Math.max(0, totalAfterTax - discountValue);

  const getIconForPaymentMethod = (iconName?: string) => {
    switch (iconName) {
      case "credit-card":
        return <CreditCard className="h-4 w-4 mr-2" />;
      case "banknote":
        return <Banknote className="h-4 w-4 mr-2" />;
      case "qr-code":
        return <QrCode className="h-4 w-4 mr-2" />;
      case "wallet":
        return <Wallet className="h-4 w-4 mr-2" />;
      default:
        return <CreditCard className="h-4 w-4 mr-2" />;
    }
  };

  const handleFinishOrder = async () => {
    if (items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho para finalizar o pedido",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethodId) {
      toast({
        title: "Selecione um método de pagamento",
        description: "É necessário selecionar um método de pagamento",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const resolvedCustomerName = customerName.trim() || "Cliente Balcão";
      const resolvedCustomerPhone = customerPhone.trim() || "-";

      const resolvedDeliveryAddress =
        orderType === "delivery" ? deliveryAddress.trim() || null : null;
      const resolvedTableNumber =
        orderType === "instore" ? tableNumber.trim() || null : null;

      const resolvedScheduledFor =
        isScheduled && scheduledFor.trim() ? new Date(scheduledFor).toISOString() : null;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: resolvedCustomerName,
          customer_phone: resolvedCustomerPhone,
          status: "pending",
          payment_method: paymentMethodId,
          payment_status: "paid",
          subtotal,
          discount: discountValue,
          total: finalTotal,
          order_type: orderType,
          delivery_address: resolvedDeliveryAddress,
          delivery_fee: orderType === "delivery" ? deliveryFee : 0,
          table_number: resolvedTableNumber,
          scheduled_for: resolvedScheduledFor,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Gerar números de promoções elegíveis (não falha a venda se der erro)
      try {
        const eligiblePromotions = await getActivePromotionsForOrder(subtotal);
        if (eligiblePromotions && eligiblePromotions.length > 0) {
          await Promise.all(
            eligiblePromotions.map((promotion) =>
              createPromotionNumberRecord(
                promotion.id,
                order.id,
                resolvedCustomerName,
                resolvedCustomerPhone,
                undefined
              )
            )
          );
        }
      } catch (promoError) {
        console.warn("Falha ao gerar números de promoção (PDV):", promoError);
      }

      // Criar itens do pedido sem os adicionais
      const orderItems = items.map((item) => {
        const addonsTotalPrice = (item.selectedAddons || []).reduce(
          (addonSum, addon) => addonSum + addon.price * (addon.quantity || 1),
          0
        );

        const configurationTotalPrice = item.configurationPrice || 0;
        const unitPriceWithExtras = item.product.price + addonsTotalPrice + configurationTotalPrice;
        const totalPriceWithExtras = unitPriceWithExtras * item.quantity;

        return {
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: Number(unitPriceWithExtras.toFixed(2)),
          total_price: Number(totalPriceWithExtras.toFixed(2)),
          notes: item.notes || null,
        };
      });

      // Inserir itens do pedido
      const { data: insertedItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)
        .select();

      if (itemsError) throw itemsError;

      // Processar adicionais para cada item
      if (insertedItems) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const insertedItem = insertedItems[i];

          // Se o item tem adicionais, inserir na tabela order_item_addons
          if (
            item.selectedAddons &&
            item.selectedAddons.length > 0 &&
            insertedItem
          ) {
            const addonsToInsert = item.selectedAddons.map((addon) => ({
              order_item_id: insertedItem.id,
              addon_id: addon.id,
              quantity: addon.quantity || 1,
              unit_price: addon.price,
              total_price: addon.price * (addon.quantity || 1),
            }));

            const { error: addonsError } = await supabase
              .from("order_item_addons")
              .insert(addonsToInsert);

            if (addonsError) {
              console.error("Erro ao inserir adicionais:", addonsError);
              // Continuar mesmo com erro nos adicionais
            }
          }

          // Se o item tem configurações/personalizações, inserir na tabela order_item_configurations
          if (
            insertedItem &&
            item.selectedConfigurations &&
            Object.keys(item.selectedConfigurations).length > 0
          ) {
            const configurationPrice = item.configurationPrice || 0;
            const { error: configError } = await supabase
              .from("order_item_configurations")
              .insert({
                order_item_id: insertedItem.id,
                configurations: item.selectedConfigurations,
                additional_price: Number(configurationPrice.toFixed(2)),
              });

            if (configError) {
              console.error(
                "Aviso: Erro ao inserir configurações (tabela pode não existir):",
                configError
              );
              // Não falha a venda
            }
          }
        }
      }

      toast({
        title: "Pedido finalizado",
        description: `Pedido #${order.number} criado com sucesso!`,
      });

      // Clear cart
      items.forEach((item) => onRemove(item.product.id));
      // Resetar outros valores
      setTaxPercentage(0);
      setDeliveryFee(0);
      setDiscountValue(0);
      setOrderType("instore");
      setCustomerName("");
      setCustomerPhone("");
      setDeliveryAddress("");
      setTableNumber("");
      setIsScheduled(false);
      setScheduledFor("");
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Erro ao criar pedido",
        description: "Não foi possível finalizar o pedido",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Carrinho</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map(({ product, quantity, selectedAddons, selectedConfigurations, configurationPrice, notes }) => (
              <div key={product.id} className="flex items-start gap-2 border-b pb-3">
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">{product.name}</p>
                  {!isZeroPriceProduct(product.price) && (
                    <p className="text-sm text-muted-foreground">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(product.price)}
                      {quantity > 1 && ` x ${quantity}`}
                    </p>
                  )}
                  
                  {/* Adicionais */}
                  {selectedAddons && selectedAddons.length > 0 && (
                    <div className="mt-2 space-y-1 pl-2 border-l-2 border-blue-200">
                      {selectedAddons.map((addon) => (
                        <p
                          key={addon.id}
                          className="text-xs text-muted-foreground flex justify-between"
                        >
                          <span>
                            + {addon.name}
                            {addon.quantity > 1 ? ` (${addon.quantity}x)` : ""}
                          </span>
                          <span className="font-medium text-foreground">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(addon.price * addon.quantity)}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {/* Configurações Personalizadas */}
                  {selectedConfigurations &&
                    Object.keys(selectedConfigurations).length > 0 && (
                      <div className="mt-2 space-y-1 pl-2 border-l-2 border-amber-200">
                        {Object.entries(selectedConfigurations).map(
                          ([key, value], idx) => {
                            // Se value é um objeto com label e additionalPrice (radio/select)
                            if (
                              typeof value === "object" &&
                              !Array.isArray(value) &&
                              value?.label
                            ) {
                              return (
                                <p
                                  key={idx}
                                  className="text-xs text-muted-foreground flex justify-between"
                                >
                                  <span>• {value.label}</span>
                                  {value.additionalPrice &&
                                    value.additionalPrice > 0 && (
                                      <span className="font-medium text-foreground">
                                        +
                                        {new Intl.NumberFormat("pt-BR", {
                                          style: "currency",
                                          currency: "BRL",
                                        }).format(value.additionalPrice)}
                                      </span>
                                    )}
                                </p>
                              );
                            }

                            // Se value é um array (checkbox)
                            if (Array.isArray(value)) {
                              return value.map((v: any, vIdx) => (
                                <p
                                  key={`${idx}-${vIdx}`}
                                  className="text-xs text-muted-foreground flex justify-between"
                                >
                                  <span>• {v.label}</span>
                                  {v.additionalPrice &&
                                    v.additionalPrice > 0 && (
                                      <span className="font-medium text-foreground">
                                        +
                                        {new Intl.NumberFormat("pt-BR", {
                                          style: "currency",
                                          currency: "BRL",
                                        }).format(v.additionalPrice)}
                                      </span>
                                    )}
                                </p>
                              ));
                            }

                            // Se é apenas um string simples
                            return (
                              <p
                                key={idx}
                                className="text-xs text-muted-foreground"
                              >
                                • {String(value)}
                              </p>
                            );
                          }
                        )}
                      </div>
                    )}
                  
                  {/* Notas */}
                  {notes && (
                    <p className="text-xs text-muted-foreground italic mt-2">
                      📝 {notes}
                    </p>
                  )}
                  
                  {/* Subtotal */}
                  <div className="flex justify-between mt-2 pt-2 border-t text-sm font-semibold">
                    <span>Subtotal:</span>
                    <span className="text-delivery-700">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(
                        (product.price * quantity) +
                        (selectedAddons || []).reduce(
                          (sum, addon) => sum + addon.price * (addon.quantity || 1),
                          0
                        ) +
                        (configurationPrice || 0)
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onRemove(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Nenhum item no carrinho
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="w-full space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Tipo do pedido</Label>
              <RadioGroup
                value={orderType}
                onValueChange={(v) => setOrderType(v as any)}
                className="grid grid-cols-3 gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="instore" id="pdv-type-instore" />
                  <Label htmlFor="pdv-type-instore" className="flex items-center">
                    <Store className="h-4 w-4 mr-2" />
                    Balcão
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="takeaway" id="pdv-type-takeaway" />
                  <Label htmlFor="pdv-type-takeaway" className="flex items-center">
                    <Package2 className="h-4 w-4 mr-2" />
                    Retirada
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="pdv-type-delivery" />
                  <Label htmlFor="pdv-type-delivery" className="flex items-center">
                    <Truck className="h-4 w-4 mr-2" />
                    Entrega
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do cliente (opcional)</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: João"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone (opcional)</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ex: (11) 99999-9999"
                />
              </div>
            </div>

            {orderType === "delivery" && (
              <div className="space-y-2">
                <Label>Endereço (opcional)</Label>
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Rua, número, bairro"
                />
              </div>
            )}

            {orderType === "instore" && (
              <div className="space-y-2">
                <Label>Mesa (opcional)</Label>
                <Input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ex: 12"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agendar (opcional)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    Definir horário de preparo/entrega
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data/Hora</Label>
                <Input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  disabled={!isScheduled}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Taxa (%)</Label>
              <Input
                type="number"
                min="0"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Desconto (R$)</Label>
              <Input
                type="number"
                min="0"
                max={totalAfterTax}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Taxa de entrega (R$) (opcional)</Label>
            <Input
              type="number"
              min="0"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(Number(e.target.value))}
              disabled={orderType !== "delivery"}
            />
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            {loadingPaymentMethods ? (
              <div className="py-2 text-center text-sm text-muted-foreground">
                Carregando métodos de pagamento...
              </div>
            ) : (
              <RadioGroup
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
                className="grid grid-cols-2 gap-4"
              >
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={method.id}
                      id={`payment-${method.id}`}
                    />
                    <Label
                      htmlFor={`payment-${method.id}`}
                      className="flex items-center"
                    >
                      {getIconForPaymentMethod(method.icon)}
                      {method.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Taxa ({taxPercentage}%)
              </span>
              <span>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(taxAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa de entrega</span>
              <span>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(orderType === "delivery" ? deliveryFee : 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto</span>
              <span className="text-green-600">
                -
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(discountValue)}
              </span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(finalTotal)}
              </span>
            </div>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleFinishOrder}
          disabled={items.length === 0 || isSubmitting || !paymentMethodId}
        >
          {isSubmitting ? "Processando..." : "Finalizar Venda"}
        </Button>
      </CardFooter>
    </Card>
  );
}
