import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Alert, Spinner } from '../components/UI';

export default function SellerEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category: '', title: '', description: '', price: '', stock: '', image: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/categories/'),
      api.get(`/seller/products/${id}/`),
    ]).then(([catRes, prodRes]) => {
      setCategories(catRes.data);
      setForm({
        category: prodRes.data.category?.toString() || '',
        title: prodRes.data.title || '',
        description: prodRes.data.description || '',
        price: prodRes.data.price?.toString() || '',
        stock: prodRes.data.stock?.toString() || '',
        image: prodRes.data.image || '',
      });
    }).catch(() => setError('Failed to load product')).finally(() => setLoadingProduct(false));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      const payload = {
        category: form.category,
        title: form.title,
        description: form.description,
        price: parseFloat(form.price) || 0,
        stock: parseInt(form.stock) || 0,
      };
      if (form.image) payload.image = form.image;
      await api.patch(`/seller/products/${id}/`, payload);
      setSuccess('Product updated successfully');
      setTimeout(() => navigate('/seller/products'), 800);
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 403) {
        setError('You are not allowed to edit this product.');
      } else {
        setError(typeof data === 'string' ? data : Object.values(data || {}).flat().join('. '));
      }
    } finally { setLoading(false); }
  };

  if (loadingProduct) return <div className="page-container max-w-lg"><p className="text-gray-500 text-center py-8">Loading product...</p></div>;

  return (
    <div className="page-container max-w-lg">
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Edit Product</h1>
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Category *</label><select name="category" required value={form.category} onChange={handleChange} className="input-field"><option value="">Select category...</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Title *</label><input type="text" name="title" required value={form.title} onChange={handleChange} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Description</label><textarea name="description" value={form.description} onChange={handleChange} rows="3" className="input-field" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Price *</label><input type="number" step="0.01" name="price" required value={form.price} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-[#111827] mb-1.5">Stock *</label><input type="number" name="stock" required value={form.stock} onChange={handleChange} className="input-field" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">Image URL</label>
            <input type="text" name="image" value={form.image} onChange={handleChange} className="input-field" placeholder="/products/headphones.jpg" />
            <p className="text-xs text-[#6B7280] mt-1">Example: /products/headphones.jpg or external URL</p>
            {form.image && (
              <div className="mt-2 border rounded-lg p-2 inline-block">
                <img src={form.image} alt="Preview" className="h-20 object-cover rounded" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <><Spinner /> Saving...</> : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
}
