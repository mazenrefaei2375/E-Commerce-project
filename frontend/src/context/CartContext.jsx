import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState({ items: [], total: 0, item_count: 0 })
  const [loading, setLoading] = useState(false)

  const sessionId = () => localStorage.getItem('cart_session_id')

  const fetchCart = useCallback(async () => {
    if (user) {
      setLoading(true)
      try {
        const { data } = await api.get('/cart/')
        setCart(data)
      } catch {
        setCart({ items: [], total: 0, item_count: 0 })
      }
      setLoading(false)
    } else {
      const sid = sessionId()
      if (sid) {
        setLoading(true)
        try {
          const { data } = await api.get('/cart/', { headers: { 'X-Session-ID': sid } })
          setCart(data)
        } catch {
          setCart({ items: [], total: 0, item_count: 0 })
        }
        setLoading(false)
      }
    }
  }, [user])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const addToCart = async (productId, quantity = 1) => {
    const config = {}
    if (!user) {
      let sid = sessionId()
      if (!sid) {
        const { data } = await api.get('/cart/')
        sid = data.id
        localStorage.setItem('cart_session_id', sid)
      }
      config.headers = { 'X-Session-ID': sid }
    }
    const { data } = await api.post('/cart/items/', { product: productId, quantity }, config)
    setCart(data)
    return data
  }

  const updateItem = async (itemId, quantity) => {
    const config = {}
    if (!user) {
      config.headers = { 'X-Session-ID': sessionId() }
    }
    const { data } = await api.put(`/cart/items/${itemId}/`, { quantity }, config)
    setCart(data)
  }

  const removeItem = async (itemId) => {
    const config = {}
    if (!user) {
      config.headers = { 'X-Session-ID': sessionId() }
    }
    const { data } = await api.delete(`/cart/items/${itemId}/`, config)
    setCart(data)
  }

  const mergeCart = async (guestSessionId) => {
    const { data } = await api.post('/cart/merge/', { session_id: guestSessionId })
    localStorage.removeItem('cart_session_id')
    setCart(data)
  }

  return (
    <CartContext.Provider value={{ cart, loading, fetchCart, addToCart, updateItem, removeItem, mergeCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
