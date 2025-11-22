import { useState, useEffect } from 'react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { Search, Upload, Download, Moon, Sun } from 'lucide-react'
import ProductTable from './components/ProductTable'
import HistoryPanel from './components/HistoryPanel'

function App() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [darkMode, setDarkMode] = useState(false)

  const API_URL = import.meta.env.MODE === 'production'
    ? 'https://your-railway-app.up.railway.app'  
    : 'http://localhost:5000'

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/api/products`)
      setProducts(res.data)
      const cats = [...new Set(res.data.map(p => p.category))].sort()
      setCategories(cats)
    } catch (err) {
      toast.error('Products load nahi hue bhai!')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  useEffect(() => {
    darkMode ? document.documentElement.classList.add('dark') 
             : document.documentElement.classList.remove('dark')
  }, [darkMode])

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)

    toast.promise(
      axios.post(`${API_URL}/api/products/import`, formData),
      {
        loading: 'Import chal raha hai...',
        success: (res) => `✅ Added: ${res.data.added} | Skipped: ${res.data.skipped}`,
        error: '❌ Import fail ho gaya!'
      }
    ).then(() => fetchProducts())
  }

  const handleExport = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products/export`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'stockmaster-products.csv')
      document.body.appendChild(link)
      link.click()
      toast.success('Export ho gaya boss!')
    } catch (err) {
      toast.error('Export fail!')
    }
  }

  return (
    <>
      <div className={`min-h-screen transition-all duration-700 ${darkMode ? 'dark' : ''}`}>
        {/* EPIC HEADER */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">

              {/* TITLE - DIAMOND LEVEL */}
              <div className="main-title">
                <h1 className="head">
                     StockMaster Pro
                </h1>
                <div className="h-2 w-40 bg-gradient-to-r from-cyan-400 to-transparent rounded-full opacity-70"></div>
              </div>

              {/* CONTROLS */}
              <div className="flex flex-wrap items-center gap-5">

             

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="cat-dropdown"
                >
                  <option value="all" className="text-black">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="text-black">{cat}</option>
                  ))}
                </select>

                  <div className="buttons-div flex items-center gap-6">  
                      {/* IMPORT BUTTON */}
                      <label className="mast-button">
                        <Upload className="h-7 w-7 group-hover:animate-bounce" />
                        Import CSV
                        <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
                        <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-30 transition-opacity"></span>
                      </label>

                      {/* EXPORT BUTTON */}
                      <button onClick={handleExport} className="mast-button">  
                        <Download className="h-7 w-7 group-hover:animate-bounce" />
                        Export CSV
                        <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-30 transition-opacity"></span>
                      </button>

                    </div>

                {/* Dark Mode */}
                          
                <button 
                onClick={() => setDarkMode(!darkMode)} 
                className="dark-toggle-btn"
                >
                {darkMode ? (
                    <Sun className="sun-icon" />
                ) : (
                    <Moon className="moon-icon" />
                )}
                </button>
              </div>
            </div>
          </div>
        </div>


           {/* Search */}
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-field"
                />
                <Search className="search-icon" />
                </div>

        {/* MAIN CONTENT */}
        <div >
          {loading ? (
            <div className="text-center py-32">
              
              <p className="mt-8 text-3xl text-gray-600 dark:text-gray-300 font-bold">Loading your empire...</p>
            </div>
          ) :  (
            
          <div className="table-wrapper">
            <ProductTable
                products={products}
                search={search}
                categoryFilter={categoryFilter}
                refreshProducts={fetchProducts}
                onSelectProduct={setSelectedProduct}
                API_URL={API_URL}
            />
            </div>
          )}
        </div>

        <HistoryPanel product={selectedProduct} onClose={() => setSelectedProduct(null)} API_URL={API_URL} />
      </div>

      <Toaster position="top-right" toastOptions={{ duration: 5000, style: { background: '#333', color: '#fff' } }} />
    </>
  )
}

export default App