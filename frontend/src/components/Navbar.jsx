import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="text-2xl font-bold text-indigo-600">ShopHub</Link>

        <div className="flex items-center gap-6 text-sm font-medium">
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
      </div>
    </nav>
  )
}
