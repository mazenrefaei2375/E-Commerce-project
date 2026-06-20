import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner, Alert, EmptyState } from '../components/UI';

const PLACEHOLDER = 'https://via.placeholder.com/100x100?text=No+Image';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchCart = () => api.get('/cart/').then((res) => setCart(res.data)).catch(() => setError('Failed to load cart')).finally(() => setLoading(false));
  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (itemId, newQty) => {
    setUpdatingId(itemId);
    try { const res = await api.patch(`/cart/items/${itemId}/`, { quantity: newQty }); setCart(res.data); } catch (err) { setError(err.response?.data?.error || 'Failed to update'); } finally { setUpdatingId(null); }
  };
  const removeItem = async (itemId) => {
    setUpdatingId(itemId);
    try { const res = await api.delete(`/cart/items/${itemId}/delete/`); setCart(res.data); } catch (err) { setError('Failed to remove item'); } finally { setUpdatingId(null); }
  };

  if (loading) return <div className="page-container"><h1 className="text-2xl font-bold text-[#111827] mb-6">Shopping Cart</h1><LoadingSpinner text="Loading cart..." /></div>;

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Shopping Cart</h1>
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      {!cart || cart.item_count === 0 ? (
        <EmptyState title="Your cart is empty" description="Looks like you haven't added anything to your cart yet." actionTo="/products" actionLabel="Browse Products" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {cart.items.map((item) => (
              <div key={item.id} className="card p-4 flex items-center gap-4">
                <Link to={`/products/${item.product_slug}`} className="shrink-0">
                  <img src={item.product_image || PLACEHOLDER} alt={item.product_title} className="w-20 h-20 object-cover rounded-lg" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product_slug}`} className="font-semibold text-[#111827] hover:text-[#2563EB] transition-colors">{item.product_title}</Link>
                  <p className="text-sm text-[#6B7280]">${parseFloat(item.product_price).toFixed(2)} each</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} disabled={item.quantity <= 1 || updatingId === item.id} className="w-8 h-8 border border-[#E5E7EB] rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors">-</button>
                    <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} disabled={item.quantity >= item.product_stock || updatingId === item.id} className="w-8 h-8 border border-[#E5E7EB] rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors">+</button>
                  </div>
                </div>
                <span className="font-bold text-[#111827] text-right text-sm sm:text-base">${parseFloat(item.subtotal).toFixed(2)}</span>
                <button onClick={() => removeItem(item.id)} disabled={updatingId === item.id} className="text-[#DC2626] hover:text-red-700 text-sm font-medium disabled:opacity-50 shrink-0">Remove</button>
              </div>
            ))}
          </div>

          <div className="card p-6 h-fit">
            <h3 className="font-semibold text-[#111827] mb-4">Cart Summary</h3>
            <div className="space-y-2 mb-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[#6B7280] truncate max-w-[70%]">{item.product_title} x{item.quantity}</span>
                  <span className="font-medium">${parseFloat(item.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#E5E7EB] pt-3 flex justify-between">
              <span className="font-bold text-[#111827]">Total</span>
              <span className="font-bold text-xl text-[#111827]">${parseFloat(cart.total).toFixed(2)}</span>
            </div>
            <Link to="/checkout" className="btn-primary w-full mt-4 text-center">Proceed to Checkout</Link>
          </div>
        </div>
      )}
    </div>
  );
}
