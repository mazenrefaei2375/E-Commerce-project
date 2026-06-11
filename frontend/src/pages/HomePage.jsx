import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../context/CartContext'

export default function HomePage() {
  const [featured, setFeatured] = useState([])
  const [latest, setLatest] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { addToCart } = useCart()

  useEffect(() => {
    Promise.all([
      api.get('/products/featured/'),
      api.get('/products/latest/'),
      api.get('/categories/'),
    ]).then(([f, l, c]) => {
      setFeatured(f.data)
      setLatest(l.data)
      setCategories(c.data)
    })
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search)}`)
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="bg-indigo-600 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Find What You Love</h1>
          <p className="text-indigo-200 mb-6">Browse thousands of products from trusted sellers</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands, tags..."
              className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-indigo-300 outline-none"
            />
            <button type="submit" className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Categories */}
        {categories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/products?category=${cat.id}`}
                  className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                  {cat.image && <img src={cat.image} alt={cat.name} className="w-12 h-12 mx-auto mb-2 object-cover rounded-full" />}
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products Slider */}
        {featured.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} addToCart={addToCart} />
              ))}
            </div>
          </section>
        )}

        {/* Latest Products */}
        {latest.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Latest Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {latest.map((product) => (
                <ProductCard key={product.id} product={product} addToCart={addToCart} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product, addToCart }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/products/${product.id}`}>
        {product.main_image ? (
          <img src={product.main_image} alt={product.title} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
        )}
      </Link>
      <div className="p-4">
        <Link to={`/products/${product.id}`} className="font-medium text-gray-800 hover:text-indigo-600 line-clamp-2">
          {product.title}
        </Link>
        <div className="flex items-center gap-2 mt-2">
          {product.discount > 0 ? (
            <>
              <span className="text-lg font-bold text-indigo-600">${parseFloat(product.discount_price).toFixed(2)}</span>
              <span className="text-sm text-gray-400 line-through">${parseFloat(product.price).toFixed(2)}</span>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">-{product.discount}%</span>
            </>
          ) : (
            <span className="text-lg font-bold text-indigo-600">${parseFloat(product.price).toFixed(2)}</span>
          )}
        </div>
        {product.average_rating > 0 && (
          <div className="flex items-center gap-1 mt-1 text-sm text-yellow-500">
            {'★'.repeat(Math.round(product.average_rating))}{'☆'.repeat(5 - Math.round(product.average_rating))}
            <span className="text-gray-400 text-xs">({product.average_rating})</span>
          </div>
        )}
        <button onClick={() => addToCart(product.id)} className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700">
          Add to Cart
        </button>
      </div>
    </div>
  )
}
