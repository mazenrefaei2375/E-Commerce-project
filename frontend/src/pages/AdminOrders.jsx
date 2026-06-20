import { useEffect, useState } from 'react';
import api from '../services/api';
import { LoadingSpinner, Alert, StatusBadge, PageHeader, Spinner } from '../components/UI';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/admin/orders/').then((res) => setOrders(res.data)).catch(() => setError('Failed to load orders')).finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/admin/orders/${orderId}/status/`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)));
      setSuccess(`Order #${orderId} status updated to ${newStatus}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingId(null);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  if (loading) return <div className="page-container"><PageHeader title="Orders" /><LoadingSpinner text="Loading orders..." /></div>;

  return (
    <div className="page-container">
      <PageHeader title="All Orders" subtitle={`${orders.length} orders`} />
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}

      {orders.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-[#6B7280]">No orders yet</p></div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-[#111827]">Order #{o.id} — {o.full_name}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{new Date(o.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {updatingId === o.id ? (
                    <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]"><Spinner /> Updating...</span>
                  ) : (
                    <>
                      <StatusBadge status={o.status} />
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                        className="text-xs border border-[#E5E7EB] rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-[#2563EB] outline-none cursor-pointer"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
                <span className="font-bold text-[#111827]">${parseFloat(o.total).toFixed(2)}</span>
                <span className="text-xs text-[#6B7280]">{o.items?.length || 0} item(s)</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
