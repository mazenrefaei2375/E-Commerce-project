import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function OrderHistoryPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      api.get('/orders/')
        .then(({ data }) => setOrders(data.results || data))
        .finally(() => setLoading(false))
    }
  }, [user])

  if (!user) return <div className="text-center py-20 text-gray-500">Please login to view orders</div>
  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm  p-12 text-center text-gray-500">
          <p>No orders yet</p>
          <Link to="/products" className="text-blue-800 hover:underline mt-2 inline-block">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`}
              className="block bg-white rounded-xl shadow-sm  p-6 hover:shadow-md shadow-gray-200 transition-shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                  <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium
                    ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-800'}`}>
                    {order.status}
                  </span>
                  <p className="text-lg font-bold text-blue-800 mt-1">${parseFloat(order.total).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{order.items_count} items</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
