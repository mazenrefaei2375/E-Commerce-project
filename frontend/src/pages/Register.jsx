import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Spinner } from '../components/UI';

export default function Register() {
  const { register } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', mobile: '', password: '', confirm_password: '' });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => { e.preventDefault(); setError(''); if (form.password !== form.confirm_password) { setError('Passwords do not match'); return; } setLoading(true); try { await register(form); navigate('/login'); } catch (err) { const data = err.response?.data; const msgs = []; if (typeof data === 'string') msgs.push(data); else Object.values(data || {}).forEach((v) => { if (Array.isArray(v)) msgs.push(...v); else msgs.push(v); }); setError(msgs.join('. ') || 'Registration failed'); } finally { setLoading(false); } };

  return (
    <div className="page-container max-w-md">
      <div className="card p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#111827]">Create Account</h1>
          <p className="text-sm text-[#6B7280] mt-1">Join Nile Mart today</p>
        </div>
        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Email *</label><input type="email" name="email" required value={form.email} onChange={handleChange} className="input-field" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">First Name *</label><input type="text" name="first_name" required value={form.first_name} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Last Name *</label><input type="text" name="last_name" required value={form.last_name} onChange={handleChange} className="input-field" /></div>
          </div>
          <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Mobile Phone *</label><input type="text" name="mobile" inputMode="numeric" pattern="[0-9]*" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Password *</label><input type="password" name="password" required value={form.password} onChange={handleChange} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Confirm Password *</label><input type="password" name="confirm_password" required value={form.confirm_password} onChange={handleChange} className="input-field" /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <><Spinner /> Creating account...</> : 'Register'}</button>
        </form>
        <p className="text-sm text-[#6B7280] mt-6 text-center">Already have an account? <Link to="/login" className="text-[#2563EB] font-medium hover:text-[#1D4ED8]">Login</Link></p>
      </div>
    </div>
  );
}
