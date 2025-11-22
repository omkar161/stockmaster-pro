import { useEffect, useState } from 'react'
import axios from 'axios'
import { X } from 'lucide-react'

export default function HistoryPanel({ product, onClose, API_URL }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (product) {
      setLoading(true)
      axios.get(`${API_URL}/api/products/${product.id}/history`)
        .then(res => setHistory(res.data))
        .catch(() => setHistory([]))
        .finally(() => setLoading(false))
    }
  }, [product])

  if (!product) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md h-full shadow-xl">
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">History - {product.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto h-full">
          {loading ? (
            <p>Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500">No history yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Old → New</th>
                  <th className="text-left py-2">By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log, i) => (
                  <tr key={i} className="border-b dark:border-gray-700">
                    <td className="py-3">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3">{log.oldStock} → {log.newStock}</td>
                    <td className="py-3 text-gray-600">{log.changedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}