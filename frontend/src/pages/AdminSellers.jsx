import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner, Alert, PageHeader } from '../components/UI';

export default function AdminSellers() {
  const [sellers, setSellers] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');

  const fetch = () => api.get('/admin/sellers/').then((res) => setSellers(res.data)).catch(() => setError('Failed to load sellers')).finally(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const update = async (id, data) => { try { const res = await api.patch(`/admin/users/${id}/seller-settings/`, data); setSellers((p) => p.map((s) => (s.id === res.data.id ? res.data : s))); } catch { setError('Update failed'); } };
  const action = async (url) => { try { const res = await api.patch(url); setSellers((p) => p.map((s) => (s.id === res.data.id ? res.data : s))); } catch { setError('Action failed'); } };

  if (loading) return <div className="page-container"><PageHeader title="Sellers" /><LoadingSpinner text="Loading sellers..." /></div>;

  return (
    <div className="page-container">
      <PageHeader title="Sellers" subtitle="Manage seller accounts, seller types, and product permissions." action={<Link to="/admin/sellers/new" className="btn-primary btn-sm">+ Add Seller</Link>} />
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-[#E5E7EB]"><th className="p-3 text-left font-semibold text-[#111827]">Seller</th><th className="p-3 text-left font-semibold text-[#111827]">Type</th><th className="p-3 text-left font-semibold text-[#111827]">Can Add</th><th className="p-3 text-left font-semibold text-[#111827]">Active</th><th className="p-3 text-left font-semibold text-[#111827]">Joined At</th><th className="p-3 text-left font-semibold text-[#111827]">Settings</th><th className="p-3 text-left font-semibold text-[#111827]"></th></tr></thead>
            <tbody>
              {sellers.map((s) => (
                <tr key={s.id} className="border-b border-[#E5E7EB] hover:bg-gray-50 transition-colors">
                  <td className="p-3"><p className="font-medium text-[#111827]">{s.first_name} {s.last_name}</p><p className="text-xs text-[#6B7280]">{s.email}</p></td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${s.seller_type === 'trusted' ? 'bg-blue-50 text-[#2563EB]' : s.seller_type === 'approved' ? 'bg-green-50 text-[#16A34A]' : 'bg-gray-100 text-[#6B7280]'}`}>{s.seller_type}</span>
                  </td>
                  <td className="p-3">{s.can_add_products ? <span className="text-xs text-[#16A34A] font-medium">Yes</span> : <span className="text-xs text-[#DC2626] font-medium">No</span>}</td>
                  <td className="p-3">{s.seller_is_active ? <span className="text-xs text-[#16A34A] bg-green-50 px-2 py-0.5 rounded-full font-medium">Active</span> : <span className="text-xs text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-full font-medium">Inactive</span>}</td>
                  <td className="p-3 text-xs text-[#6B7280]">{s.date_joined ? new Date(s.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                  <td className="p-3">
                    <div className="flex gap-1.5 flex-wrap">
                      <select value={s.seller_type} onChange={(e) => update(s.id, { seller_type: e.target.value })} className="text-xs border border-[#E5E7EB] rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-[#2563EB] outline-none">
                        <option value="basic">Basic</option><option value="approved">Approved</option><option value="trusted">Trusted</option>
                      </select>
                      <button onClick={() => update(s.id, { can_add_products: !s.can_add_products })} className={`text-xs px-2 py-1 rounded-md transition-colors ${s.can_add_products ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-gray-100 text-[#6B7280]'}`}>{s.can_add_products ? 'Can Add' : 'No Add'}</button>
                      <button onClick={() => update(s.id, { seller_is_active: !s.seller_is_active })} className={`text-xs px-2 py-1 rounded-md transition-colors ${s.seller_is_active ? 'bg-green-50 text-[#16A34A]' : 'bg-red-50 text-[#DC2626]'}`}>{s.seller_is_active ? 'Active' : 'Inactive'}</button>
                    </div>
                  </td>
                  <td className="p-3"><button onClick={() => action(`/admin/users/${s.id}/remove-seller/`)} className="text-xs bg-red-50 text-[#DC2626] px-2.5 py-1 rounded-md hover:bg-red-100 transition-colors">Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
