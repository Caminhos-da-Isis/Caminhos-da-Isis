import {
  useEffect,
  useState,
} from 'react';

export type CartItem = {
  id: number;
  nome: string;
  preco: number;
  categoria: string;
  quantidade: number;
};

const STORAGE_KEY =
  'islp-tarot-cart';

function readCart(): CartItem[] {
  try {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function saveCart(
  items: CartItem[]
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items)
  );

  window.dispatchEvent(
    new CustomEvent(
      'cart-updated',
      {
        detail: items,
      }
    )
  );
}

export function getCart(): CartItem[] {
  return readCart();
}

export function addToCart(
  item: Omit<
    CartItem,
    'quantidade'
  >
) {
  const current =
    readCart();

  const existing =
    current.find(
      (cartItem) =>
        cartItem.id ===
        item.id
    );

  let updated: CartItem[];

  if (existing) {
    updated =
      current.map(
        (cartItem) =>
          cartItem.id ===
          item.id
            ? {
                ...cartItem,

                quantidade:
                  cartItem.quantidade +
                  1,
              }
            : cartItem
      );
  } else {
    updated = [
      ...current,

      {
        ...item,
        quantidade: 1,
      },
    ];
  }

  saveCart(updated);
}

export function removeFromCart(
  id: number
) {
  const current =
    readCart();

  saveCart(
    current.filter(
      (item) =>
        item.id !== id
    )
  );
}

export function increaseCartItem(
  id: number
) {
  const current =
    readCart();

  saveCart(
    current.map(
      (item) =>
        item.id === id
          ? {
              ...item,

              quantidade:
                item.quantidade +
                1,
            }
          : item
    )
  );
}

export function decreaseCartItem(
  id: number
) {
  const current =
    readCart();

  const updated =
    current
      .map(
        (item) =>
          item.id === id
            ? {
                ...item,

                quantidade:
                  item.quantidade -
                  1,
              }
            : item
      )
      .filter(
        (item) =>
          item.quantidade >
          0
      );

  saveCart(updated);
}

export function clearCart() {
  saveCart([]);
}

export function useCart() {
  const [
    items,
    setItems,
  ] = useState<
    CartItem[]
  >(() => readCart());

  useEffect(() => {
    function updateCart() {
      setItems(
        readCart()
      );
    }

    window.addEventListener(
      'cart-updated',
      updateCart
    );

    window.addEventListener(
      'storage',
      updateCart
    );

    return () => {
      window.removeEventListener(
        'cart-updated',
        updateCart
      );

      window.removeEventListener(
        'storage',
        updateCart
      );
    };
  }, []);

  const quantidadeTotal =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        item.quantidade,
      0
    );

  const valorTotal =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        item.preco *
          item.quantidade,
      0
    );

  return {
    items,
    quantidadeTotal,
    valorTotal,
    addToCart,
    removeFromCart,
    increaseCartItem,
    decreaseCartItem,
    clearCart,
  };
}
