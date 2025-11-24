import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { backendUrl } from '../config/api';

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
    try { localStorage.setItem('cart', JSON.stringify(items)); } catch { }
  }, [items]);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'cart') {
        try { setItems(JSON.parse(e.newValue || '[]') || []); } catch { }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Refresh prices from backend on mount
  useEffect(() => {
    const refreshPrices = async () => {
      try {
        // Import backendUrl dynamically or assume it's available in scope if imported at top
        // Since we can't easily change imports with replace_file_content in this block without context,
        // we'll assume backendUrl is imported. If not, we'll need to add the import.
        // Checking file content... it is NOT imported. I will add the import in a separate step or use a relative path string if needed,
        // but better to add the import. For now, let's write the logic assuming I'll add the import.
        // backendUrl is imported at the top

        const response = await fetch(backendUrl('get_products.php'));
        if (!response.ok) return;
        const data = await response.json();

        let products = [];
        if (data && data.success && Array.isArray(data.data)) {
          products = data.data;
        } else if (Array.isArray(data)) {
          products = data;
        }

        if (products.length > 0) {
          setItems(prevItems => {
            let changed = false;
            const newItems = prevItems.map(item => {
              const freshProduct = products.find(p => Number(p.id) === Number(item.id));
              if (freshProduct) {
                const freshPrice = Number(freshProduct.price) || 0;
                let itemChanged = false;
                let newItem = { ...item };

                if (freshPrice !== item.price) {
                  newItem.price = freshPrice;
                  itemChanged = true;
                }

                // Try to update image if missing or if backend provides a cover image
                // Assuming freshProduct might have 'image' or 'cover_image' property
                const freshImage = freshProduct.cover_image || freshProduct.main_image || freshProduct.image;
                if (freshImage && (!item.image || item.image !== freshImage)) {
                  // Only update if we really want to enforce backend image, 
                  // but for now let's just fill it if missing to avoid overwriting specific variant images if we had them
                  if (!item.image) {
                    newItem.image = freshImage;
                    itemChanged = true;
                  }
                }

                if (itemChanged) {
                  changed = true;
                  return newItem;
                }
              }
              return item;
            });
            return changed ? newItems : prevItems;
          });
        }
      } catch (e) {
        console.error("Error refreshing cart prices:", e);
      }
    };

    refreshPrices();
  }, []);

  const addItem = (payload) => {
    // payload: {id, name, price, color, quantity, image}
    const qty = Math.max(1, Number(payload.quantity || 1));
    setItems((prev) => {
      const keyMatch = (it) => it.id === payload.id && (it.color || '') === (payload.color || '');
      const idx = prev.findIndex(keyMatch);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        // Update image if provided and missing
        if (payload.image && !next[idx].image) {
          next[idx].image = payload.image;
        }
        return next;
      }
      return [...prev, {
        id: payload.id,
        name: payload.name,
        price: Number(payload.price) || 0,
        color: payload.color || null,
        quantity: qty,
        image: payload.image || null
      }];
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
    const totalItems = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    const totalPrice = items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0);
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
