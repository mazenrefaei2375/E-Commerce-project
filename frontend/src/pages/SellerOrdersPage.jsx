import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function SellerOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.is_seller) {
      api.get('/orders/seller/').then(({ data }) => setOrders(data.results || data)).finally(() => setLoading(false))
    }
  }, [user])

  if (!user?.is_seller) {
    return <div className="text-center py-20 text-gray-500">Please login as a seller</div>
  }
  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Sales</h1>
      {orders.length === 0 ? (
        <div className="bg-gray-800 rounded-xl shadow-sm shadow-gray-900 p-12 text-center text-gray-500">No orders yet</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`}
              className="block bg-gray-800 rounded-xl shadow-sm shadow-gray-900 p-6 hover:shadow-md shadow-gray-900/40 transition-shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-100">Order #{order.id}</h3>
                  <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium
                    ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-700 text-gray-200'}`}>
                    {order.status}
                  </span>
                  <p className="text-lg font-bold text-indigo-600 mt-1">${parseFloat(order.total).toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
