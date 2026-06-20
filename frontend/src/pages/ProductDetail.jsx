import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, Alert, Spinner } from '../components/UI';

const PLACEHOLDER = 'https://via.placeholder.com/600x400?text=No+Image';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartMsg, setCartMsg] = useState('');
  const [cartMsgType, setCartMsgType] = useState('success');
  const [adding, setAdding] = useState(false);
  const [wishMsg, setWishMsg] = useState('');
  const [wishAdding, setWishAdding] = useState(false);
  const [liked, setLiked] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState(null);

  useEffect(() => {
    setLoading(true); setError('');
    api.get(`/products/${slug}/`).then((res) => setProduct(res.data))
      .catch((err) => setError(err.response?.status === 404 ? 'Product not found' : 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    setCartMsg(''); setAdding(true);
    try {
      await api.post('/cart/', { product_id: product.id, quantity });
      setCartMsg('Added to cart successfully!');
      setCartMsgType('success');
    } catch (err) {
      setCartMsg(err.response?.data?.error || 'Failed to add to cart');
      setCartMsgType('error');
    } finally { setAdding(false); }
  };

  const handleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    setWishAdding(true);
    setWishMsg('');
    try {
      if (liked) {
        await api.delete(`/wishlist/${wishlistItemId}/delete/`);
        setLiked(false);
        setWishlistItemId(null);
        setWishMsg('Removed from wishlist');
      } else {
        const res = await api.post('/wishlist/add/', { product_id: product.id });
        setLiked(true);
        if (res.data.id) setWishlistItemId(res.data.id);
        setWishMsg(res.data.message || 'Added to wishlist!');
      }
    } catch (err) {
      setWishMsg(err.response?.data?.error || 'Failed');
    } finally { setWishAdding(false); }
  };

  if (loading) return <div className="page-container"><LoadingSpinner text="Loading product..." /></div>;
  if (error) return (
    <div className="page-container">
      <Alert type="error">{error}</Alert>
      <Link to="/products" className="inline-block mt-4 text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium">&larr; Back to Products</Link>
    </div>
  );
  if (!product) return null;

  return (
    <div className="page-container">
      <Link to="/products" className="inline-block mb-6 text-sm text-[#6B7280] hover:text-[#2563EB] font-medium">&larr; Back to Products</Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="card p-2 overflow-hidden">
          <img src={product.image || PLACEHOLDER} alt={product.title} className="w-full rounded-lg object-cover aspect-square" />
        </div>

        <div>
          <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">{product.category?.name}</span>
          <h1 className="text-3xl font-bold text-[#111827] mt-2">{product.title}</h1>
          <p className="text-4xl font-bold text-[#2563EB] mt-4">${parseFloat(product.price).toFixed(2)}</p>

          <div className="mt-5">
            <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${product.stock > 0 ? 'bg-green-100 text-[#16A34A]' : 'bg-red-100 text-[#DC2626]'}`}>
              {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
            </span>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-[#111827] mb-2">Description</h3>
            <p className="text-[#6B7280] leading-relaxed">{product.description || 'No description available.'}</p>
          </div>

          {cartMsg && <div className="mt-4"><Alert type={cartMsgType}>{cartMsg}</Alert></div>}
          {wishMsg && <div className="mt-4"><Alert type={wishMsg.includes('already') ? 'warning' : 'success'}>{wishMsg}</Alert></div>}

          <div className="mt-5 flex items-center gap-3">
            {!isAdmin ? (
              <>
                <button onClick={handleWishlist} disabled={wishAdding} className={`p-3 border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-xl ${liked ? 'text-[#DC2626]' : 'text-gray-400 hover:text-[#DC2626]'}`} title={liked ? 'In Wishlist' : 'Add to Wishlist'}>
                  {liked ? '\u2764' : '\u2661'}
                </button>
                <div className="flex items-center border border-[#E5E7EB] rounded-lg">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-4 py-2.5 hover:bg-gray-50 text-lg font-medium transition-colors">-</button>
                  <span className="px-4 py-2.5 border-x min-w-[3rem] text-center font-semibold">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="px-4 py-2.5 hover:bg-gray-50 text-lg font-medium transition-colors">+</button>
                </div>
                <button onClick={handleAddToCart} disabled={product.stock === 0 || adding} className="btn-primary flex-1 py-3 text-base">
                  {adding ? <><Spinner /> Adding...</> : product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </>
            ) : (
              <p className="text-sm text-[#6B7280] italic">Admin accounts cannot purchase products.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
