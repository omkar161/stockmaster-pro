import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import EditableRow from './EditableRow'
import { Trash2, Edit3 } from 'lucide-react'

export default function ProductTable({ products, search, categoryFilter, refreshProducts, onSelectProduct, API_URL }) {
  const [editingId, setEditingId] = useState(null)

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await axios.delete(`${API_URL}/api/products/${id}`)
      toast.success('Product deleted')
      refreshProducts()
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  return (
  <div className="table-container mt-8 shadow-2xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        {/* Premium Gradient Header */}
       <thead className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white uppercase text-sm font-semibold tracking-wider">
    <tr>
            <th className="px-6 py-4 text-left">Image</th>
            <th className="px-6 py-4 text-left">Name</th>
            <th className="px-6 py-4 text-left">Unit</th>
         <th className="px-6 py-4 text-left">Category</th>
         <th className="px-6 py-4 text-left">Brand</th>
            <th className="px-6 py-4 text-left">Stock</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-left">Actions</th>
    </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredProducts.map(product => 
            editingId === product.id ? (
              <EditableRow
                key={product.id}
                product={product}
                onCancel={() => setEditingId(null)}
                onSave={() => {
                  setEditingId(null)
                  refreshProducts()
                }}
                API_URL={API_URL}
              />
            ) : (
             <tr className="product-row">
  <td className="product-cell">
    <img src={product.image || 'https://via.placeholder.com/60'} alt={product.name} className="h-16 w-16 rounded-xl object-cover shadow-lg" />
  </td>
  <td className="product-cell product-name">{product.name}</td>
  <td className="product-cell">{product.unit}</td>
  <td className="product-cell">{product.category}</td>
  <td className="product-cell">{product.brand}</td>
  <td className="product-cell font-bold text-xl">{product.stock}</td>
  <td className="product-cell">
    <span className={`status-badge ${product.stock > 0 ? 'status-in-stock' : 'status-out-stock'}`}>
      {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
    </span>
  </td>
  <td className="product-cell">
    <button onClick={(e) => { e.stopPropagation(); setEditingId(product.id); }} className="action-btn edit-btn">
      <Edit3 className="h-6 w-6" />
    </button>
    <button onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }} className="action-btn delete-btn">
      <Trash2 className="h-6 w-6" />
    </button>
  </td>
</tr>
            )
          )}
        </tbody>
      </table>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">Empty</div>
          <p className="text-xl text-gray-500 dark:text-gray-400">No products found. Import some data to get started!</p>
        </div>
      )}
    </div>
  </div>
)
}