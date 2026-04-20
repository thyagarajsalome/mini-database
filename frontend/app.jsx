import React, { useState, useEffect } from 'react';

export default function DatabaseUI() {
  const [materials, setMaterials] = useState([]);
  const [formData, setFormData] = useState({ id: '', name: '', cost: '' });

  const fetchMaterials = async () => {
    const res = await fetch('http://localhost:3001/api/materials');
    const data = await res.json();
    setMaterials(data);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:3001/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    setFormData({ id: '', name: '', cost: '' });
    fetchMaterials(); // Refresh the list
  };

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-6">Mini C-Database Dashboard</h1>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
        <input
          type="number"
          placeholder="ID"
          value={formData.id}
          onChange={(e) => setFormData({...formData, id: e.target.value})}
          className="border p-2 rounded w-20"
          required
        />
        <input
          type="text"
          placeholder="Material Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="border p-2 rounded flex-grow"
          required
        />
        <input
          type="number"
          placeholder="Unit Cost"
          value={formData.cost}
          onChange={(e) => setFormData({...formData, cost: e.target.value})}
          className="border p-2 rounded w-32"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Insert
        </button>
      </form>

      {/* Data Display */}
      <div className="border rounded shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Material Name</th>
              <th className="p-3">Unit Cost (₹)</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{item.id}</td>
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3">{item.cost}</td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td colSpan="3" className="p-3 text-center text-gray-500">
                  Database is empty. Insert a record!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}