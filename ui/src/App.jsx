import { useState, useEffect, useCallback, useRef } from 'react';

const API = 'http://localhost:3001/api';

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const colors = {
    success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
    error: 'bg-red-50 border-red-400 text-red-800',
    info: 'bg-blue-50 border-blue-400 text-blue-800',
  };
  const c = colors[type] || colors.info;
  return (
    <div className={'fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-in' + ' ' + c}>
      <span>✓</span>
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div onClick={onCancel} className={'fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'}>
      <div onClick={e => e.stopPropagation()} className={'bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-pop'}>
        <h3 className={'text-lg font-bold text-gray-900'}>{title}</h3>
        <p className={'text-gray-600 mt-2 text-sm'}>{message}</p>
        <div className={'flex gap-3 mt-5 justify-end'}>
          <button onClick={onCancel} className={'px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors'}>Cancel</button>
          <button onClick={onConfirm} className={'px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors'}>Delete</button>
        </div>
      </div>
    </div>
  );
}


function StatCard({ label, value, icon, color }) {
  return (
    <div className='bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow'>
      <div className={'w-12 h-12 rounded-xl ' + color + ' flex items-center justify-center text-xl'}>
        {icon}
      </div>
      <div>
        <p className='text-xs font-medium text-gray-500 uppercase tracking-wider'>{label}</p>
        <p className='text-2xl font-bold text-gray-900 mt-0.5'>{value}</p>
      </div>
    </div>
  );
}

