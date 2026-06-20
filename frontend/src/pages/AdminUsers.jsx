import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, Alert, PageHeader } from '../components/UI';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');

  useEffect(() => { api.get('/admin/users/').then((res) => setUsers(res.data)).catch(() => setError('Failed to load users')).finally(() => setLoading(false)); }, []);

  const action = async (url, msg) => {
    setError('');
    try { const res = await api.patch(url); setUsers((p) => p.map((u) => (u.id === res.data.id ? res.data : u))); }
    catch (err) { setError(err.response?.data?.error || msg + ' failed'); }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    setError('');
    try {
      const res = await api.delete(`/admin/users/${userId}/delete/`);
      setUsers((p) => p.filter((u) => u.id !== userId));
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  const isAdmin = (u) => u.is_staff || u.is_superuser;
  const activeAdminCount = users.filter((u) => isAdmin(u) && u.is_active).length;
  const isCurrentUser = (u) => currentUser && u.id === currentUser.id;

  if (loading) return <div className="page-container"><PageHeader title="Users" /><LoadingSpinner text="Loading users..." /></div>;

  return (
    <div className="page-container">
      <PageHeader title="Users" subtitle="All system accounts including customers, sellers, and admins." />
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-[#E5E7EB]"><th className="p-3 text-left font-semibold text-[#111827]">User</th><th className="p-3 text-left font-semibold text-[#111827]">Mobile</th><th className="p-3 text-left font-semibold text-[#111827]">Role</th><th className="p-3 text-left font-semibold text-[#111827]">Status</th><th className="p-3 text-left font-semibold text-[#111827]">Actions</th></tr></thead>
            <tbody>
              {users.map((u) => {
                const userIsAdmin = isAdmin(u);
                const isSelf = isCurrentUser(u);
                const isLastAdmin = userIsAdmin && u.is_active && activeAdminCount <= 1;

                return (
                <tr key={u.id} className="border-b border-[#E5E7EB] hover:bg-gray-50 transition-colors">
                  <td className="p-3"><p className="font-medium text-[#111827]">{u.first_name} {u.last_name}</p><p className="text-xs text-[#6B7280]">{u.email}</p></td>
                  <td className="p-3 text-[#6B7280]">{u.mobile || '-'}</td>
                  <td className="p-3">
                    {userIsAdmin ? (
                      <span className="text-xs font-medium text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded-full">Admin</span>
                    ) : u.is_seller ? (
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">Seller</span>
                    ) : (
                      <span className="text-xs font-medium text-[#6B7280] bg-gray-100 px-2.5 py-0.5 rounded-full">Customer</span>
                    )}</td>
                  <td className="p-3">{u.is_active ? <span className="text-xs font-medium text-[#16A34A] bg-green-50 px-2 py-0.5 rounded-full">Active</span> : <span className="text-xs font-medium text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-full">Inactive</span>}</td>
                  <td className="p-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {!userIsAdmin && !u.is_seller ? (
                        <button onClick={() => action(`/admin/users/${u.id}/make-seller/`, 'Make seller')} className="text-xs bg-[#DBEAFE] text-[#2563EB] px-2.5 py-1 rounded-md hover:bg-blue-200 transition-colors">Make Seller</button>
                      ) : !userIsAdmin && u.is_seller ? (
                        <button onClick={() => action(`/admin/users/${u.id}/remove-seller/`, 'Remove seller')} className="text-xs bg-amber-50 text-[#F59E0B] px-2.5 py-1 rounded-md hover:bg-amber-100 transition-colors">Remove Seller</button>
                      ) : null}
                      {u.is_active ? (
                        (isSelf || isLastAdmin) ? (
                          <span className="text-xs text-[#6B7280] italic px-2 py-1">{isSelf ? 'Cannot deactivate yourself' : 'Last active admin'}</span>
                        ) : (
                          <button onClick={() => action(`/admin/users/${u.id}/deactivate/`, 'Deactivate')} className="text-xs bg-red-50 text-[#DC2626] px-2.5 py-1 rounded-md hover:bg-red-100 transition-colors">Deactivate</button>
                        )
                      ) : (
                        <button onClick={() => action(`/admin/users/${u.id}/activate/`, 'Activate')} className="text-xs bg-green-50 text-[#16A34A] px-2.5 py-1 rounded-md hover:bg-green-100 transition-colors">Activate</button>
                      )}
                      {!userIsAdmin && (
                        <button onClick={() => handleDelete(u.id)} className="text-xs bg-red-100 text-[#DC2626] px-2.5 py-1 rounded-md hover:bg-red-200 transition-colors">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
