import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'

export default function PasswordResetConfirmPage() {
  const { token } = useParams()
  const [form, setForm] = useState({ password: '', confirm_password: '' })
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/password-reset/confirm/', { token, ...form })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.token?.[0] || err.response?.data?.password?.[0] || 'Reset failed')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 px-4 text-center">
        <div className="bg-gray-800 rounded-xl shadow-sm shadow-gray-900 p-8">
          <h1 className="text-2xl font-bold text-green-600 mb-4">Password Reset!</h1>
          <p className="text-gray-300 mb-4">Your password has been reset successfully.</p>
          <Link to="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-20 px-4">
      <h1 className="text-3xl font-bold text-center mb-6">Set New Password</h1>
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl shadow-sm shadow-gray-900 p-6 space-y-4">
        {error && <div className="bg-red-900/30 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">New Password</label>
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
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}
