import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, Alert, Spinner } from '../components/UI';

const SHIPPING_FEE = 20;
const PLACEHOLDER = 'https://via.placeholder.com/60x60?text=No+Image';

function validateCard(form) {
  const errors = {};
  if (!form.card_name?.trim()) errors.card_name = 'Cardholder name is required';
  const num = (form.card_number || '').replace(/\s/g, '');
  if (!/^\d{16}$/.test(num)) errors.card_number = 'Card number must be 16 digits';
  if (!form.card_expiry) {
    errors.card_expiry = 'Expiry date is required';
  } else {
    const m = form.card_expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!m) { errors.card_expiry = 'Format must be MM/YY'; }
    else {
      const month = parseInt(m[1]), year = parseInt(m[2]) + 2000;
      const now = new Date();
      const expiry = new Date(year, month);
      if (month < 1 || month > 12) errors.card_expiry = 'Invalid month';
      else if (expiry < new Date(now.getFullYear(), now.getMonth() + 1))
        errors.card_expiry = 'Card has expired';
    }
  }
  if (!/^\d{3}$/.test(form.card_cvv || '')) errors.card_cvv = 'CVV must be 3 digits';
  return errors;
}

export default function Checkout() {
  const { user } = useAuth(); const navigate = useNavigate();
  const [cart, setCart] = useState(null); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false);
  const [cardErrors, setCardErrors] = useState({});
  const [form, setForm] = useState({
    full_name: '', phone: '', address: '', city: '', country: '',
    payment_method: 'cash',
    card_name: '', card_number: '', card_expiry: '', card_cvv: '',
  });

  useEffect(() => {
    if (!user) return navigate('/login');
    setForm((prev) => ({
      ...prev,
      full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      phone: user.mobile || '',
      address: user.address || '',
      city: user.city || '',
      country: user.country || '',
      payment_method: 'cash',
    }));
    api.get('/cart/').then((res) => setCart(res.data)).catch(() => setError('Failed to load cart')).finally(() => setLoading(false));
  }, [user, navigate]);

  const isCard = form.payment_method === 'card';

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'card_number') {
      const digits = value.replace(/\D/g, '').slice(0, 16);
      const groups = digits.match(/.{1,4}/g) || [];
      setForm({ ...form, card_number: groups.join(' ') });
    } else if (name === 'card_expiry') {
      let v = value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
      setForm({ ...form, card_expiry: v });
    } else if (name === 'card_cvv') {
      setForm({ ...form, card_cvv: value.replace(/\D/g, '').slice(0, 3) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const getCheckoutPayload = () => {
    const payload = {
      full_name: form.full_name,
      phone: form.phone,
      address: form.address,
      city: form.city,
      country: form.country,
      payment_method: isCard ? 'card' : 'cash',
    };
    if (isCard) {
      const num = form.card_number.replace(/\s/g, '');
      payload.card_last4 = num.slice(-4);
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setCardErrors({});
    if (isCard) {
      const errs = validateCard(form);
      if (Object.keys(errs).length > 0) { setCardErrors(errs); return; }
    }
    setSubmitting(true);
    try {
      const res = await api.post('/checkout/', getCheckoutPayload());
      navigate(`/orders/${res.data.id}`, { state: { success: true } });
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || Object.values(data || {}).flat().join('. ') || 'Checkout failed');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="page-container"><h1 className="text-2xl font-bold text-[#111827] mb-6">Checkout</h1><LoadingSpinner text="Loading..." /></div>;
  if (!cart || cart.item_count === 0) return (
    <div className="page-container">
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Checkout</h1>
      <div className="card p-12 text-center"><p className="text-[#6B7280] text-lg mb-4">Your cart is empty</p><Link to="/products" className="btn-primary">Browse Products</Link></div>
    </div>
  );

  const cartTotal = parseFloat(cart.total);
  const finalTotal = cartTotal + SHIPPING_FEE;

  const paymentLabel = isCard ? 'Card Payment' : 'Cash on Delivery';

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Checkout</h1>
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 card p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-5">Shipping Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Full Name *</label><input type="text" name="full_name" required value={form.full_name} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Phone *</label><input type="text" name="phone" inputMode="numeric" pattern="[0-9]*" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Address *</label><textarea name="address" required value={form.address} onChange={handleChange} rows="2" className="input-field" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-[#111827] mb-1.5">City *</label><input type="text" name="city" required value={form.city} onChange={handleChange} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Country *</label><input type="text" name="country" required value={form.country} onChange={handleChange} className="input-field" /></div>
            </div>

            <div className="border-t border-[#E5E7EB] pt-4">
              <label className="block text-sm font-medium text-[#111827] mb-2">Payment Method</label>
              <div className="flex gap-4 mb-3">
                <label className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors flex-1 ${!isCard ? 'border-[#2563EB] bg-[#DBEAFE]' : 'border-[#E5E7EB]'}`}>
                  <input type="radio" name="payment_method" value="cash" checked={!isCard} onChange={handleChange} className="sr-only" />
                  <span className="text-sm font-medium">Cash on Delivery</span>
                </label>
                <label className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors flex-1 ${isCard ? 'border-[#2563EB] bg-[#DBEAFE]' : 'border-[#E5E7EB]'}`}>
                  <input type="radio" name="payment_method" value="card" checked={isCard} onChange={handleChange} className="sr-only" />
                  <span className="text-sm font-medium">Card Payment</span>
                </label>
              </div>

              {isCard && (
                <div className="border border-[#E5E7EB] rounded-lg p-4 space-y-3 mt-2">
                  <p className="text-xs text-[#6B7280] italic mb-1">This is a simulated card payment for project demonstration.</p>
                  <div>
                    <label className="block text-xs font-medium text-[#111827] mb-1">Cardholder Name *</label>
                    <input type="text" name="card_name" value={form.card_name} onChange={handleChange} className="input-field" />
                    {cardErrors.card_name && <p className="text-xs text-[#DC2626] mt-1">{cardErrors.card_name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#111827] mb-1">Card Number *</label>
                    <input type="text" name="card_number" inputMode="numeric" value={form.card_number} onChange={handleChange} placeholder="1234 5678 9012 3456" className="input-field" />
                    {cardErrors.card_number && <p className="text-xs text-[#DC2626] mt-1">{cardErrors.card_number}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#111827] mb-1">Expiry (MM/YY) *</label>
                      <input type="text" name="card_expiry" value={form.card_expiry} onChange={handleChange} placeholder="MM/YY" className="input-field" />
                      {cardErrors.card_expiry && <p className="text-xs text-[#DC2626] mt-1">{cardErrors.card_expiry}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#111827] mb-1">CVV *</label>
                      <input type="text" name="card_cvv" inputMode="numeric" value={form.card_cvv} onChange={handleChange} placeholder="123" className="input-field" />
                      {cardErrors.card_cvv && <p className="text-xs text-[#DC2626] mt-1">{cardErrors.card_cvv}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
              {submitting ? <><Spinner /> Placing Order...</> : `Place Order - $${finalTotal.toFixed(2)}`}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 card p-6 h-fit">
          <h2 className="text-lg font-semibold text-[#111827] mb-4">Order Summary</h2>
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <img src={item.product_image || PLACEHOLDER} alt={item.product_title} className="w-12 h-12 object-cover rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827] truncate">{item.product_title}</p>
                  <p className="text-xs text-[#6B7280]">Qty: {item.quantity} x ${parseFloat(item.product_price).toFixed(2)}</p>
                </div>
                <span className="text-sm font-semibold text-[#111827]">${parseFloat(item.subtotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E5E7EB] mt-4 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Subtotal</span>
              <span className="font-medium text-[#111827]">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Shipping</span>
              <span className="font-medium text-[#111827]">${SHIPPING_FEE.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Payment</span>
              <span className="font-medium text-[#111827]">{paymentLabel}</span>
            </div>
            <div className="flex justify-between border-t border-[#E5E7EB] pt-3">
              <span className="font-bold text-[#111827]">Total</span>
              <span className="font-bold text-xl text-[#111827]">${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
