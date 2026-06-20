import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Alert, Spinner } from '../components/UI';

export default function AdminCreateSeller() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', mobile: '', password: '', confirm_password: '', seller_type: 'basic', can_add_products: false, seller_is_active: true });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);

  const handleChange = (e) => { const { name, value, type, checked } = e.target; setForm({ ...form, [name]: type === 'checkbox' ? checked : value }); };

  const handleSubmit = async (e) => { e.preventDefault(); setError(''); setLoading(true); try { await api.post('/admin/sellers/create/', form); navigate('/admin/sellers'); } catch (err) { const data = err.response?.data; setError(typeof data === 'string' ? data : Object.values(data || {}).flat().join('. ')); } finally { setLoading(false); } };

  return (
    <div className="page-container max-w-lg">
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Add Seller</h1>
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Email *</label><input type="email" name="email" required value={form.email} onChange={handleChange} className="input-field" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">First Name *</label><input type="text" name="first_name" required value={form.first_name} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Last Name *</label><input type="text" name="last_name" required value={form.last_name} onChange={handleChange} className="input-field" /></div>
          </div>
          <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Mobile</label><input type="text" name="mobile" value={form.mobile} onChange={handleChange} className="input-field" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Password *</label><input type="password" name="password" required value={form.password} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Confirm Password *</label><input type="password" name="confirm_password" required value={form.confirm_password} onChange={handleChange} className="input-field" /></div>
          </div>
          <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Seller Type</label><select name="seller_type" value={form.seller_type} onChange={handleChange} className="input-field"><option value="basic">Basic</option><option value="approved">Approved</option><option value="trusted">Trusted</option></select></div>
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="can_add_products" checked={form.can_add_products} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" /><span className="text-sm text-[#111827]">Can Add Products</span></label>
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="seller_is_active" checked={form.seller_is_active} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" /><span className="text-sm text-[#111827]">Seller Account Active</span></label>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <><Spinner /> Creating...</> : 'Create Seller'}</button>
        </form>
      </div>
    </div>
  );
}
