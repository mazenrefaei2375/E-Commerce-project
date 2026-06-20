import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { LoadingSpinner, Alert } from '../components/UI';

export default function Home() {
  const { isAdmin, isSeller } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/products/').then((res) => setProducts(res.data.slice(0, 6))).catch(() => setError('Failed to load products')).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="text-center py-16 sm:py-20">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111827] mb-4 tracking-tight">
          Welcome to <span className="text-[#2563EB]">Nile Mart</span>
        </h1>
        <p className="text-lg text-[#6B7280] max-w-xl mx-auto mb-8">Discover amazing products at great prices. Shop the latest arrivals today.</p>
        {!isAdmin && !isSeller && (
          <Link to="/products" className="btn-primary text-base px-8 py-3">Shop Now &rarr;</Link>
        )}
      </section>

      <section className="pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#111827]">Latest Products</h2>
          <Link to="/products" className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium">View All &rarr;</Link>
        </div>
        {loading && <LoadingSpinner text="Loading products..." />}
        {error && <Alert type="error">{error}</Alert>}
        {!loading && !error && products.length === 0 && (
          <div className="card p-12 text-center"><p className="text-[#6B7280] text-lg mb-4">No products available yet.</p><p className="text-sm text-[#6B7280]">Add products from the Django Admin panel.</p></div>
        )}
        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
