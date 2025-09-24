// backend/app.js  (เวอร์ชันสะอาด ใช้ employees)

// 1) imports + init
const express = require('express');
const cors = require('cors');
const pool = require('./db');     // ต้อง export pool จาก db.js (mysql2/promise.createPool)

const app = express();

// 2) middlewares (เรียกครั้งเดียวพอ)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5177'],   
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));                     
app.use(express.json());                          

// 3) health check
app.get('/api/ping', (_req, res) => res.json({ ok: true }));

// 4) LOGIN — ใช้ตาราง employees
app.post('/api/login', async (req, res, next) => {
  try {
    console.log('LOGIN body:', req.body);
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'กรอกข้อมูลไม่ครบ' });
    }

    const [rows] = await pool.query(
      `SELECT employee_id, employee_name, username, password, email, position
         FROM employees
        WHERE username = ?
        LIMIT 1`,
      [username]
    );

    if (!rows.length) return res.status(401).json({ message: 'ไม่พบบัญชีผู้ใช้' });

    const u = rows[0];
    if (u.password !== password) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // ส่งค่าที่ front ใช้ (ชื่อฟิลด์ให้เรียบง่าย)
    res.json({
      id: u.employee_id,
      username: u.username,
      name: u.employee_name,
      email: u.email,
      role: u.position || 'staff',
    });
  } catch (err) {
    next(err);
  }
});

// 5) Dashboard APIs
app.get('/api/stats', async (_req, res, next) => {
  try {
    const [[{ totalEquip }]]   = await pool.query(`SELECT COUNT(*) totalEquip FROM equipments`);
    const [[{ totalBrands }]]  = await pool.query(`SELECT COUNT(*) totalBrands FROM brands`);
    const [[{ totalTypes }]]   = await pool.query(`SELECT COUNT(*) totalTypes FROM equipmenttypes`);
    const [[{ expiringIn30 }]] = await pool.query(`
      SELECT COUNT(*) expiringIn30
        FROM equipmentdetails
       WHERE warranty_expire IS NOT NULL
         AND warranty_expire >= CURDATE()
         AND warranty_expire < DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `);
    res.json({ totalEquip, totalBrands, totalTypes, expiringIn30 });
  } catch (e) { next(e); }
});

app.get('/api/equipments/latest', async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit || 6)));
    const [rows] = await pool.query(`
      SELECT e.equipment_id, e.equipment_name, b.brand_name, t.type_name
        FROM equipments e
        LEFT JOIN brands b ON e.brand_id=b.brand_id
        LEFT JOIN equipmenttypes t ON e.type_id=t.type_id
       ORDER BY e.equipment_id DESC
       LIMIT ?`, [limit]);
    res.json(rows);
  } catch (e) { next(e); }
});

app.get('/api/warranty/expiring', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.equipment_id, e.equipment_name, b.brand_name, t.type_name,
             d.warranty_expire,
             DATEDIFF(d.warranty_expire, CURDATE()) AS days_left
        FROM equipmentdetails d
        JOIN equipments e ON d.equipment_id=e.equipment_id
        LEFT JOIN brands b ON e.brand_id=b.brand_id
        LEFT JOIN equipmenttypes t ON e.type_id=t.type_id
       WHERE d.warranty_expire IS NOT NULL
       ORDER BY d.warranty_expire ASC
       LIMIT 10
    `);
    res.json(rows);
  } catch (e) { next(e); }
});

app.post('/api/equipments', async (req, res, next) => {
  try {
    const {
      equipment_name,
      brand_id,
      type_id,
      asset_code,
      service_code,
      price,
      description,
      start_date,
      status,
      warranty_expire,
    } = req.body || {};

    if (!equipment_name) {
      return res.status(400).json({ message: 'กรอกชื่ออุปกรณ์' });
    }

    // 1) insert ที่ตารางหลัก equipments
    const [r1] = await pool.query(
      `INSERT INTO equipments (equipment_name, brand_id, type_id)
       VALUES (?,?,?)`,
      [equipment_name, brand_id || null, type_id || null]
    );

    // 2) insert รายละเอียดใน equipmentdetails
    await pool.query(
      `INSERT INTO equipmentdetails
        (equipment_id, asset_code, service_code, price, description, start_date, status, warranty_expire)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        r1.insertId,
        asset_code || null,
        service_code || null,
        price || null,
        description || null,
        start_date || null,
        status || null,
        warranty_expire || null,
      ]
    );

    res.json({ id: r1.insertId, message: 'เพิ่มข้อมูลสำเร็จ' });
  } catch (err) {
    next(err);
  }
});

