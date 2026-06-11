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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-800 to-blue-950 items-center justify-center p-12">
        <div className="max-w-md text-white text-center">
          <h1 className="text-5xl font-bold mb-4">ShopHub</h1>
          <p className="text-xl text-blue-200 leading-relaxed">
            Welcome back! Sign in to access your orders, wishlist, and more.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <h1 className="text-4xl font-bold text-center text-blue-800 mb-2 lg:hidden">ShopHub</h1>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Sign In</h2>
          <p className="text-gray-500 text-center mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg shadow-gray-200 p-8 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email address</label>
              <input
                type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-700 focus:border-blue-700 outline-none transition-shadow"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Password</label>
              <input
                type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-700 focus:border-blue-700 outline-none transition-shadow"
                required
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-800 text-white py-3 rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50 transition-colors text-base shadow-md shadow-gray-200 shadow-blue-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="text-center text-sm text-gray-500 space-y-2 pt-2">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-800 font-semibold hover:text-blue-900">Create one</Link>
              </p>
              <p>
                <Link to="/password-reset" className="text-blue-700 hover:text-blue-800">Forgot your password?</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
