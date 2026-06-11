import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered']

export default function OrderDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/orders/${id}/`)
      .then(({ data }) => setOrder(data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>
  if (!order) return <div className="text-center py-20 text-gray-400">Order not found</div>

  const canUpdate = user?.is_seller || user?.is_staff

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Order #{order.id}</h1>

      {/* Status */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold mb-4">Order Status</h2>
        <div className="flex items-center">
          {STATUS_FLOW.map((status, i) => (
            <div key={status} className="flex-1 flex items-center">
              <div className={`w-4 h-4 rounded-full ${STATUS_FLOW.indexOf(order.status) >= i ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
              <span className={`text-xs ml-1 capitalize ${STATUS_FLOW.indexOf(order.status) >= i ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                {status}
              </span>
              {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${STATUS_FLOW.indexOf(order.status) > i ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold mb-4">Items</h2>
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between py-3 border-b last:border-0">
            <div>
              <Link to={`/products/${item.product}`} className="font-medium text-gray-800 hover:text-indigo-600">
                {item.product_title}
              </Link>
              <p className="text-sm text-gray-500">${parseFloat(item.price).toFixed(2)} x {item.quantity}</p>
            </div>
            <span className="font-medium">${parseFloat(item.subtotal).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-lg pt-4 border-t mt-4">
          <span>Total</span>
          <span className="text-indigo-600">${parseFloat(order.total).toFixed(2)}</span>
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold mb-4">Shipping Details</h2>
        <p className="text-gray-600">{order.shipping_address}</p>
        <p className="text-gray-600">{order.shipping_city}, {order.shipping_country}</p>
      </div>

      {canUpdate && (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold mb-3">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            {STATUS_FLOW.map((status) => (
              <button key={status} onClick={() => {
                api.put(`/orders/${order.id}/status/`, { status }).then(({ data }) => setOrder(data))
              }}
                disabled={order.status === status}
                className={`px-4 py-2 rounded-lg capitalize text-sm font-medium
                  ${order.status === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'}`}>
                {status}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
