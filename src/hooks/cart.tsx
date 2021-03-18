import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);
const PRODUCTS_ASYNCSTORAGE_KEY = '@GoMarketplace:products';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(
        PRODUCTS_ASYNCSTORAGE_KEY,
      );
      if (!storageProducts) return;
      setProducts(JSON.parse(storageProducts));
    }

    loadProducts();
  }, []);

  const updateProductsInStorage = useCallback(
    async (productsToStore: Product[]): Promise<void> => {
      await AsyncStorage.setItem(
        PRODUCTS_ASYNCSTORAGE_KEY,
        JSON.stringify(productsToStore),
      );
    },
    [],
  );

  const increment = useCallback(
    async (id: string) => {
      const updatedProducts = products.map(prod =>
        prod.id === id ? { ...prod, quantity: prod.quantity + 1 } : prod,
      );
      setProducts(updatedProducts);
      updateProductsInStorage(updatedProducts);
    },
    [products, updateProductsInStorage],
  );

  const addToCart = useCallback(
    async product => {
      const existentProduct = products.find(prod => prod.id === product.id);

      if (existentProduct) {
        increment(product.id);
        return;
      }

      const updatedProducts = [...products, { ...product, quantity: 1 }];
      setProducts(updatedProducts);
      updateProductsInStorage(updatedProducts);
    },
    [products, increment, updateProductsInStorage],
  );

  const decrement = useCallback(
    async (id: string) => {
      const existentProduct = products.find(prod => prod.id === id);
      if (!existentProduct) {
        return;
      }

      let updatedProducts;
      if (existentProduct.quantity <= 1) {
        updatedProducts = products.filter(product => product.id !== id);
      } else {
        updatedProducts = products.map(prod =>
          prod.id === id ? { ...prod, quantity: prod.quantity - 1 } : prod,
        );
      }

      setProducts(updatedProducts);
      updateProductsInStorage(updatedProducts);
    },
    [products, updateProductsInStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
