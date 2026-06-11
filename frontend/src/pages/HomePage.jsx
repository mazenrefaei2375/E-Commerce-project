import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../context/CartContext'
import { fmt } from '../services/utils'

export default function HomePage() {
  const [featured, setFeatured] = useState([])
  const [latest, setLatest] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { addToCart } = useCart()

  useEffect(() => {
    Promise.all([
      api.get('/products/featured/'),
      api.get('/products/latest/'),
      api.get('/products/best-sellers/'),
      api.get('/categories/'),
    ]).then(([f, l, b, c]) => {
      setFeatured(Array.isArray(f.data) ? f.data : [])
      setLatest(Array.isArray(l.data) ? l.data : [])
      setBestSellers(Array.isArray(b.data) ? b.data : [])
      setCategories(Array.isArray(c.data) ? c.data : [])
    }).catch(() => {
      setFeatured([]); setLatest([]); setBestSellers([]); setCategories([])
    })
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search)}`)
  }

  return (
    <div>
      <div className="bg-blue-800 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Find What You Love</h1>
          <p className="text-blue-200 mb-6">Browse thousands of products from trusted sellers</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands, tags..."
              className="flex-1 px-4 py-3 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-600 outline-none border border-gray-300" />
            <button type="submit" className="bg-white text-blue-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200">Search</button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {categories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/products?category=${cat.id}`}
                  className="bg-white rounded-xl p-4 text-center shadow-sm  hover:shadow-md shadow-gray-200 transition-shadow">
                  {cat.image && <img src={cat.image} alt={cat.name} className="w-12 h-12 mx-auto mb-2 object-cover rounded-full" />}
                  <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {featured.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {featured.map((p) => <ProductCard key={p.id} product={p} addToCart={addToCart} />)}
            </div>
          </section>
        )}

        {bestSellers.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Best Sellers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {bestSellers.map((p) => <ProductCard key={p.id} product={p} addToCart={addToCart} />)}
            </div>
          </section>
        )}

        {latest.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Latest Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {latest.map((p) => <ProductCard key={p.id} product={p} addToCart={addToCart} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product, addToCart }) {
  return (
    <div className="bg-white rounded-xl shadow-sm  overflow-hidden hover:shadow-md shadow-gray-200 transition-shadow">
      <Link to={`/products/${product.id}`}>
        {product.main_image ? (
          <img src={product.main_image} alt={product.title} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">No Image</div>
        )}
      </Link>
      <div className="p-4">
        <Link to={`/products/${product.id}`} className="font-medium text-gray-900 hover:text-blue-800 line-clamp-2">{product.title}</Link>
        <div className="flex items-center gap-2 mt-2">
          {product.discount > 0 ? (
            <>
              <span className="text-lg font-bold text-blue-800">${fmt(product.discount_price)}</span>
              <span className="text-sm text-gray-500 line-through">${fmt(product.price)}</span>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">-{product.discount}%</span>
            </>
          ) : (
            <span className="text-lg font-bold text-blue-800">${fmt(product.price)}</span>
          )}
        </div>
        {product.average_rating > 0 && (
          <div className="flex items-center gap-1 mt-1 text-sm text-yellow-500">
            {'★'.repeat(Math.round(product.average_rating))}{'☆'.repeat(5 - Math.round(product.average_rating))}
          </div>
        )}
        <button onClick={() => addToCart(product.id)} className="mt-3 w-full bg-blue-800 text-white py-2 rounded-lg text-sm hover:bg-blue-900">
          Add to Cart
        </button>
      </div>
    </div>
  )
}