function MaterialModal({ open, material, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', cost: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(material ? { name: material.name, cost: String(material.cost) } : { name: '', cost: '' });
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, material]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const cost = parseFloat(form.cost);
    if (!name) { setError('Name is required'); return; }
    if (isNaN(cost) || cost < 0) { setError('Cost must be a non-negative number'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ name, cost });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm' onClick={onClose}>
      <div className='bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-pop' onClick={e => e.stopPropagation()}>
        <h2 className='text-xl font-bold text-gray-900'>{material ? 'Edit Material' : 'Add Material'}</h2>
        <form onSubmit={handleSubmit} className='mt-5 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Material Name</label>
            <input ref={inputRef} type='text' value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm'
              placeholder='e.g. White Cement' />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Unit Cost</label>
            <input type='number' step='0.01' min='0' value={form.cost} onChange={e => setForm({...form, cost: e.target.value})}
              className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm'
              placeholder='e.g. 400' />
          </div>
          {error && <p className='text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg'>{error}</p>}
          <div className='flex gap-3 pt-2'>
            <button type='button' onClick={onClose}
              className='flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors'>Cancel</button>
            <button type='submit' disabled={saving}
              className='flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors disabled:opacity-50'>
              {saving ? 'Saving...' : material ? 'Update' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== Main App Component =====
export default function App() {
  const [materials, setMaterials] = useState({ data: [], total: 0, page: 1, totalPages: 0, limit: 10 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ col: 'id', order: 'asc' });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const searchTimer = useRef(null);

  const showToast = useCallback((message, type) => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const fetchMaterials = useCallback(async (q, sortCol, sortOrder, pg) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (sortCol) params.set('sort', sortCol);
      if (sortOrder) params.set('order', sortOrder);
      if (pg) params.set('page', pg);
      params.set('limit', '10');
      const res = await fetch(API + '/materials?' + params.toString());
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMaterials(data);
    } catch (err) {
      showToast('Failed to load materials', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(API + '/stats');
      if (res.ok) setStats(await res.json());
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchMaterials('', 'id', 'asc', 1);
    fetchStats();
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchMaterials(value, sortConfig.col, sortConfig.order, 1);
    }, 300);
  };

  const handleSort = (col) => {
    const order = sortConfig.col === col && sortConfig.order === 'asc' ? 'desc' : 'asc';
    setSortConfig({ col, order });
    setPage(1);
    fetchMaterials(search, col, order, 1);
  };

  const handlePageChange = (np) => {
    setPage(np);
    fetchMaterials(search, sortConfig.col, sortConfig.order, np);
  };

  const handleSave = async ({ name, cost }) => {
    const url = editing ? API + '/materials/' + editing.id : API + '/materials';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, cost }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save');
    }
    showToast(editing ? 'Material updated!' : 'Material added!', 'success');
    fetchMaterials(search, sortConfig.col, sortConfig.order, page);
    fetchStats();
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(API + '/materials/' + deleteTarget.id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Material deleted!', 'success');
      setDeleteTarget(null);
      setSelectedIds(prev => { const next = new Set(prev); next.delete(deleteTarget.id); return next; });
      fetchMaterials(search, sortConfig.col, sortConfig.order, page);
      fetchStats();
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch(API + '/materials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      showToast(selectedIds.size + ' materials deleted!', 'success');
      setSelectedIds(new Set());
      fetchMaterials(search, sortConfig.col, sortConfig.order, page);
      fetchStats();
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === materials.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(materials.data.map(m => m.id)));
    }
  };

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (mat) => { setEditing(mat); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };


  const SortIcon2 = ({ col }) => {
    if (sortConfig.col !== col) return <span className='text-gray-300 ml-1'>{String.fromCharCode(8597)}</span>;
    return <span className='text-blue-600 ml-1'>{sortConfig.order === 'asc' ? String.fromCharCode(8593) : String.fromCharCode(8595)}</span>;
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50'>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} key={toast.key} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title='Delete Material'
        message={'Are you sure you want to delete "' + (deleteTarget?.name || '') + '"? This action cannot be undone.'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <MaterialModal
        open={modalOpen}
        material={editing}
        onClose={closeModal}
        onSave={handleSave}
      />

      <div className='max-w-6xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Materials Dashboard</h1>
            <p className='text-gray-500 mt-1 text-sm'>Manage your construction materials inventory</p>
          </div>
          <button onClick={openAdd}
            className='flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300'>
            <span className='text-lg leading-none'>+</span> Add Material
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
            <StatCard label='Total Materials' value={stats.totalMaterials} icon={String.fromCodePoint(128230)} color='bg-blue-100 text-blue-600' />
            <StatCard label='Total Value' value={'Rs ' + Number(stats.totalCost).toLocaleString()} icon={String.fromCodePoint(128176)} color='bg-emerald-100 text-emerald-600' />
            <StatCard label='Average Cost' value={'Rs ' + stats.avgCost} icon={String.fromCodePoint(128202)} color='bg-purple-100 text-purple-600' />
            <StatCard label='Highest Cost' value={'Rs ' + Number(stats.maxCost).toLocaleString()} icon={String.fromCodePoint(128200)} color='bg-amber-100 text-amber-600' />
          </div>
        )}

        {/* Search & Controls */}
        <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4'>
          <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between'>
            <div className='relative flex-1 max-w-md w-full'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>{String.fromCodePoint(128269)}</span>
              <input
                type='text'
                placeholder='Search materials...'
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className='w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all'
              />
            </div>
            <div className='flex items-center gap-3'>
              {selectedIds.size > 0 && (
                <button onClick={handleBulkDelete}
                  className='px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-medium text-sm transition-colors'>
                  Delete {selectedIds.size} selected
                </button>
              )}
              <span className='text-sm text-gray-500'>{materials.total} material{materials.total !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-gray-50 border-b border-gray-200'>
                  <th className='p-3 w-10'>
                    <input type='checkbox'
                      checked={materials.data.length > 0 && selectedIds.size === materials.data.length}
                      onChange={toggleSelectAll}
                      className='rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer' />
                  </th>
                  <th className='p-3 text-left font-semibold text-gray-700 cursor-pointer select-none hover:text-blue-600 transition-colors' onClick={() => handleSort('id')}>
                    ID <SortIcon2 col='id' />
                  </th>
                  <th className='p-3 text-left font-semibold text-gray-700 cursor-pointer select-none hover:text-blue-600 transition-colors' onClick={() => handleSort('name')}>
                    Material Name <SortIcon2 col='name' />
                  </th>
                  <th className='p-3 text-left font-semibold text-gray-700 cursor-pointer select-none hover:text-blue-600 transition-colors' onClick={() => handleSort('cost')}>
                    Unit Cost <SortIcon2 col='cost' />
                  </th>
                  <th className='p-3 text-left font-semibold text-gray-700 cursor-pointer select-none hover:text-blue-600 transition-colors' onClick={() => handleSort('created_at')}>
                    Created <SortIcon2 col='created_at' />
                  </th>
                  <th className='p-3 text-right font-semibold text-gray-700'>Actions</th>
                </tr>
              </thead>
              <tbody>

                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className='border-b border-gray-100'>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className='p-3'>
                          <div className='h-4 bg-gray-100 rounded animate-pulse' style={{ width: j === 2 ? '120px' : j === 1 ? '30px' : '60px' }}></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : materials.data.length === 0 ? (
                  <tr>
                    <td colSpan='6' className='p-12 text-center'>
                      <div className='text-4xl mb-3'>{String.fromCodePoint(128476)}</div>
                      <p className='text-gray-500 font-medium'>No materials found</p>
                      <p className='text-gray-400 text-xs mt-1'>Try adjusting your search or add a new material</p>
                    </td>
                  </tr>
                ) : (
                  materials.data.map((item) => (
                    <tr key={item.id} className={'border-b border-gray-100 hover:bg-blue-50/50 transition-colors' + (selectedIds.has(item.id) ? ' bg-blue-50' : '')}>
                      <td className='p-3'>
                        <input type='checkbox'
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className='rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer' />
                      </td>
                      <td className='p-3 font-mono text-gray-500 text-xs'>#{item.id}</td>
                      <td className='p-3 font-medium text-gray-900'>{item.name}</td>
                      <td className='p-3 font-mono font-medium text-gray-900'>Rs {Number(item.cost).toLocaleString()}</td>
                      <td className='p-3 text-gray-400 text-xs'>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                      <td className='p-3 text-right'>
                        <button onClick={() => openEdit(item)}
                          className='px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-1'>Edit</button>
                        <button onClick={() => setDeleteTarget(item)}
                          className='px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors'>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {materials.totalPages > 1 && (
            <div className='flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50'>
              <span className='text-xs text-gray-500'>
                Showing {((materials.page - 1) * materials.limit) + 1}-{Math.min(materials.page * materials.limit, materials.total)} of {materials.total}
              </span>
              <div className='flex items-center gap-1'>
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}
                  className='px-3 py-1.5 text-xs rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'>
                  Previous
                </button>
                {Array.from({ length: materials.totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => handlePageChange(p)}
                    className={'w-8 h-8 text-xs rounded-lg font-medium transition-colors ' + (p === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600')}>
                    {p}
                  </button>
                ))}
                <button onClick={() => handlePageChange(page + 1)} disabled={page === materials.totalPages}
                  className='px-3 py-1.5 text-xs rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pop {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-pop { animation: pop 0.2s ease-out; }
      `}</style>
    </div>
  );
}