app.get('/api/brands', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT brand_id, brand_name
         FROM brands
        ORDER BY brand_name`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// อ้างอิงประเภทอุปกรณ์
app.get('/api/types', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT type_id, type_name
         FROM equipmenttypes
        ORDER BY type_name`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/warranty/list?status=soon&days=30&q=&page=1&pageSize=10
app.get('/api/warranty/list', async (req, res, next) => {
  try {
    const status   = (req.query.status || 'soon').toLowerCase(); // soon|expired|active|all
    const days     = Math.max(1, Number(req.query.days || 30));
    const q        = (req.query.q || '').trim();
    const page     = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize || 10)));
    const offset   = (page - 1) * pageSize;

    const where = [];
    const p = [];

    if (q) {
      where.push(`(e.equipment_name LIKE ? OR b.brand_name LIKE ? OR t.type_name LIKE ?
                   OR d.asset_code LIKE ? OR d.service_code LIKE ?)`);
      for (let i=0;i<5;i++) p.push(`%${q}%`);
    }
    if (status === 'soon') {
      where.push(`d.warranty_expire IS NOT NULL
                  AND d.warranty_expire >= CURDATE()
                  AND d.warranty_expire <= DATE_ADD(CURDATE(), INTERVAL ? DAY)`);
      p.push(days);
    } else if (status === 'expired') {
      where.push(`d.warranty_expire IS NOT NULL AND d.warranty_expire < CURDATE()`);
    } else if (status === 'active') {
      where.push(`d.warranty_expire IS NOT NULL
                  AND d.warranty_expire > DATE_ADD(CURDATE(), INTERVAL ? DAY)`);
      p.push(days);
    } else {
      where.push(`d.warranty_expire IS NOT NULL`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const base = `
      FROM equipmentdetails d
      JOIN equipments e ON d.equipment_id = e.equipment_id
      LEFT JOIN brands b ON e.brand_id = b.brand_id
      LEFT JOIN equipmenttypes t ON e.type_id = t.type_id
      ${whereSQL}
    `;

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) total ${base}`, p);

    const [rows] = await pool.query(
      `SELECT e.equipment_id, e.equipment_name,
              b.brand_name, t.type_name,
              d.asset_code, d.service_code,
              d.start_date, d.warranty_expire,
              DATEDIFF(d.warranty_expire, CURDATE()) AS days_left
       ${base}
       ORDER BY d.warranty_expire ASC
       LIMIT ? OFFSET ?`,
      [...p, pageSize, offset]
    );

    res.json({ data: rows, page, pageSize, total });
  } catch (e) { next(e); }
});

app.get('/api/equipments', async (req, res) => {
  const q = `%${(req.query.q || '').trim()}%`;
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize || 10)));
  const offset = (page - 1) * pageSize;

  const [rows] = await pool.query(`
    SELECT e.equipment_id, e.equipment_name, b.brand_name, t.type_name
    FROM equipments e
    LEFT JOIN brands b ON e.brand_id=b.brand_id
    LEFT JOIN equipmenttypes t ON e.type_id=t.type_id
    WHERE e.equipment_name LIKE ? OR b.brand_name LIKE ? OR t.type_name LIKE ?
    ORDER BY e.equipment_id DESC
    LIMIT ? OFFSET ?`, [q, q, q, pageSize, offset]);

  const [[{ total }]] = await pool.query(`
    SELECT COUNT(*) total
    FROM equipments e
    LEFT JOIN brands b ON e.brand_id=b.brand_id
    LEFT JOIN equipmenttypes t ON e.type_id=t.type_id
    WHERE e.equipment_name LIKE ? OR b.brand_name LIKE ? OR t.type_name LIKE ?`, [q, q, q]);

  res.json({ data: rows, page, pageSize, total });
});

app.delete('/api/equipments/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'invalid id' });

    // log ดูที่ฝั่ง server เวลากดลบ
    console.log('DELETE /api/equipments/', id);

    // ถ้าตั้ง FK CASCADE แล้ว ลบที่แม่พอ
    const [r] = await pool.query('DELETE FROM equipments WHERE equipment_id=?', [id]);

    if (!r.affectedRows) return res.status(404).json({ message: 'not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// 6) global error handler (ต้องอยู่ท้าย routes)
app.use((err, _req, res, _next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(500).json({ message: 'Server error', detail: String(err?.message || err) });
});


// 7) start
app.listen(3000, () => console.log('✅ Backend running: http://localhost:3000'));
