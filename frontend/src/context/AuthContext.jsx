import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const access = localStorage.getItem('access_token')
    if (access) {
      api.get('/auth/profile/')
        .then(({ data }) => setUser(data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password })
    localStorage.setItem('access_token', data.tokens.access)
    localStorage.setItem('refresh_token', data.tokens.refresh)
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const { data } = await api.post('/auth/register/', formData)
    localStorage.setItem('access_token', data.tokens.access)
    localStorage.setItem('refresh_token', data.tokens.refresh)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  const updateProfile = async (formData) => {
    const { data } = await api.put('/auth/profile/', formData)
    setUser(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
