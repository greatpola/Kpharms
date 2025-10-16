interface OrderItem {
    name: string;
    quantityToOrder: number;
}

export const placeOrder = async (items: OrderItem[]): Promise<string> => {
    console.log("Placing order for:", items);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!items || items.length === 0) {
        return "주문할 상품이 없습니다.";
    }

    const successfulOrders = items.map(item => `${item.name} ${item.quantityToOrder}개`);
    const responseMessage = `다음 품목에 대한 주문이 성공적으로 접수되었습니다: ${successfulOrders.join(', ')}. 2-3일 내로 도착 예정입니다.`;
    
    return responseMessage;
};
