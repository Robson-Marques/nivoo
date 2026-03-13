// Hook para gerenciar a exibição de preços para produtos com base R$0,00

export const useZeroPriceLogic = () => {
  /**
   * Verifica se um produto tem preço base zero
   * Se sim, o preço não deve ser exibido e sim será calculado pelos adicionais
   */
  const isZeroPriceProduct = (price: number): boolean => {
    return price === 0 || price === null || price === undefined;
  };

  /**
   * Retorna a classe CSS para esconder o preço se for zero
   */
  const getPriceVisibilityClass = (price: number): string => {
    return isZeroPriceProduct(price) ? 'hidden' : '';
  };

  /**
   * Formata o preço para exibição, retornando vazio se for zero
   */
  const formatPriceDisplay = (price: number): string => {
    if (isZeroPriceProduct(price)) {
      return ''; // Retorna vazio se for R$0,00
    }
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  /**
   * Calcula o preço total de um produto baseado em seus adicionais
   * Para produtos com preço base R$0,00
   */
  const calculateTotalFromAddons = (addons: Array<{ price: number; quantity: number }>): number => {
    return addons.reduce((sum, addon) => sum + addon.price * (addon.quantity || 1), 0);
  };

  /**
   * Retorna informação de preço para exibição no carrinho
   */
  const getPriceInfo = (
    basePrice: number,
    addonsPrice: number = 0,
    quantity: number = 1
  ): { displayPrice: string; totalPrice: number; isZeroBased: boolean } => {
    const isZeroBased = isZeroPriceProduct(basePrice);
    const unitPrice = basePrice + addonsPrice;
    const totalPrice = unitPrice * quantity;

    return {
      displayPrice: isZeroBased ? '' : `R$ ${unitPrice.toFixed(2).replace('.', ',')}`,
      totalPrice,
      isZeroBased,
    };
  };

  return {
    isZeroPriceProduct,
    getPriceVisibilityClass,
    formatPriceDisplay,
    calculateTotalFromAddons,
    getPriceInfo,
  };
};

export default useZeroPriceLogic;
