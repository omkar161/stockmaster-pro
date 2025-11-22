const express = require('express')
const cors = require('cors')
const multer = require('multer')
const csv = require('csv-parser')
const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

const app = express()
const upload = multer({ dest: 'uploads/' })

app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// Database setup
const db = new sqlite3.Database('./inventory.db', (err) => {
  if (err) console.error(err)
  else console.log('SQLite connected')
})

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      unit TEXT,
      category TEXT,
      brand TEXT,
      stock INTEGER DEFAULT 0,
      status TEXT,
      image TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER,
      oldStock INTEGER,
      newStock INTEGER,
      changedBy TEXT DEFAULT 'admin',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (productId) REFERENCES products (id)
    )
  `)
})

// GET all products OR search
app.get('/api/products', (req, res) => {
  const { name } = req.query
  let sql = 'SELECT * FROM products'
  let params = []

  if (name) {
    sql += ' WHERE LOWER(name) LIKE ?'
    params.push(`%${name.toLowerCase()}%`)
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})

// CSV Import
app.post('/api/products/import', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  const results = []
  const added = []
  const skipped = []
  const duplicates = []

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      let count = 0
      results.forEach((row, index) => {
        const { name, unit, category, brand, stock, status, image } = row

        // Check duplicate
        db.get('SELECT id FROM products WHERE LOWER(name) = ?', [name.toLowerCase()], (err, existing) => {
          if (existing) {
            duplicates.push({ name, existingId: existing.id })
            skipped.push(name)
          } else {
            db.run(
              `INSERT INTO products (name, unit, category, brand, stock, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [name, unit || '', category || '', brand || '', parseInt(stock) || 0, status || 'In Stock', image || ''],
              function (err) {
                if (err) skipped.push(name)
                else added.push(name)

                // Log initial stock
                db.run(
                  `INSERT INTO inventory_logs (productId, oldStock, newStock) VALUES (?, 0, ?)`,
                  [this.lastID, parseInt(stock) || 0]
                )
              }
            )
          }

          count++
          if (count === results.length) {
            setTimeout(() => {
              fs.unlinkSync(req.file.path)
              res.json({ added: added.length, skipped: skipped.length, duplicates })
            }, 500)
          }
        })
      })
    })
})

// CSV Export
app.get('/api/products/export', (req, res) => {
  db.all('SELECT * FROM products', (err, rows) => {
    if (err) return res.status(500).send(err.message)

    let csvContent = 'name,unit,category,brand,stock,status,image\n'
    rows.forEach(p => {
      csvContent += `${p.name},${p.unit},${p.category},${p.brand},${p.stock},${p.status},${p.image}\n`
    })

    res.header('Content-Type', 'text/csv')
    res.attachment('products.csv')
    res.send(csvContent)
  })
})

// Update product + log history
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params
  const { name, unit, category, brand, stock, status, image } = req.body

  // Check name unique except itself
  db.get('SELECT id FROM products WHERE LOWER(name) = ? AND id != ?', [name.toLowerCase(), id], (err, row) => {
    if (row) return res.status(400).json({ error: 'Name already exists' })

    // Get old stock
    db.get('SELECT stock FROM products WHERE id = ?', [id], (err, old) => {
      if (err || !old) return res.status(404).json({ error: 'Product not found' })

      const oldStock = old.stock
      const newStock = parseInt(stock)

      db.run(
        `UPDATE products SET name=?, unit=?, category=?, brand=?, stock=?, status=?, image=? WHERE id=?`,
        [name, unit, category, brand, newStock, status, image, id],
        function (err) {
          if (err) return res.status(500).json({ error: err.message })

          // Log only if stock changed
          if (oldStock !== newStock) {
            db.run(
              `INSERT INTO inventory_logs (productId, oldStock, newStock) VALUES (?, ?, ?)`,
              [id, oldStock, newStock]
            )
          }

          res.json({ id, name, unit, category, brand, stock: newStock, status, image })
        }
      )
    })
  })
})

// Delete product
app.delete('/api/products/:id', (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message })
    db.run('DELETE FROM inventory_logs WHERE productId = ?', [req.params.id])
    res.json({ deleted: this.changes })
  })
})

// History API
app.get('/api/products/:id/history', (req, res) => {
  db.all(
    'SELECT * FROM inventory_logs WHERE productId = ? ORDER BY timestamp DESC',
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json(rows)
    }
  )
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`http://localhost:${PORT}`)
})