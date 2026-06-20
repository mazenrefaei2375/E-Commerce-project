import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LoadingSpinner, Alert } from '../components/UI';

const today = new Date().toISOString().split('T')[0];

export default function Profile() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const [profile, setProfile] = useState(null); const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', mobile: '', address: '', birthdate: '', city: '', country: '' });
  const [error, setError] = useState(''); const [success, setSuccess] = useState('');

  useEffect(() => { if (!user) return navigate('/login'); api.get('/auth/me/').then((res) => { setProfile(res.data); setForm({ first_name: res.data.first_name || '', last_name: res.data.last_name || '', mobile: res.data.mobile || '', address: res.data.address || '', birthdate: res.data.birthdate || '', city: res.data.city || '', country: res.data.country || '' }); }).catch(() => setError('Failed to load profile')); }, [user, navigate]);

  const handleSave = async (e) => { e.preventDefault(); setError(''); setSuccess(''); try { const res = await api.patch('/auth/me/', form); setProfile(res.data); setEditing(false); setSuccess('Profile updated successfully'); } catch (err) { const data = err.response?.data; setError(typeof data === 'string' ? data : Object.values(data || {}).flat().join('. ')); } };

  if (!profile) return <div className="page-container"><LoadingSpinner text="Loading profile..." /></div>;

  return (
    <div className="page-container max-w-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">My Profile</h1>
        <button onClick={() => { logout(); navigate('/'); }} className="btn-danger btn-sm">Logout</button>
      </div>

      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}

      <div className="card p-6">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-[#111827] mb-1.5">First Name</label><input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Last Name</label><input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input-field" /></div>
            </div>
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Mobile Phone</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Address</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-[#111827] mb-1.5">City</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Country</label><input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="input-field" /></div>
            </div>
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Birthdate</label><input type="date" max={today} value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} className="input-field" /></div>
            <div className="flex gap-3"><button type="submit" className="btn-primary">Save Changes</button><button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button></div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4 pb-5 border-b border-[#E5E7EB]">
              <div className="w-16 h-16 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[#2563EB] text-2xl font-bold shrink-0">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[#111827]">{profile.first_name} {profile.last_name}</h3>
                <p className="text-sm text-[#6B7280]">{profile.email}</p>
              </div>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Mobile', value: profile.mobile },
                { label: 'Address', value: profile.address },
                { label: 'City', value: profile.city },
                { label: 'Country', value: profile.country },
                { label: 'Birthdate', value: profile.birthdate },
                { label: 'Joined', value: new Date(profile.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
              ].map((r) => (
                <div key={r.label}>
                  <dt className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1">{r.label}</dt>
                  <dd className="text-sm text-[#111827]">{r.value || 'Not set'}</dd>
                </div>
              ))}
            </dl>
            <button onClick={() => setEditing(true)} className="btn-primary w-full mt-2">Edit Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}
