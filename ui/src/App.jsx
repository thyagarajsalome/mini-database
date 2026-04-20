import React, { useState, useEffect } from 'react';

export default function App() {
  const [materials, setMaterials] = useState([]);
  const [formData, setFormData] = useState({ id: '', name: '', cost: '' });
  const [isEditing, setIsEditing] = useState(false);

  const fetchMaterials = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/materials');
      const data = await res.json();
      // Only update if the data is an actual array
      if (Array.isArray(data)) {
        setMaterials(data);
      } else {
        console.error("Expected array but got:", data);
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isEditing) {
      // UPDATE Request
      await fetch(`http://localhost:3001/api/materials/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, cost: formData.cost }),
      });
      setIsEditing(false);
    } else {
      // INSERT Request
      await fetch('http://localhost:3001/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }
    
    setFormData({ id: '', name: '', cost: '' });
    fetchMaterials(); // Refresh the list
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:3001/api/materials/${id}`, { 
      method: 'DELETE' 
    });
    fetchMaterials(); // Refresh the list after deleting
  };

  const handleEditClick = (item) => {
    setFormData({ id: item.id, name: item.name, cost: item.cost });
    setIsEditing(true);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-6">Mini C-Database Dashboard</h1>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-4 mb-8 bg-gray-50 p-4 rounded border">
        <input
          type="number"
          placeholder="ID"
          value={formData.id}
          onChange={(e) => setFormData({...formData, id: e.target.value})}
          className={`border p-2 rounded w-20 ${isEditing ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'}`}
          required
          readOnly={isEditing} // Prevent changing ID while editing
          title={isEditing ? "Cannot change ID during edit" : ""}
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
        <button 
          type="submit" 
          className={`px-6 py-2 rounded text-white font-medium ${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isEditing ? 'Update' : 'Insert'}
        </button>
        {isEditing && (
          <button 
            type="button"
            onClick={() => {
              setIsEditing(false);
              setFormData({ id: '', name: '', cost: '' });
            }}
            className="px-4 py-2 rounded text-gray-600 border hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
      </form>

      {/* Data Display */}
      <div className="border rounded shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Material Name</th>
              <th className="p-3">Unit Cost (₹)</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-3">{item.id}</td>
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3">₹{item.cost}</td>
                <td className="p-3 text-right space-x-3">
                  <button 
                    onClick={() => handleEditClick(item)}
                    className="text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-500">
                  Database is empty. Insert a record above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}