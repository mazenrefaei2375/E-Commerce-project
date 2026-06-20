import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Alert, PageHeader, LoadingSpinner } from '../components/UI';

export default function SellerDashboard() {
  const { user, isSellerActive, canSellerAddProducts } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSellerActive) { setLoading(false); return; }
    api.get('/seller/dashboard/')
      .then((res) => setAnalytics(res.data))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [isSellerActive]);

  if (loading) return <div className="page-container"><PageHeader title="Seller Dashboard" /><LoadingSpinner text="Loading analytics..." /></div>;

  return (
    <div className="page-container">
      <PageHeader title="Seller Dashboard" subtitle="Manage your products and sales" />

      {!isSellerActive && (
        <div className="mb-6"><Alert type="warning">Your seller account is inactive. Contact admin to activate it.</Alert></div>
      )}
      {isSellerActive && !canSellerAddProducts && (
        <div className="mb-6"><Alert type="warning">You are not allowed to add products yet. Contact admin for permission.</Alert></div>
      )}
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      {analytics && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Products', value: analytics.total_products, color: 'text-[#2563EB]' },
              { label: 'Approved', value: analytics.approved_products, color: 'text-[#16A34A]' },
              { label: 'Pending', value: analytics.pending_products, color: 'text-[#F59E0B]' },
              { label: 'Units Sold', value: analytics.total_units_sold, color: 'text-[#2563EB]' },
              { label: 'Total Revenue', value: `$${parseFloat(analytics.total_revenue).toFixed(2)}`, color: 'text-[#16A34A]' },
              { label: 'Orders', value: analytics.total_orders, color: 'text-[#2563EB]' },
              { label: 'Low Stock', value: analytics.low_stock_products, color: analytics.low_stock_products > 0 ? 'text-[#F59E0B]' : 'text-[#6B7280]' },
            ].map((s) => (
              <div key={s.label} className="card p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-[#6B7280] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {analytics.top_products?.length > 0 && (
            <div className="card p-5 mb-6">
              <h2 className="font-semibold text-[#111827] mb-4">Top Selling Products</h2>
              <div className="space-y-3">
                {analytics.top_products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-[#111827]">{p.title}</p>
                      <p className="text-xs text-[#6B7280]">Stock: {p.current_stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#111827]">{p.units_sold} sold</p>
                      <p className="text-xs text-[#6B7280]">${parseFloat(p.revenue).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics.recent_orders?.length > 0 && (
            <div className="card p-5 mb-6">
              <h2 className="font-semibold text-[#111827] mb-4">Recent Orders</h2>
              <div className="space-y-3">
                {analytics.recent_orders.map((r, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0 text-sm">
                    <div>
                      <p className="font-medium text-[#111827]">{r.product_title}</p>
                      <p className="text-xs text-[#6B7280]">Qty: {r.quantity} &middot; ${r.price}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-[#111827]">${parseFloat(r.subtotal).toFixed(2)}</span>
                      <p className="text-xs text-[#6B7280]">Order #{r.order_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics.low_stock_products > 0 && (
            <div className="mb-6"><Alert type="warning">These products are running low on stock ({analytics.low_stock_products} items with stock &le; 5).</Alert></div>
          )}

          {analytics.total_products === 0 && (
            <div className="card p-12 text-center">
              <p className="text-[#6B7280] text-lg mb-2">No products yet</p>
              {canSellerAddProducts && <Link to="/seller/products/new" className="btn-primary">Add Your First Product</Link>}
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/seller/products" className="card p-6 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-lg text-[#111827] group-hover:text-[#2563EB] transition-colors">My Products</h3>
          <p className="text-sm text-[#6B7280] mt-1">View and manage your product listings</p>
        </Link>
        {canSellerAddProducts && (
          <Link to="/seller/products/new" className="card p-6 hover:shadow-md transition-shadow group">
            <h3 className="font-semibold text-lg text-[#111827] group-hover:text-[#2563EB] transition-colors">Add Product</h3>
            <p className="text-sm text-[#6B7280] mt-1">Create a new product listing</p>
          </Link>
        )}
      </div>
    </div>
  );
}
