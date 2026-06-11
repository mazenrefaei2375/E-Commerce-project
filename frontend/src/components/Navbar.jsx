import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate('/')
  }

  const close = () => setOpen(false)

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="text-2xl font-bold text-indigo-600" onClick={close}>ShopHub</Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/products" className="text-gray-600 hover:text-indigo-600">Products</Link>
          <Link to="/cart" className="relative text-gray-600 hover:text-indigo-600">
            Cart
            {cart.item_count > 0 && (
              <span className="absolute -top-2 -right-4 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.item_count}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link to="/orders" className="text-gray-600 hover:text-indigo-600">Orders</Link>
              {user.is_seller && (
                <Link to="/seller/products" className="text-gray-600 hover:text-indigo-600">Sell</Link>
              )}
              {user.is_staff && (
                <Link to="/admin" className="text-gray-600 hover:text-indigo-600">Admin</Link>
              )}
              <Link to="/profile" className="text-gray-600 hover:text-indigo-600">
                {user.first_name}
              </Link>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-indigo-600">Login</Link>
              <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <Link to="/cart" className="relative text-gray-600" onClick={close}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {cart.item_count > 0 && (
              <span className="absolute -top-2 -right-3 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.item_count}
              </span>
            )}
          </Link>
          <button onClick={() => setOpen(!open)} className="text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-3 text-sm font-medium">
          <Link to="/products" onClick={close} className="block text-gray-600 py-1">Products</Link>
          {user ? (
            <>
              <Link to="/orders" onClick={close} className="block text-gray-600 py-1">Orders</Link>
              {user.is_seller && <Link to="/seller/products" onClick={close} className="block text-gray-600 py-1">Sell</Link>}
              {user.is_staff && <Link to="/admin" onClick={close} className="block text-gray-600 py-1">Admin</Link>}
              <Link to="/profile" onClick={close} className="block text-gray-600 py-1">Profile</Link>
              <button onClick={handleLogout} className="block text-red-500 py-1 w-full text-left">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={close} className="block text-gray-600 py-1">Login</Link>
              <Link to="/register" onClick={close} className="block bg-indigo-600 text-white px-4 py-2 rounded-lg text-center">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
