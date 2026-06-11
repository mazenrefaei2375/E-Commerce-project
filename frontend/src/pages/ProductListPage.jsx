import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../context/CartContext'

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [mobileFilter, setMobileFilter] = useState(false)
  const { addToCart } = useCart()

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const brand = searchParams.get('brand') || ''
  const page = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    api.get('/categories/').then(({ data }) => setCategories(data.results || data))
    api.get('/brands/').then(({ data }) => setBrands(data.results || data))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { page }
    if (search) params.search = search
    if (category) params.category = category
    if (brand) params.brand = brand

    api.get('/products/', { params })
      .then(({ data }) => {
        setProducts(data.results || data)
        setTotal(data.count || 0)
      })
      .catch(() => { setProducts([]); setTotal(0) })
      .finally(() => setLoading(false))
  }, [search, category, brand, page])

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) newParams.set(key, value)
    else newParams.delete(key)
    newParams.delete('page')
    setSearchParams(newParams)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Mobile filter toggle */}
        <button onClick={() => setMobileFilter(!mobileFilter)}
          className="md:hidden mb-4 px-4 py-2 border rounded-lg text-sm text-gray-700 bg-white">
          {mobileFilter ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        {/* Sidebar - hidden on mobile unless toggled */}
        <aside className={`${mobileFilter ? 'block' : 'hidden'} md:block w-full md:w-56 shrink-0`}>
          <div className="bg-white rounded-xl shadow-sm  p-4 space-y-6 sticky top-20">
            <div>
              <h3 className="font-semibold mb-3">Search</h3>
              <input type="text" value={search} onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Search..." className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-700" />
            </div>
            <div>
              <h3 className="font-semibold mb-3">Category</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {categories.map((c) => (
                  <button key={c.id} onClick={() => updateFilter('category', category === String(c.id) ? '' : c.id)}
                    className={`block text-sm w-full text-left px-2 py-1 rounded ${category === String(c.id) ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-stone-50'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Brand</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {brands.map((b) => (
                  <button key={b.id} onClick={() => updateFilter('brand', brand === String(b.id) ? '' : b.id)}
                    className={`block text-sm w-full text-left px-2 py-1 rounded ${brand === String(b.id) ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-stone-50'}`}>
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No products found</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm  overflow-hidden hover:shadow-md shadow-gray-200 transition-shadow">
                    <Link to={`/products/${product.id}`}>
                      {product.main_image ? (
                        <img src={product.main_image} alt={product.title} className="w-full h-48 object-cover" />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">No Image</div>
                      )}
                    </Link>
                    <div className="p-4">
                      <Link to={`/products/${product.id}`} className="font-medium text-gray-900 hover:text-blue-800 line-clamp-2">
                        {product.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">{product.category_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {product.discount > 0 ? (
                          <>
                            <span className="text-lg font-bold text-blue-800">${parseFloat(product.discount_price).toFixed(2)}</span>
                            <span className="text-sm text-gray-500 line-through">${parseFloat(product.price).toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-blue-800">${parseFloat(product.price).toFixed(2)}</span>
                        )}
                      </div>
                      <button onClick={() => addToCart(product.id)} className="mt-3 w-full bg-blue-800 text-white py-2 rounded-lg text-sm hover:bg-blue-900">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {total > 20 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: Math.ceil(total / 20) }, (_, i) => (
                    <button key={i} onClick={() => updateFilter('page', String(i + 1))}
                      className={`px-4 py-2 rounded-lg text-sm ${page === i + 1 ? 'bg-blue-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
