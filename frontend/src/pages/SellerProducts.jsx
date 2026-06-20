import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, Alert, PageHeader, StatusBadge } from '../components/UI';

const PLACEHOLDER = 'https://via.placeholder.com/400x300?text=No+Image';

export default function SellerProducts() {
  const { canSellerAddProducts } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/seller/products/').then((res) => setProducts(res.data)).catch(() => setError('Failed to load products')).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.title?.toLowerCase().includes(q) || p.category_name?.toLowerCase().includes(q) || p.status?.toLowerCase().includes(q);
  });

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/seller/products/${id}/delete/`); setProducts((p) => p.filter((pr) => pr.id !== id)); }
    catch { setError('Delete failed'); }
  };

  if (loading) return <div className="page-container"><PageHeader title="My Products" /><LoadingSpinner text="Loading your products..." /></div>;

  return (
    <div className="page-container">
      <PageHeader title="My Products" subtitle={`${products.length} products`} action={canSellerAddProducts && <Link to="/seller/products/new" className="btn-primary btn-sm">+ Add Product</Link>} />
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      {products.length > 0 && (
        <div className="relative mb-6">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your products..." className="input-field pl-9" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] hover:text-[#111827]">Clear</button>}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-[#6B7280] text-lg mb-2">
            {search ? 'No products match your search.' : 'You have not added any products yet.'}
          </p>
          {!search && canSellerAddProducts && <Link to="/seller/products/new" className="btn-primary">Create Your First Product</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="bg-gray-100 h-44 flex items-center justify-center">
                <img src={p.image || PLACEHOLDER} alt={p.title} className="h-full w-full object-contain" onError={(e) => { e.target.src = PLACEHOLDER; }} />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-[#111827]">{p.title}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">{p.category_name}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold">${parseFloat(p.price).toFixed(2)}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.stock === 0 ? 'bg-red-100 text-[#DC2626]'
                    : p.stock <= 5 ? 'bg-amber-100 text-[#F59E0B]'
                    : 'bg-green-100 text-[#16A34A]'
                  }`}>
                    {p.stock === 0 ? 'Out of Stock' : p.stock <= 5 ? `Low: ${p.stock}` : `Stock: ${p.stock}`}
                  </span>
                </div>
                {p.is_featured && <span className="inline-block mt-2 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full text-xs font-medium">Featured</span>}
                <div className="flex gap-2 mt-4">
                  <Link to={`/seller/products/${p.id}/edit`} className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors">Edit</Link>
                  <button onClick={() => handleDelete(p.id)} className="text-xs text-[#DC2626] hover:text-red-700 font-medium transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
