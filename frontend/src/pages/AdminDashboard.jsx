import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { PageHeader, LoadingSpinner, Alert, StatusBadge } from '../components/UI';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/dashboard/')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container"><PageHeader title="Admin Dashboard" /><LoadingSpinner text="Loading analytics..." /></div>;

  return (
    <div className="page-container">
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and analytics" />
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      {data && (
        <>
          {/* 1. Analytics Cards — 3 columns on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Revenue', value: `$${parseFloat(data.total_revenue).toFixed(2)}`, color: 'text-[#16A34A]' },
              { label: 'Net Revenue', value: `$${parseFloat(data.net_revenue || 0).toFixed(2)}`, color: 'text-[#2563EB]' },
              { label: 'Orders', value: data.total_orders, color: 'text-[#2563EB]' },
              { label: 'Customers', value: data.total_customers, color: 'text-[#2563EB]' },
              { label: 'Sellers', value: data.total_sellers, color: 'text-purple-600' },
              { label: 'Products', value: data.total_products, color: 'text-[#2563EB]' },
              { label: 'Pending Products', value: data.pending_products, color: data.pending_products > 0 ? 'text-[#F59E0B]' : 'text-[#6B7280]' },
              { label: 'Low Stock', value: data.low_stock_products, color: data.low_stock_products > 0 ? 'text-[#F59E0B]' : 'text-[#6B7280]' },
            ].map((s) => (
              <div key={s.label} className="card p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-[#6B7280] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* 2. Top Selling Products */}
          {data.top_products?.length > 0 && (
            <div className="card p-5 mb-6">
              <h2 className="font-semibold text-[#111827] mb-4">Top Selling Products</h2>
              <div className="space-y-3">
                {data.top_products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0 text-sm">
                    <div>
                      <p className="font-medium text-[#111827]">{p.title}</p>
                      <p className="text-xs text-[#6B7280]">Stock: {p.current_stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{p.units_sold} sold</p>
                      <p className="text-xs text-[#6B7280]">${parseFloat(p.revenue).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Attention Needed */}
          {(data.pending_products > 0 || data.low_stock_products > 0) && (
            <div className="mb-6 space-y-2">
              {data.pending_products > 0 && (
                <Alert type="warning">{data.pending_products} product(s) pending approval. <Link to="/admin/products" className="underline font-medium">Review them</Link></Alert>
              )}
              {data.low_stock_products > 0 && (
                <Alert type="warning">{data.low_stock_products} product(s) running low on stock (&le; 5).</Alert>
              )}
            </div>
          )}

          {/* 4. Recent Orders — last section */}
          {data.recent_orders?.length > 0 && (
            <div className="card p-5 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-[#111827]">Recent Orders</h2>
                <Link to="/admin/orders" className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium">View All &rarr;</Link>
              </div>
              <div className="space-y-3">
                {data.recent_orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0 text-sm">
                    <div>
                      <p className="font-medium text-[#111827]">#{o.id} — {o.customer_name}</p>
                      <p className="text-xs text-[#6B7280]">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={o.status} />
                      <span className="font-medium">${parseFloat(o.total).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. Navigation links — 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {[
          { to: '/admin/users', emoji: '👥', label: 'Users', desc: 'Manage all user accounts', color: 'from-blue-500 to-blue-600' },
          { to: '/admin/sellers', emoji: '🏪', label: 'Sellers', desc: 'Manage seller permissions', color: 'from-green-500 to-green-600' },
          { to: '/admin/products', emoji: '📦', label: 'Products', desc: 'Approve, reject, feature', color: 'from-purple-500 to-purple-600' },
          { to: '/admin/orders', emoji: '🧾', label: 'Orders', desc: 'View and manage orders', color: 'from-amber-500 to-amber-600' },
          { to: '/admin/categories', emoji: '🗂️', label: 'Categories', desc: 'Manage categories', color: 'from-rose-500 to-rose-600' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="card p-6 hover:shadow-md transition-all hover:-translate-y-0.5 group">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-lg mb-3`} aria-hidden="true">{item.emoji}</div>
            <h3 className="font-semibold text-[#111827] group-hover:text-[#2563EB] transition-colors">{item.label}</h3>
            <p className="text-sm text-[#6B7280] mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
