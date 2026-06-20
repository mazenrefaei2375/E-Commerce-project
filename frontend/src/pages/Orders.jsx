import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, Alert, StatusBadge, EmptyState } from '../components/UI';

export default function Orders() {
  const { user } = useAuth(); const navigate = useNavigate();
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');

  useEffect(() => { if (!user) return navigate('/login'); api.get('/orders/').then((res) => setOrders(res.data)).catch(() => setError('Failed to load orders')).finally(() => setLoading(false)); }, [user, navigate]);

  if (loading) return <div className="page-container"><h1 className="text-2xl font-bold text-[#111827] mb-6">My Orders</h1><LoadingSpinner text="Loading orders..." /></div>;

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold text-[#111827] mb-6">My Orders</h1>
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" description="You haven't placed any orders yet. Start shopping!" actionTo="/products" actionLabel="Start Shopping" />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-[#111827]">Order #{order.id}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={order.status} />
                <span className="font-bold text-[#111827]">${parseFloat(order.total).toFixed(2)}</span>
                <span className="text-xs text-[#6B7280]">{order.item_count} item(s)</span>
                <Link to={`/orders/${order.id}`} className="btn-primary btn-sm">View Details</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
