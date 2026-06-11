import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function PasswordResetPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/password-reset/', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.email?.[0] || 'Failed to send reset link')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-20 px-4 text-center">
        <div className="bg-white rounded-xl shadow-sm  p-8">
          <h1 className="text-2xl font-bold text-green-600 mb-4">Email Sent!</h1>
          <p className="text-gray-700 mb-4">Check your email for the password reset link.</p>
          <Link to="/login" className="text-blue-800 hover:underline">Back to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-20 px-4">
      <h1 className="text-3xl font-bold text-center mb-6">Reset Password</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm  p-6 space-y-4">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-700 outline-none" required />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-blue-800 text-white py-2 rounded-lg hover:bg-blue-900 disabled:opacity-50">
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        <p className="text-center text-sm text-gray-500">
          <Link to="/login" className="text-blue-800 hover:underline">Back to Login</Link>
        </p>
      </form>
    </div>
  )
}
