import { useEffect, useState } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { LoadingSpinner, Alert } from '../components/UI';

export default function Products() {
  const [products, setProducts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [search, setSearch] = useState('');

  const fetchProducts = (query = '') => { setLoading(true); api.get(query ? `/products/?search=${encodeURIComponent(query)}` : '/products/').then((res) => setProducts(res.data)).catch(() => setError('Failed to load products')).finally(() => setLoading(false)); };
  useEffect(() => { fetchProducts(); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchProducts(search); };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-[#111827]">All Products</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 sm:w-72">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="input-field pl-9" />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <button type="submit" className="btn-primary btn-sm">Search</button>
          {search && <button type="button" onClick={() => { setSearch(''); fetchProducts(); }} className="btn-secondary btn-sm">Clear</button>}
        </form>
      </div>

      {loading && <LoadingSpinner text="Loading products..." />}
      {error && <Alert type="error">{error}</Alert>}
      {!loading && !error && products.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-[#6B7280] text-lg mb-2">{search ? 'No products match your search.' : 'No products available yet.'}</p>
          {search && <button onClick={() => { setSearch(''); fetchProducts(); }} className="btn-secondary btn-sm mt-2">Clear Search</button>}
        </div>
      )}
      {products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
}
