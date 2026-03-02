'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        const parsedItems = JSON.parse(saved);
        setItems(parsedItems);
        // Refresh product data from Firestore
        refreshProductData(parsedItems);
      } catch {
        setItems([]);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isRefreshing) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isRefreshing]);

  // Refresh product data from Firestore to get latest box dimensions
  const refreshProductData = async (cartItems: CartItem[]) => {
    if (cartItems.length === 0) return;
    
    setIsRefreshing(true);
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
      });

      setItems(updatedItems);
    } catch (error) {
      console.error('Failed to refresh product data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const addToCart = (product: Product, quantity: number = 1, color?: string) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedColor === color);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.selectedColor === color
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedColor: color }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
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
