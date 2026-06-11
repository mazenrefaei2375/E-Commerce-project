import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-indigo-800 items-center justify-center p-12">
        <div className="max-w-md text-white text-center">
          <h1 className="text-5xl font-bold mb-4">ShopHub</h1>
          <p className="text-xl text-indigo-200 leading-relaxed">
            Welcome back! Sign in to access your orders, wishlist, and more.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <h1 className="text-4xl font-bold text-center text-indigo-600 mb-2 lg:hidden">ShopHub</h1>

          <h2 className="text-2xl font-bold text-gray-100 text-center mb-2">Sign In</h2>
          <p className="text-gray-500 text-center mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl shadow-lg shadow-gray-900/50 p-8 space-y-5">
            {error && (
              <div className="bg-red-900/30 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1.5">Email address</label>
              <input
                type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full border border-gray-600 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1.5">Password</label>
              <input
                type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                className="w-full border border-gray-600 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                required
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors text-base shadow-md shadow-gray-900/40 shadow-indigo-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="text-center text-sm text-gray-500 space-y-2 pt-2">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">Create one</Link>
              </p>
              <p>
                <Link to="/password-reset" className="text-indigo-500 hover:text-indigo-600">Forgot your password?</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
