import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'

export default function OrderConfirmationPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/orders/${id}/`)
      .then(({ data }) => setOrder(data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-gray-800 rounded-2xl shadow-lg shadow-gray-900/50 p-10">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Order Confirmed!</h1>
        <p className="text-gray-500 mb-6">Thank you for your purchase. Your order has been placed successfully.</p>

        {order && (
          <div className="bg-gray-950 rounded-xl p-6 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Order Number</span>
              <span className="font-semibold text-gray-100">#{order.id}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Total</span>
              <span className="font-bold text-indigo-600">
                ${order.total != null ? parseFloat(order.total).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Status</span>
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium capitalize">
                {order.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Shipping to</span>
              <span className="text-gray-100 text-sm text-right">
                {order.shipping_address}, {order.shipping_city}, {order.shipping_country}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Link to={`/orders/${id}`}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium">
            View Order
          </Link>
          <Link to="/products"
            className="border border-gray-600 text-gray-200 px-6 py-2.5 rounded-lg hover:bg-gray-950 font-medium">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
