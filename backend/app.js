const express = require('express');
const Quote =  require('inspirational-quotes');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ปรับค่าตามเครื่องของคุณ
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',           // ถ้ามีให้ใส่
  database: 'inventorydb' // ชื่อตามที่คุณใช้อยู่
});

// Login แบบง่าย (เทียบรหัส plain text)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'กรอกข้อมูลไม่ครบ' });
  }

  const sql = `
    SELECT employee_id, employee_name, username, password, email, position
    FROM employees WHERE username = ? LIMIT 1
  `;
  db.query(sql, [username], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!rows.length) return res.status(401).json({ message: 'ไม่พบบัญชีผู้ใช้' });

    const u = rows[0];
    if (u.password !== password) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    const user = {
      id: u.employee_id,
      username: u.username,
      name: u.employee_name,
      email: u.email,
      role: u.position || 'staff',
    };
    res.json({ user });
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Backend running http://localhost:${PORT}`));