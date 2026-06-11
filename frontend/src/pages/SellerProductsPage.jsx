import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function SellerProductsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', price: '', stock: '0', discount: '0',
    category: '', brand_name: '', tags_input: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.is_seller) {
      api.get('/products/my-products/').then(({ data }) => setProducts(data.results || data)).finally(() => setLoading(false))
      api.get('/categories/').then(({ data }) => setCategories(data))
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        title: form.title,
        description: form.description,
        price: form.price,
        stock: parseInt(form.stock),
        discount: parseFloat(form.discount),
        category: form.category ? parseInt(form.category) : null,
      }
      await api.post('/products/', payload)
      setShowForm(false)
      api.get('/products/my-products/').then(({ data }) => setProducts(data.results || data))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create product')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      await api.delete(`/products/${id}/`)
      setProducts(products.filter((p) => p.id !== id))
    }
  }

  if (!user?.is_seller) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <p className="text-gray-300 mb-4">You need a seller account to manage products.</p>
        <Link to="/profile" className="text-indigo-600 hover:underline">Update Profile</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Products</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl shadow-sm shadow-gray-900 p-6 mb-8 space-y-4">
          {error && <div className="bg-red-900/30 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount %</label>
              <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">-- Select --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">Create Product</button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="bg-gray-800 rounded-xl shadow-sm shadow-gray-900 p-12 text-center text-gray-500">No products yet</div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} className="bg-gray-800 rounded-xl shadow-sm shadow-gray-900 p-4 flex justify-between items-center">
              <div>
                <Link to={`/products/${p.id}`} className="font-medium text-gray-100 hover:text-indigo-600">{p.title}</Link>
                <p className="text-sm text-gray-500">${parseFloat(p.price).toFixed(2)} · Stock: {p.stock}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/products/${p.id}`)} className="text-sm text-indigo-600 hover:underline">View</button>
                <button onClick={() => handleDelete(p.id)} className="text-sm text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
