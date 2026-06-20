import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-white border-b-2 border-[#2563EB]' : 'text-gray-300 hover:text-white'
  }`;
const mobileLinkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-[#2563EB] text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
  }`;

export default function Navbar() {
  const { user, isAdmin, isSeller, canSellerAddProducts, logout } = useAuth();

  const handleLogout = () => logout();

  const Brand = () => (
    <Link to={isAdmin ? '/admin' : isSeller ? '/seller' : '/'} className="text-xl font-bold tracking-tight text-white">
      Nile<span className="text-[#2563EB]"> Mart</span>
    </Link>
  );

  const UserMenu = () => (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400">{user?.first_name}</span>
      <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors font-medium">
        Logout
      </button>
    </div>
  );

  const NavLinks = ({ links }) => (
    <div className="hidden md:flex items-center gap-1">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) =>
          `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}>
          {l.label}
        </NavLink>
      ))}
    </div>
  );

  const MobileMenu = ({ links }) => (
    <div className="md:hidden flex flex-col gap-1 mt-3 pb-3">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} className={mobileLinkClass}>{l.label}</NavLink>
      ))}
      <button onClick={handleLogout} className="block text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">Logout</button>
    </div>
  );

  const [mobileOpen, setMobileOpen] = useState(false);

  let links = [];
  if (!user) {
    links = [
      { to: '/products', label: 'Products' },
      { to: '/login', label: 'Login' },
      { to: '/register', label: 'Register' },
    ];
  } else if (isAdmin) {
    links = [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/sellers', label: 'Sellers' },
      { to: '/admin/products', label: 'Products' },
      { to: '/admin/orders', label: 'Orders' },
      { to: '/admin/categories', label: 'Categories' },
      { to: '/profile', label: 'Profile' },
    ];
  } else if (isSeller) {
    links = [
      { to: '/seller', label: 'Dashboard' },
      { to: '/seller/products', label: 'My Products' },
      { to: '/seller/orders', label: 'Orders' },
      ...(canSellerAddProducts ? [{ to: '/seller/products/new', label: 'Add Product' }] : []),
      { to: '/profile', label: 'Profile' },
    ];
  } else {
    links = [
      { to: '/products', label: 'Products' },
      { to: '/wishlist', label: 'Wishlist' },
      { to: '/cart', label: 'Cart' },
      { to: '/orders', label: 'Orders' },
      { to: '/profile', label: 'Profile' },
    ];
  }

  return (
    <nav className="bg-[#111827] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Brand />
          <NavLinks links={links} />
          <div className="hidden md:flex items-center gap-4">
            {user && <UserMenu />}
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
        {mobileOpen && <MobileMenu links={links} />}
      </div>
    </nav>
  );
}
