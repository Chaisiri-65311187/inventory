// backend/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',            // ใส่ถ้ามี
  database: 'inventorydb', // ชื่อตามจริง
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
