import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Spinner } from '../components/UI';

export default function Login() {
  const { login, redirectPath } = useAuth(); const navigate = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => { e.preventDefault(); setError(''); setLoading(true); try { await login(email, password); navigate(redirectPath()); } catch (err) { const data = err.response?.data; setError(data?.detail || (data ? Object.values(data).flat().join('. ') : 'Login failed')); } finally { setLoading(false); } };

  return (
    <div className="page-container max-w-md">
      <div className="card p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#111827]">Welcome Back</h1>
          <p className="text-sm text-[#6B7280] mt-1">Sign in to your account</p>
        </div>
        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <><Spinner /> Signing in...</> : 'Sign In'}</button>
        </form>
        <p className="text-sm text-[#6B7280] mt-6 text-center">Don't have an account? <Link to="/register" className="text-[#2563EB] font-medium hover:text-[#1D4ED8]">Register</Link></p>
      </div>
    </div>
  );
}
