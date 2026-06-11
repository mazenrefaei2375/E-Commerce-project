import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PasswordResetPage from './pages/PasswordResetPage'
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage'
import ProfilePage from './pages/ProfilePage'
import ProductListPage from './pages/ProductListPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import OrderDetailPage from './pages/OrderDetailPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import SellerProductsPage from './pages/SellerProductsPage'
import SellerOrdersPage from './pages/SellerOrdersPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/password-reset" element={<PasswordResetPage />} />
                <Route path="/password-reset/confirm/:token" element={<PasswordResetConfirmPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/products" element={<ProductListPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
                <Route path="/seller/products" element={<SellerProductsPage />} />
                <Route path="/seller/orders" element={<SellerOrdersPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
