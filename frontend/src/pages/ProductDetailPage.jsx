import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function ProductDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [mainImage, setMainImage] = useState(0)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    api.get(`/products/${id}/`)
      .then(({ data }) => { setProduct(data); return api.get(`/products/${id}/related/`) })
      .then(({ data }) => { setRelated(Array.isArray(data) ? data : []) })
      .finally(() => setLoading(false))
  }, [id])

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setReviewSubmitting(true)
    setReviewError('')
    try {
      const { data } = await api.post(`/products/${id}/reviews/`, reviewForm)
      setProduct((prev) => ({
        ...prev,
        reviews: [data, ...prev.reviews],
        average_rating: ((prev.average_rating * prev.review_count + reviewForm.rating) / (prev.review_count + 1)).toFixed(1),
        review_count: prev.review_count + 1,
      }))
      setReviewForm({ rating: 5, comment: '' })
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Failed to submit review')
    }
    setReviewSubmitting(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>
  if (!product) return <div className="text-center py-20 text-gray-500">Product not found</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="bg-gray-800 rounded-xl overflow-hidden shadow-sm shadow-gray-900">
            {product.images?.length > 0 ? (
              <img src={product.images[mainImage]?.image} alt={product.title} className="w-full h-96 object-cover" />
            ) : (
              <div className="w-full h-96 bg-gray-600 flex items-center justify-center text-gray-500">No Image</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 mt-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setMainImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${i === mainImage ? 'border-indigo-600' : 'border-transparent'}`}>
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-100">{product.title}</h1>
          <p className="text-sm text-gray-500 mt-2">by {product.seller_name}</p>

          <div className="flex items-center gap-2 mt-4">
            {product.discount > 0 ? (
              <>
                <span className="text-3xl font-bold text-indigo-600">${parseFloat(product.discount_price).toFixed(2)}</span>
                <span className="text-xl text-gray-500 line-through">${parseFloat(product.price).toFixed(2)}</span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm">-{product.discount}%</span>
              </>
            ) : (
              <span className="text-3xl font-bold text-indigo-600">${parseFloat(product.price).toFixed(2)}</span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-2">
            <span className="text-yellow-500">{'★'.repeat(Math.round(product.average_rating))}{'☆'.repeat(5 - Math.round(product.average_rating))}</span>
            <span className="text-sm text-gray-500">({product.average_rating} · {product.review_count} reviews)</span>
          </div>

          <div className="flex items-center gap-4 mt-6">
            {product.stock > 0 ? (
              <>
                <button onClick={() => addToCart(product.id)} className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-medium">
                  Add to Cart
                </button>
                <span className="text-sm text-green-600">In Stock ({product.stock} available)</span>
              </>
            ) : (
              <span className="text-red-600 font-medium">Out of Stock</span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {product.category && (
              <Link to={`/products?category=${product.category.id}`} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-gray-600">
                {product.category.name}
              </Link>
            )}
            {product.brand && (
              <Link to={`/products?brand=${product.brand.id}`} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-gray-600">
                {product.brand.name}
              </Link>
            )}
            {product.tags?.map((tag) => (
              <span key={tag.id} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm">{tag.name}</span>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-300 leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <Link key={p.id} to={`/products/${p.id}`}
                className="bg-gray-800 rounded-xl shadow-sm shadow-gray-900 overflow-hidden hover:shadow-md shadow-gray-900/40 transition-shadow">
                {p.main_image ? (
                  <img src={p.main_image} alt={p.title} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-gray-600 flex items-center justify-center text-gray-500">No Image</div>
                )}
                <div className="p-3">
                  <span className="text-sm font-medium text-gray-100 line-clamp-2">{p.title}</span>
                  <p className="text-indigo-600 font-bold text-sm mt-1">
                    ${p.discount_price != null ? parseFloat(p.discount_price).toFixed(2) : parseFloat(p.price).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Reviews ({product.review_count})</h2>

        {user && (
          <form onSubmit={handleReviewSubmit} className="bg-gray-800 rounded-xl shadow-sm shadow-gray-900 p-6 mb-6">
            {reviewError && <div className="bg-red-900/30 text-red-600 p-2 rounded text-sm mb-3">{reviewError}</div>}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-300">Rating:</span>
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: r })}
                  className={`text-xl ${r <= reviewForm.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</button>
              ))}
            </div>
            <textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Write your review..." rows={3} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" required />
            <button type="submit" disabled={reviewSubmitting}
              className="mt-3 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm">
              {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {product.reviews?.length === 0 && (
            <p className="text-gray-500">No reviews yet. Be the first to review!</p>
          )}
          {product.reviews?.map((review) => (
            <div key={review.id} className="bg-gray-800 rounded-xl shadow-sm shadow-gray-900 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-200">{review.user_name}</span>
                <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <p className="text-gray-300 mt-2 text-sm">{review.comment}</p>
              <p className="text-xs text-gray-500 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
