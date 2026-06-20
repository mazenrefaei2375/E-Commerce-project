import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner, Alert, EmptyState } from '../components/UI';

const PLACEHOLDER = 'https://via.placeholder.com/100x100?text=No+Image';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const fetchWishlist = () => {
    api.get('/wishlist/')
      .then((res) => setItems(res.data))
      .catch(() => setError('Failed to load wishlist'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWishlist(); }, []);

  const handleRemove = async (id) => {
    setRemovingId(id);
    try {
      await api.delete(`/wishlist/${id}/delete/`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return <div className="page-container"><h1 className="text-2xl font-bold text-[#111827] mb-6">My Wishlist</h1><LoadingSpinner text="Loading wishlist..." /></div>;

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold text-[#111827] mb-6">My Wishlist</h1>
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      {items.length === 0 ? (
        <EmptyState title="Your wishlist is empty" description="Save items you love by clicking the heart icon on any product." actionTo="/products" actionLabel="Browse Products" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => {
            const p = item.product;
            return (
              <div key={item.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                <Link to={`/products/${p.slug}`}>
                  <img src={p.image || PLACEHOLDER} alt={p.title} className="w-full h-48 object-cover" />
                </Link>
                <div className="p-4">
                  <span className="text-xs text-[#6B7280] uppercase tracking-wider">{p.category_name}</span>
                  <Link to={`/products/${p.slug}`}>
                    <h3 className="font-semibold text-[#111827] mt-1 hover:text-[#2563EB] transition-colors line-clamp-1">{p.title}</h3>
                  </Link>
                  <p className="text-lg font-bold text-[#111827] mt-2">${parseFloat(p.price).toFixed(2)}</p>
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                    className="mt-3 w-full text-center border border-[#DC2626] text-[#DC2626] py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {removingId === item.id ? 'Removing...' : 'Remove from Wishlist'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
