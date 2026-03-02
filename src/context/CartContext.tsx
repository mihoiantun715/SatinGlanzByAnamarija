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
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const { user } = useAuth();

  // Load cart from localStorage on mount (for guest users)
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems([]);
      }
    }
    setInitialized(true);
  }, []);

  // Save to localStorage whenever cart changes (but only after initialization)
  useEffect(() => {
    if (initialized) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, initialized]);

  // Sync cart with Firestore when user logs in
  const syncCartWithFirestore = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const cartDoc = await getDoc(doc(db, 'carts', user.uid));
      const localCart = items;
      
      if (cartDoc.exists()) {
        const firestoreCart = cartDoc.data().items || [];
        // Merge local cart with Firestore cart
        const mergedCart = mergeCarts(localCart, firestoreCart);
        setItems(mergedCart);
      } else if (localCart.length > 0) {
        // Save local cart to Firestore
        await saveCartToFirestore(localCart);
      }
    } catch (error) {
      console.error('Failed to sync cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Merge two carts (combine quantities for same products)
  const mergeCarts = (cart1: CartItem[], cart2: CartItem[]): CartItem[] => {
    const merged = [...cart1];
    
    cart2.forEach(item2 => {
      const existing = merged.find(
        item1 => item1.product.id === item2.product.id && item1.selectedColor === item2.selectedColor
      );
      
      if (existing) {
        existing.quantity += item2.quantity;
      } else {
        merged.push(item2);
      }
    });
    
    return merged;
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

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
    if (user) {
      deleteDoc(doc(db, 'carts', user.uid)).catch(err => 
        console.error('Failed to clear Firestore cart:', err)
      );
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
