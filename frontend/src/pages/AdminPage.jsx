import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { fmt } from '../services/utils'

export default function AdminPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dashboard')
  const [newCat, setNewCat] = useState('')
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (user?.is_staff) {
      Promise.all([
        api.get('/admin/analytics/'),
        api.get('/products/?page_size=100'),
      ]).then(([s, p]) => {
        setStats(s.data)
        setProducts(p.data.results || p.data)
      }).finally(() => setLoading(false))
    }
  }, [user])

  const fetchOrders = () => api.get('/admin/orders/').then(({ data }) => setOrders(data.results || data))
  const fetchUsers = () => api.get('/admin/users/').then(({ data }) => setUsers(data))
  const fetchCategories = () => api.get('/admin/categories/').then(({ data }) => setCategories(data))
  const fetchTags = () => api.get('/admin/tags/').then(({ data }) => setTags(data))

  const handleApprove = async (id) => {
    await api.put(`/products/${id}/`, { status: 'approved' })
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, status: 'approved' } : p))
  }
  const handleFeature = async (id, featured) => {
    await api.put(`/products/${id}/`, { featured: !featured })
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, featured: !featured } : p))
  }
  const addCategory = async () => {
    if (!newCat.trim()) return
    await api.post('/admin/categories/', { name: newCat.trim() })
    setNewCat(''); fetchCategories()
  }
  const deleteCategory = async (id) => {
    await api.delete(`/admin/categories/${id}/`); fetchCategories()
  }
  const addTag = async () => {
    if (!newTag.trim()) return
    await api.post('/admin/tags/', { name: newTag.trim() })
    setNewTag(''); fetchTags()
  }
  const deleteTag = async (id) => {
    await api.delete(`/admin/tags/${id}/`); fetchTags()
  }
  const switchTab = (t) => {
    setTab(t)
    if (t === 'orders') fetchOrders()
    if (t === 'users') fetchUsers()
    if (t === 'categories') fetchCategories()
    if (t === 'tags') fetchTags()
  }

  if (!user?.is_staff) return <div className="text-center py-20 text-gray-500">Access denied</div>
  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  const tabs = ['dashboard', 'products', 'orders', 'users', 'categories', 'tags']

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t} onClick={() => switchTab(t)}
            className={`px-4 py-2 rounded-lg capitalize font-medium text-sm ${tab === t ? 'bg-blue-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.total_users },
            { label: 'Total Products', value: stats.total_products },
            { label: 'Total Orders', value: stats.total_orders },
            { label: 'Revenue', value: `$${fmt(stats.total_revenue)}` },
            { label: 'Pending Products', value: stats.pending_products },
            { label: 'Recent Orders (30d)', value: stats.recent_orders },
            { label: 'Recent Revenue', value: `$${fmt(stats.recent_revenue)}` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm  p-4">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'products' && products.map((p) => (
        <div key={p.id} className="bg-white rounded-lg shadow-sm  p-3 flex justify-between items-center mb-2">
          <div>
            <span className="font-medium">{p.title}</span>
            <p className="text-xs text-gray-500">${fmt(p.price)} · Seller: {p.seller_name || p.seller}</p>
          </div>
          <div className="flex gap-2 items-center">
            <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
            {p.status === 'pending' && (
              <button onClick={() => handleApprove(p.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Approve</button>
            )}
            <button onClick={() => handleFeature(p.id, p.featured)}
              className={`text-xs px-2 py-1 rounded ${p.featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'}`}>
              {p.featured ? 'Unfeature' : 'Feature'}
            </button>
          </div>
        </div>
      ))}

      {tab === 'orders' && orders.map((o) => (
        <div key={o.id} className="bg-white rounded-lg shadow-sm  p-3 flex justify-between items-center mb-2">
          <span>#{o.id} - {new Date(o.created_at).toLocaleDateString()} - {o.items_count} items</span>
          <div className="flex gap-2 items-center">
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${
              o.status === 'delivered' ? 'bg-green-100 text-green-700' :
              o.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
              o.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-800'
            }`}>{o.status}</span>
            <span className="font-bold text-blue-800">${fmt(o.total)}</span>
          </div>
        </div>
      ))}

      {tab === 'users' && (
        <div className="bg-white rounded-lg shadow-sm  overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 text-left">
              <th className="p-3">Email</th><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Joined</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.first_name} {u.last_name}</td>
                  <td className="p-3">
                    {u.is_staff && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded mr-1">Staff</span>}
                    {u.is_seller && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Seller</span>}
                  </td>
                  <td className="p-3">{u.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="p-3 text-xs">{new Date(u.date_joined).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'categories' && (
        <div>
          <div className="flex gap-2 mb-4">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name"
              className="border rounded-lg px-3 py-2 flex-1 outline-none focus:ring-2 focus:ring-blue-700" />
            <button onClick={addCategory} className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900">Add</button>
          </div>
          {categories.map((c) => (
            <div key={c.id} className="bg-white rounded-lg shadow-sm  p-3 flex justify-between items-center mb-2">
              <span>{c.name}</span>
              <button onClick={() => deleteCategory(c.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'tags' && (
        <div>
          <div className="flex gap-2 mb-4">
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag name"
              className="border rounded-lg px-3 py-2 flex-1 outline-none focus:ring-2 focus:ring-blue-700" />
            <button onClick={addTag} className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900">Add</button>
          </div>
          {tags.map((t) => (
            <div key={t.id} className="bg-white rounded-lg shadow-sm  p-3 flex justify-between items-center mb-2">
              <span>{t.name}</span>
              <button onClick={() => deleteTag(t.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
