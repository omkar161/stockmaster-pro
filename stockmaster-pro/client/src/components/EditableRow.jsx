import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function EditableRow({ product, onCancel, onSave, API_URL }) {
  const [formData, setFormData] = useState({ ...product })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    try {
      await axios.put(`${API_URL}/api/products/${product.id}`, formData)
      toast.success('Product updated!')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
    }
  }

  return (
    <tr className="bg-yellow-50 dark:bg-yellow-900/20">
      <td className="px-6 py-4">
        <input
          type="text"
          name="image"
          value={formData.image}
          onChange={handleChange}
          className="w-full px-2 py-1 border rounded"
          placeholder="Image URL"
        />
      </td>
      <td className="px-6 py-4">
        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-2 py-1 border rounded font-medium" required />
      </td>
      <td className="px-6 py-4">
        <input type="text" name="unit" value={formData.unit} onChange={handleChange} className="w-full px-2 py-1 border rounded" />
      </td>
      <td className="px-6 py-4">
        <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-2 py-1 border rounded" />
      </td>
      <td className="px-6 py-4">
        <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full px-2 py-1 border rounded" />
      </td>
      <td className="px-6 py-4">
        <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-20 px-2 py-1 border rounded" min="0" />
      </td>
      <td className="px-6 py-4">
        <input type="text" name="status" value={formData.status} onChange={handleChange} className="w-full px-2 py-1 border rounded" />
      </td>
      <td className="px-6 py-4">
        <button onClick={handleSubmit} className="btn-primary text-sm mr-2">Save</button>
        <button onClick={onCancel} className="text-gray-600 hover:text-gray-800 text-sm">Cancel</button>
      </td>
    </tr>
  )
}