import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, RequireAdmin, RequireSeller, CustomerOnly } from './components/RequireAuth';
import MainLayout from './components/MainLayout';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminSellers from './pages/AdminSellers';
import AdminCreateSeller from './pages/AdminCreateSeller';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminCategories from './pages/AdminCategories';
import AdminAddProduct from './pages/AdminAddProduct';
import SellerDashboard from './pages/SellerDashboard';
import SellerProducts from './pages/SellerProducts';
import SellerAddProduct from './pages/SellerAddProduct';
import SellerEditProduct from './pages/SellerEditProduct';
import SellerOrders from './pages/SellerOrders';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<CustomerOnly><Cart /></CustomerOnly>} />
            <Route path="/checkout" element={<CustomerOnly><Checkout /></CustomerOnly>} />
            <Route path="/orders" element={<CustomerOnly><Orders /></CustomerOnly>} />
            <Route path="/orders/:id" element={<CustomerOnly><OrderDetail /></CustomerOnly>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/wishlist" element={<CustomerOnly><Wishlist /></CustomerOnly>} />

            <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
            <Route path="/admin/sellers" element={<RequireAdmin><AdminSellers /></RequireAdmin>} />
            <Route path="/admin/sellers/new" element={<RequireAdmin><AdminCreateSeller /></RequireAdmin>} />
            <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
            <Route path="/admin/products/new" element={<RequireAdmin><AdminAddProduct /></RequireAdmin>} />
            <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
            <Route path="/admin/categories" element={<RequireAdmin><AdminCategories /></RequireAdmin>} />

            <Route path="/seller" element={<RequireSeller><SellerDashboard /></RequireSeller>} />
            <Route path="/seller/products" element={<RequireSeller><SellerProducts /></RequireSeller>} />
            <Route path="/seller/products/new" element={<RequireSeller><SellerAddProduct /></RequireSeller>} />
            <Route path="/seller/products/:id/edit" element={<RequireSeller><SellerEditProduct /></RequireSeller>} />
            <Route path="/seller/orders" element={<RequireSeller><SellerOrders /></RequireSeller>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
