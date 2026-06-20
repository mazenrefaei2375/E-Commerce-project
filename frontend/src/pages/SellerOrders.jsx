import { useEffect, useState } from 'react';
import api from '../services/api';
import { LoadingSpinner, Alert, PageHeader, StatusBadge } from '../components/UI';

const STATUSES = ['pending', 'preparing', 'shipped'];

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/seller/orders/')
      .then((res) => setOrders(res.data))
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (itemId, newStatus) => {
    setUpdatingId(itemId);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/seller/order-items/${itemId}/status/`, { seller_status: newStatus });
      setOrders((prev) =>
        prev.map((o) => ({
          ...o,
          items: o.items.map((i) =>
            i.id === itemId ? { ...i, seller_status: newStatus } : i
          ),
        }))
      );
      setSuccess('Status updated');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setUpdatingId(null);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  if (loading) return <div className="page-container"><PageHeader title="Seller Orders" /><LoadingSpinner text="Loading orders..." /></div>;

  return (
    <div className="page-container">
      <PageHeader title="Seller Orders" subtitle="Orders containing your products" />
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}

      {orders.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-[#6B7280] text-lg">No orders for your products yet.</p></div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.order_id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold text-[#111827]">Order #{o.order_id} — {o.customer_name}</p>
                  <p className="text-xs text-[#6B7280]">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.order_status} />
                  <span className="text-sm font-bold">${parseFloat(o.seller_subtotal).toFixed(2)}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                      <th className="p-2 text-left font-semibold text-[#111827]">Product</th>
                      <th className="p-2 text-left font-semibold text-[#111827]">Qty</th>
                      <th className="p-2 text-left font-semibold text-[#111827]">Price</th>
                      <th className="p-2 text-left font-semibold text-[#111827]">Subtotal</th>
                      <th className="p-2 text-left font-semibold text-[#111827]">Fulfillment</th>
                      <th className="p-2 text-left font-semibold text-[#111827]">Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((item) => (
                      <tr key={item.id} className="border-b border-[#E5E7EB]">
                        <td className="p-2 font-medium text-[#111827]">{item.product_title}</td>
                        <td className="p-2">{item.quantity}</td>
                        <td className="p-2">${parseFloat(item.price).toFixed(2)}</td>
                        <td className="p-2">${parseFloat(item.subtotal).toFixed(2)}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            item.seller_status === 'shipped' ? 'bg-purple-100 text-purple-700'
                            : item.seller_status === 'preparing' ? 'bg-blue-100 text-[#2563EB]'
                            : 'bg-amber-100 text-[#F59E0B]'
                          }`}>
                            {item.seller_status}
                          </span>
                        </td>
                        <td className="p-2">
                          <select
                            value={item.seller_status}
                            onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                            disabled={updatingId === item.id}
                            className="text-xs border border-[#E5E7EB] rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-[#2563EB] outline-none cursor-pointer"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
