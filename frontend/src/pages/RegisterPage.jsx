import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', mobile: '',
    password: '', confirm_password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.email?.[0] || err.response?.data?.detail || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-6">Register</h1>
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl shadow-sm shadow-gray-900 p-6 space-y-4">
        {error && <div className="bg-red-900/30 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">First Name</label>
            <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Last Name</label>
            <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Mobile</label>
          <input type="text" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Confirm Password</label>
          <input type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" required />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Creating account...' : 'Register'}
        </button>
        <p className="text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
        </p>
      </form>
    </div>
  )
}
