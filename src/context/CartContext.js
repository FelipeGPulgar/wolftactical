import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

function loadInitial() {
  try {
    const raw = localStorage.getItem('cart');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitial);

  // Persist on change
  useEffect(() => {
    try { localStorage.setItem('cart', JSON.stringify(items)); } catch {}
  }, [items]);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'cart') {
        try { setItems(JSON.parse(e.newValue || '[]') || []); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addItem = (payload) => {
    // payload: {id, name, price, color, quantity}
    const qty = Math.max(1, Number(payload.quantity || 1));
    setItems((prev) => {
      const keyMatch = (it) => it.id === payload.id && (it.color || '') === (payload.color || '');
      const idx = prev.findIndex(keyMatch);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { id: payload.id, name: payload.name, price: Number(payload.price)||0, color: payload.color || null, quantity: qty }];
    });
  };

  const removeItem = (id, color = null) => {
    setItems((prev) => prev.filter((it) => !(it.id === id && (it.color || null) === (color || null))));
  };

  const updateQuantity = (id, color, quantity) => {
    const qty = Math.max(1, Number(quantity || 1));
    setItems((prev) => prev.map((it) => (it.id === id && (it.color || null) === (color || null)) ? { ...it, quantity: qty } : it));
  };

  const clear = () => setItems([]);

  const { totalItems, totalPrice } = useMemo(() => {
    const totalItems = items.reduce((acc, it) => acc + (Number(it.quantity)||0), 0);
    const totalPrice = items.reduce((acc, it) => acc + (Number(it.price)||0) * (Number(it.quantity)||0), 0);
    return { totalItems, totalPrice };
  }, [items]);

  const value = useMemo(() => ({ items, addItem, removeItem, updateQuantity, clear, totalItems, totalPrice }), [items, totalItems, totalPrice]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
