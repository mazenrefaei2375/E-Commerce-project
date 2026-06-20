import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner, Alert, PageHeader } from '../components/UI';

const PLACEHOLDER = 'https://via.placeholder.com/400x300?text=No+Image';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/products/').then((res) => setProducts(res.data)).catch(() => setError('Failed to load products')).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.category_name?.toLowerCase().includes(q) ||
      p.seller_email?.toLowerCase().includes(q) ||
      p.status?.toLowerCase().includes(q)
    );
  });

  const action = async (url) => {
    try {
      const res = await api.patch(url);
      setProducts((p) => p.map((pr) => (pr.id === res.data.id ? res.data : pr)));
    } catch { setError('Action failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/admin/products/${id}/delete/`); setProducts((p) => p.filter((pr) => pr.id !== id)); }
    catch { setError('Delete failed'); }
  };

  if (loading) return <div className="page-container"><PageHeader title="Products" /><LoadingSpinner text="Loading products..." /></div>;

  return (
    <div className="page-container">
      <PageHeader title="Products" subtitle={`${products.length} products`} action={<Link to="/admin/products/new" className="btn-primary btn-sm">+ Add Product</Link>} />
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      <div className="relative mb-6">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products, sellers, categories..." className="input-field pl-9" />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] hover:text-[#111827]">Clear</button>}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-[#6B7280]">{search ? 'No products match your search.' : 'No products found.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="bg-gray-100 h-44 flex items-center justify-center">
                <img src={p.image || PLACEHOLDER} alt={p.title} className="h-full w-full object-contain" onError={(e) => { e.target.src = PLACEHOLDER; }} />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-[#111827]">{p.title}</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">{p.category_name} &middot; {p.store_type === 'admin' ? <span className="text-[#2563EB] font-medium">Admin Store</span> : (p.seller_email || 'Seller')}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold">${parseFloat(p.price).toFixed(2)}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.stock === 0 ? 'bg-red-100 text-[#DC2626]' : p.stock <= 5 ? 'bg-amber-100 text-[#F59E0B]' : 'bg-green-100 text-[#16A34A]'}`}>
                    {p.stock === 0 ? 'Out of Stock' : p.stock <= 5 ? `Low: ${p.stock}` : `Stock: ${p.stock}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${p.status === 'approved' ? 'bg-green-50 text-[#16A34A]' : p.status === 'pending' ? 'bg-amber-50 text-[#F59E0B]' : 'bg-red-50 text-[#DC2626]'}`}>{p.status}</span>
                  {p.is_featured && <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full text-xs font-medium">Featured</span>}
                </div>
                <div className="flex gap-1.5 mt-4 flex-wrap">
                  {p.status === 'pending' && <button onClick={() => action(`/admin/products/${p.id}/approve/`)} className="text-xs bg-green-50 text-[#16A34A] px-2.5 py-1 rounded-md hover:bg-green-100 transition-colors">Approve</button>}
                  {p.status !== 'rejected' && <button onClick={() => action(`/admin/products/${p.id}/reject/`)} className="text-xs bg-red-50 text-[#DC2626] px-2.5 py-1 rounded-md hover:bg-red-100 transition-colors">Reject</button>}
                  <button onClick={() => action(`/admin/products/${p.id}/feature/`)} className={`text-xs px-2.5 py-1 rounded-md transition-colors ${p.is_featured ? 'bg-amber-50 text-[#F59E0B]' : 'bg-purple-50 text-purple-600'}`}>{p.is_featured ? 'Unfeature' : 'Feature'}</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs bg-gray-100 text-[#6B7280] px-2.5 py-1 rounded-md hover:bg-gray-200 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
