import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    first_name: user?.first_name || '', last_name: user?.last_name || '',
    mobile: user?.mobile || '', birthdate: user?.birthdate || '',
    city: user?.city || '', country: user?.country || '',
    address: user?.address || '',
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await updateProfile(form)
      setMessage('Profile updated!')
    } catch (err) {
      setMessage('Update failed')
    }
    setLoading(false)
  }

  if (!user) return <div className="text-center py-20 text-gray-500">Please login to view profile</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl shadow-sm shadow-gray-900 p-6 space-y-4">
        {message && <div className={`p-3 rounded-lg text-sm ${message.includes('failed') ? 'bg-red-900/30 text-red-600' : 'bg-green-900/30 text-green-600'}`}>
          {message}
        </div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">First Name</label>
            <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Last Name</label>
            <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
          <input type="text" value={user.email} disabled
            className="w-full border rounded-lg px-4 py-2 bg-gray-950 text-gray-500" />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Mobile</label>
          <input type="text" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Birthdate</label>
          <input type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">City</label>
            <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Country</label>
            <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Update Profile'}
        </button>
      </form>
    </div>
  )
}
