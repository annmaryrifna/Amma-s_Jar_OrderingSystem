
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

export interface CartItem {
    product_id: number;
    product_name: string;
    image: string | null;
    quantity: number;
    unit: string;
    price: number;
    price_quantity: number;
    total_price: number;
    purchase_options: number[];
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getSavedCart = (): CartItem[] => {
    try {
        const savedCart = sessionStorage.getItem("cart");

        if (!savedCart) return [];

        const parsedCart = JSON.parse(savedCart);

        if (!Array.isArray(parsedCart)) return [];

        return parsedCart.filter(
            (item) =>
                Number.isFinite(Number(item.price_quantity)) &&
                Number(item.price_quantity) > 0
        );
    } catch {
        return [];
    }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>(getSavedCart);

    useEffect(() => {
        sessionStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (item: CartItem) => {
        setCartItems((previousItems) => {
            const existingItem = previousItems.find(
                (cartItem) => cartItem.product_id === item.product_id
            );

            if (existingItem) {
                return previousItems.map((cartItem) =>
                    cartItem.product_id === item.product_id ? item : cartItem
                );
            }

            return [...previousItems, item];
        });
    };
    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) return;

        setCartItems((previousItems) =>
            previousItems.map((item) =>
                item.product_id === productId
                    ? {
                        ...item,
                        quantity,
                        total_price: Number(
                            ((item.price / item.price_quantity) * quantity).toFixed(2)
                        ),
                    }
                    : item
            )
        );
    };
    const removeFromCart = (productId: number) => {
        setCartItems((previousItems) =>
            previousItems.filter((item) => item.product_id !== productId)
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const cartCount = cartItems.length;

    const cartTotal = cartItems.reduce(
        (total, item) => total + item.total_price,
        0
    );

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartCount,
                cartTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error("useCart must be used inside CartProvider");
    }

    return context;
};
