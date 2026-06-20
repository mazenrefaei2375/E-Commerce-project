import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PLACEHOLDER = 'https://via.placeholder.com/400x300?text=No+Image';

export default function ProductCard({ product }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState(null);
  const [wishMsg, setWishMsg] = useState('');
  const [wishLoading, setWishLoading] = useState(false);

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setWishLoading(true);
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
    } finally {
      setWishLoading(false);
      setTimeout(() => setWishMsg(''), 2000);
    }
  };

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow group relative">
      <Link to={`/products/${product.slug}`} className="block">
        <img src={product.image || PLACEHOLDER} alt={product.title}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300" />
      </Link>
      {!isAdmin && (
        <>
          <button
            onClick={handleWishlist}
            disabled={wishLoading}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center text-lg transition-all disabled:opacity-50 ${liked ? 'text-[#DC2626]' : 'text-gray-400 hover:text-[#DC2626]'}`}
            title={liked ? 'In Wishlist' : 'Add to Wishlist'}
          >
            {liked ? '\u2764' : '\u2661'}
          </button>
          {wishMsg && (
            <div className="absolute top-12 right-3 bg-white shadow-lg rounded-lg px-3 py-1 text-xs font-medium text-[#2563EB]">
              {wishMsg}
            </div>
          )}
        </>
      )}
      <div className="p-5">
        <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">{product.category_name}</span>
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-semibold text-[#111827] mt-1.5 hover:text-[#2563EB] transition-colors line-clamp-1">{product.title}</h3>
        </Link>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xl font-bold text-[#111827]">${parseFloat(product.price).toFixed(2)}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${product.stock > 0 ? 'bg-green-100 text-[#16A34A]' : 'bg-red-100 text-[#DC2626]'}`}>
            {product.stock > 0 ? `In Stock` : 'Sold Out'}
          </span>
        </div>
        <Link to={`/products/${product.slug}`}
          className="mt-4 block w-full text-center btn-primary text-sm">
          {isAdmin ? 'View' : 'View Details'}
        </Link>
        {isAdmin && (
          <p className="text-center text-[10px] text-[#6B7280] mt-1">Admin accounts cannot purchase</p>
        )}
      </div>
    </div>
  );
}
