import { useEffect, useState } from 'react';
import api from '../services/api';
import { LoadingSpinner, Alert, PageHeader } from '../components/UI';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    api.get('/admin/categories/')
      .then((res) => setCategories(res.data))
      .catch(() => setError('Failed to load categories'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/categories/', { name });
      setCategories([...categories, res.data]);
      setName('');
    } catch {
      setError('Failed to add category');
    }
  };

  if (loading) return <div className="page-container"><PageHeader title="Categories" /><LoadingSpinner text="Loading categories..." /></div>;

  return (
    <div className="page-container">
      <PageHeader title="Categories" subtitle={`${categories.length} categories`} />
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      <div className="card p-5 mb-6">
        <form onSubmit={handleAdd} className="flex gap-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" required className="input-field flex-1" />
          <button type="submit" className="btn-primary shrink-0">Add Category</button>
        </form>
      </div>
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="card p-4 flex items-center justify-between">
            <span className="font-medium text-[#111827]">{c.name}</span>
            <span className="text-xs text-[#6B7280] bg-gray-50 px-2 py-1 rounded">{c.slug}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
