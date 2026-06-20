import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, Alert, StatusBadge } from '../components/UI';

export default function OrderDetail() {
  const { id } = useParams(); const { user } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [order, setOrder] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const success = location.state?.success;

  useEffect(() => { if (!user) return navigate('/login'); api.get(`/orders/${id}/`).then((res) => setOrder(res.data)).catch((err) => setError(err.response?.status === 404 ? 'Order not found' : 'Failed to load order')).finally(() => setLoading(false)); }, [id, user, navigate]);

  if (loading) return <div className="page-container"><h1 className="text-2xl font-bold text-[#111827] mb-6">Order #{id}</h1><LoadingSpinner text="Loading order..." /></div>;
  if (error) return <div className="page-container"><Alert type="error">{error}</Alert><Link to="/orders" className="inline-block mt-4 text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium">&larr; Back to Orders</Link></div>;
  if (!order) return null;

  return (
    <div className="page-container">
      <Link to="/orders" className="inline-block mb-6 text-sm text-[#6B7280] hover:text-[#2563EB] font-medium">&larr; Back to Orders</Link>

      {success && <div className="mb-4"><Alert type="success">Order placed successfully! Thank you for your purchase.</Alert></div>}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Order #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="font-semibold text-[#111827] mb-3">Shipping Details</h2>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-[#6B7280]">Name</dt><dd className="font-medium text-[#111827]">{order.full_name}</dd></div>
            <div className="flex justify-between"><dt className="text-[#6B7280]">Phone</dt><dd className="font-medium text-[#111827]">{order.phone}</dd></div>
            <div className="flex justify-between"><dt className="text-[#6B7280]">Address</dt><dd className="font-medium text-[#111827]">{order.address}</dd></div>
            <div className="flex justify-between"><dt className="text-[#6B7280]">City</dt><dd className="font-medium text-[#111827]">{order.city}</dd></div>
            <div className="flex justify-between"><dt className="text-[#6B7280]">Country</dt><dd className="font-medium text-[#111827]">{order.country}</dd></div>
          </dl>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-[#111827] mb-3">Payment</h2>
          <p className="text-sm text-[#111827] capitalize">{order.payment_method === 'card' ? 'Card Payment' : 'Cash on Delivery'}</p>
          {order.payment_method === 'card' && order.card_last4 && (
            <p className="text-xs text-[#6B7280] mt-1">Card ending in {order.card_last4}</p>
          )}
          <p className="text-xs text-[#6B7280] mt-3">{new Date(order.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-[#111827] mb-4">Order Items</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0">
              <div>
                <p className="font-medium text-[#111827]">{item.product_title}</p>
                <p className="text-sm text-[#6B7280]">${parseFloat(item.product_price).toFixed(2)} x {item.quantity}</p>
              </div>
              <span className="font-bold text-[#111827]">${parseFloat(item.subtotal).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#E5E7EB] mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Subtotal</span>
              <span className="font-medium text-[#111827]">${(parseFloat(order.total) - parseFloat(order.shipping_fee || 20)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Shipping / &#1605;&#1589;&#1575;&#1585;&#1610;&#1601; &#1588;&#1581;&#1606;</span>
              <span className="font-medium text-[#111827]">${parseFloat(order.shipping_fee || 20).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-[#E5E7EB] pt-3">
              <span className="font-bold text-lg text-[#111827]">Total</span>
              <span className="font-bold text-xl text-[#111827]">${parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
      </div>
    </div>
  );
}
