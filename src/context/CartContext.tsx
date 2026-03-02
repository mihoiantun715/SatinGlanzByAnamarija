'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '@/lib/types';
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load cart from Firestore when user logs in
  useEffect(() => {
    if (user) {
      loadCartFromFirestore();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  // Load cart from Firestore
  const loadCartFromFirestore = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const cartDoc = await getDoc(doc(db, 'carts', user.uid));
      if (cartDoc.exists()) {
        const cartData = cartDoc.data();
        const cartItems = cartData.items || [];
        
        // Refresh product data to get latest box dimensions
        await refreshProductData(cartItems);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh product data from Firestore to get latest box dimensions
  const refreshProductData = async (cartItems: CartItem[]) => {
    if (cartItems.length === 0) {
      setItems([]);
      return;
    }
    
    try {
      const productsSnap = await getDocs(collection(db, 'products'));
      const productsMap = new Map();
      productsSnap.docs.forEach(doc => {
        productsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      // Update cart items with fresh product data
      const updatedItems = cartItems.map(item => {
        const freshProduct = productsMap.get(item.product.id);
        if (freshProduct) {
          return {
            ...item,
            product: {
              ...item.product,
              ...freshProduct,
            }
          };
        }
        return item;
      }).filter(item => item.product); // Remove items where product no longer exists

      setItems(updatedItems);
    } catch (error) {
      console.error('Failed to refresh product data:', error);
      setItems(cartItems);
    }
  };

  // Save cart to Firestore
  const saveCartToFirestore = async (updatedItems: CartItem[]) => {
    if (!user) return;

    try {
      await setDoc(doc(db, 'carts', user.uid), {
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  };

  const addToCart = (product: Product, quantity: number = 1, color?: string) => {
    const updatedItems = (() => {
      const existing = items.find(item => item.product.id === product.id && item.selectedColor === color);
      if (existing) {
        return items.map(item =>
          item.product.id === product.id && item.selectedColor === color
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...items, { product, quantity, selectedColor: color }];
    })();
    
    setItems(updatedItems);
    saveCartToFirestore(updatedItems);
  };

  const removeFromCart = (productId: string) => {
    const updatedItems = items.filter(item => item.product.id !== productId);
    setItems(updatedItems);
    saveCartToFirestore(updatedItems);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updatedItems = items.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    setItems(updatedItems);
    saveCartToFirestore(updatedItems);
  };

  const clearCart = async () => {
    setItems([]);
    if (user) {
      try {
        await deleteDoc(doc(db, 'carts', user.uid));
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, loading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
