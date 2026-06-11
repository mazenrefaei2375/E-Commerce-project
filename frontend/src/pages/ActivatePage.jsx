import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'

export default function ActivatePage() {
  const { token } = useParams()
  const [status, setStatus] = useState('activating')
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.post('/auth/activate/', { token })
      .then(() => {
        setStatus('success')
        setMessage('Account activated successfully!')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.response?.data?.token?.[0] || err.response?.data?.detail || 'Activation failed. Token may be invalid or expired.')
      })
  }, [token])

  return (
    <div className="max-w-md mx-auto mt-20 px-4 text-center">
      <div className="bg-white rounded-xl shadow-sm  p-8">
        {status === 'activating' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
            <p className="text-gray-700">Activating your account...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <h1 className="text-2xl font-bold text-green-600 mb-4">Activated!</h1>
            <p className="text-gray-700 mb-4">{message}</p>
            <Link to="/login" className="bg-blue-800 text-white px-6 py-2 rounded-lg hover:bg-blue-900">Go to Login</Link>
          </div>
        )}
        {status === 'error' && (
          <div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Activation Failed</h1>
            <p className="text-gray-700 mb-4">{message}</p>
            <Link to="/register" className="text-blue-800 hover:underline">Register again</Link>
          </div>
        )}
      </div>
    </div>
  )
}
