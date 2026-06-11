import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function CheckoutPage() {
  const { user } = useAuth()
  const { cart, fetchCart } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    shipping_address: '', shipping_city: '', shipping_country: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 px-4 text-center">
        <p className="text-gray-600 mb-4">Please login to checkout</p>
        <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/orders/checkout/', form)
      await fetchCart()
      navigate(`/orders/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
            <h2 className="font-semibold text-lg">Shipping Address</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea value={form.shipping_address} onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                rows={2} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" value={form.shipping_city} onChange={(e) => setForm({ ...form, shipping_city: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" value={form.shipping_country} onChange={(e) => setForm({ ...form, shipping_country: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
            </div>
            <button type="submit" disabled={loading || cart.items?.length === 0}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
              {loading ? 'Processing...' : 'Place Order (Simulated Payment)'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 h-fit sticky top-20">
          <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
          {cart.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{item.product_title} x{item.quantity}</span>
              <span>${parseFloat(item.subtotal).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
            <span>Total</span>
            <span className="text-indigo-600">${parseFloat(cart.total).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
