import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function AdminPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    if (user?.is_staff) {
      api.get('/admin/analytics/').then(({ data }) => setStats(data))
      api.get('/products/?page_size=100').then(({ data }) => setProducts(data.results || data))
        .finally(() => setLoading(false))
    }
  }, [user])

  const handleApprove = async (productId) => {
    await api.put(`/products/${productId}/`, { status: 'approved' })
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, status: 'approved' } : p))
  }

  const handleFeature = async (productId, featured) => {
    await api.put(`/products/${productId}/`, { featured: !featured })
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, featured: !featured } : p))
  }

  if (!user?.is_staff) return <div className="text-center py-20 text-gray-400">Access denied</div>
  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="flex gap-2 mb-6">
        {['dashboard', 'products'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg capitalize font-medium ${tab === t ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.total_users },
            { label: 'Total Products', value: stats.total_products },
            { label: 'Total Orders', value: stats.total_orders },
            { label: 'Revenue', value: `$${stats.total_revenue.toFixed(2)}` },
            { label: 'Pending Products', value: stats.pending_products },
            { label: 'Recent Orders', value: stats.recent_orders },
            { label: 'Recent Revenue', value: `$${stats.recent_revenue.toFixed(2)}` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center">
              <div>
                <span className="font-medium text-gray-800">{p.title}</span>
                <p className="text-sm text-gray-500">${parseFloat(p.price).toFixed(2)} · Seller: {p.seller_name || p.seller}</p>
              </div>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {p.status}
                </span>
                {p.status === 'pending' && (
                  <button onClick={() => handleApprove(p.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Approve</button>
                )}
                <button onClick={() => handleFeature(p.id, p.featured)}
                  className={`text-xs px-2 py-1 rounded ${p.featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {p.featured ? 'Unfeature' : 'Feature'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
