// backend/app.js (clean version, use employees)

// ===== 1) imports =====
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('./db');   // ต้อง export pool จาก db.js (mysql2/promise.createPool)

const app = express();

// ===== 2) middlewares =====
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5177'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ===== 3) multer config (ต้องมาก่อนใช้ upload.single) =====
const uploadRoot = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + '-' + safe);
  }
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// เสิร์ฟรูป: http://localhost:3000/uploads/xxxx.jpg
app.use('/uploads', express.static(uploadRoot));

// ===== 4) health check =====
app.get('/api/ping', (_req, res) => res.json({ ok: true }));

// ===== 5) LOGIN =====
app.post('/api/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password)
      return res.status(400).json({ message: 'กรอกข้อมูลไม่ครบ' });

    const [rows] = await pool.query(
      `SELECT employee_id, employee_name, username, password, email, position
       FROM employees WHERE username=? LIMIT 1`, [username]
    );
    if (!rows.length) return res.status(401).json({ message: 'ไม่พบบัญชีผู้ใช้' });

    const u = rows[0];
    if (u.password !== password)
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });

    res.json({
      id: u.employee_id,
      username: u.username,
      name: u.employee_name,
      email: u.email,
      role: u.position || 'staff',
    });
  } catch (err) { next(err); }
});

// ===== 6) Dashboard APIs =====
app.get('/api/stats', async (_req, res, next) => {
  try {
    const [[{ totalEquip }]] = await pool.query(`SELECT COUNT(*) totalEquip FROM equipments`);
    const [[{ totalBrands }]] = await pool.query(`SELECT COUNT(*) totalBrands FROM brands`);
    const [[{ totalTypes }]] = await pool.query(`SELECT COUNT(*) totalTypes FROM equipmenttypes`);
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

// ===== 7) Equipments CRUD =====
app.post('/api/equipments', upload.single('photo'), async (req, res, next) => {
  const cleanupFile = () => { try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch (_) { } };
  try {
    let { equipment_name, brand_id, type_id,
      asset_code, service_code, price, description,
      start_date, status, warranty_expire } = req.body || {};

    if (!equipment_name || !equipment_name.trim()) {
      cleanupFile();
      return res.status(400).json({ message: 'กรอกชื่ออุปกรณ์' });
    }

    brand_id = brand_id ? Number(brand_id) : null;
    type_id = type_id ? Number(type_id) : null;
    price = (price === '' || price == null) ? null : Number(price);

    const file = req.file;
    const imagePath = file ? `/uploads/${file.filename}` : null;

    const [r1] = await pool.query(
      `INSERT INTO equipments (equipment_name, brand_id, type_id) VALUES (?,?,?)`,
      [equipment_name.trim(), brand_id, type_id]
    );

    await pool.query(
      `INSERT INTO equipmentdetails
       (equipment_id, asset_code, service_code, price, description, image_path, start_date, status, warranty_expire)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [r1.insertId, asset_code || null, service_code || null, price, description || null,
        imagePath, start_date || null, status || null, warranty_expire || null]
    );

    res.json({ id: r1.insertId, image_path: imagePath, message: 'เพิ่มข้อมูลสำเร็จ' });
  } catch (e) { cleanupFile(); next(e); }
});

app.get('/api/equipments', async (req, res, next) => {
  try {
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
  } catch (e) { next(e); }
});

// GET by id (simple)
app.get('/api/equipments/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'invalid id' });
    const [rows] = await pool.query(
      `SELECT * FROM equipments WHERE equipment_id=? LIMIT 1`, [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// GET full details
// GET /api/equipments/:id/full
app.get('/api/equipments/:id/full', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'invalid id' });

    const [rows] = await pool.query(`
      SELECT
        e.equipment_id,
        e.equipment_name,
        e.brand_id,
        b.brand_name,               -- << ชื่อยี่ห้อ
        e.type_id,
        t.type_name,                -- << ชื่อประเภท
        d.asset_code,
        d.service_code,
        d.price,
        d.description,
        d.image_path,
        d.start_date,
        d.status,
        d.warranty_expire
      FROM equipments e
      LEFT JOIN equipmentdetails d ON d.equipment_id = e.equipment_id
      LEFT JOIN brands b           ON e.brand_id = b.brand_id
      LEFT JOIN equipmenttypes t   ON e.type_id  = t.type_id
      WHERE e.equipment_id = ?
      LIMIT 1
    `, [id]);

    if (!rows.length) return res.status(404).json({ message: 'not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// PUT update
app.put('/api/equipments/:id', upload.single('photo'), async (req, res, next) => {
  const cleanupFile = () => { try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch (_) { } };

  try {
    const id = Number(req.params.id);
    if (!id) {
      cleanupFile();
      return res.status(400).json({ message: 'invalid id' });
    }

    // ถ้า front ส่งมาเป็น multipart form-data -> req.body จะเป็น string ทั้งหมด
    // แปลงให้เข้ากับชนิดที่ต้องการ
    let {
      equipment_name, brand_id, type_id,
      asset_code, service_code, price, description,
      start_date, status, warranty_expire
    } = req.body || {};

    brand_id = brand_id ? Number(brand_id) : null;
    type_id = type_id ? Number(type_id) : null;
    price = (price === '' || price == null) ? null : Number(price);

    const file = req.file;
    const newImagePath = file ? `/uploads/${file.filename}` : null;

    // 1) อัปเดตตารางหลัก
    await pool.query(
      `UPDATE equipments SET equipment_name=?, brand_id=?, type_id=? WHERE equipment_id=?`,
      [equipment_name || null, brand_id, type_id, id]
    );

    // 2) ดูว่ามี details อยู่หรือยัง
    const [[{ cnt }]] = await pool.query(
      `SELECT COUNT(*) cnt FROM equipmentdetails WHERE equipment_id=?`,
      [id]
    );

    if (cnt > 0) {
      // ถ้ามีรูปใหม่: ต้องเคลียร์/เก็บ path เดิมไว้เพื่อลบไฟล์ถ้าต้องการ (ทางนี้แค่แทน path)
      if (newImagePath) {
        await pool.query(
          `UPDATE equipmentdetails
             SET asset_code=?, service_code=?, price=?, description=?,
                 image_path=?, start_date=?, status=?, warranty_expire=?
           WHERE equipment_id=?`,
          [asset_code || null, service_code || null, price || null, description || null,
            newImagePath, start_date || null, status || null, warranty_expire || null, id]
        );
      } else {
        await pool.query(
          `UPDATE equipmentdetails
             SET asset_code=?, service_code=?, price=?, description=?,
                 start_date=?, status=?, warranty_expire=?
           WHERE equipment_id=?`,
          [asset_code || null, service_code || null, price || null, description || null,
          start_date || null, status || null, warranty_expire || null, id]
        );
      }
    } else {
      // ยังไม่มี details -> สร้างใหม่ (แนบ path รูปถ้ามี)
      await pool.query(
        `INSERT INTO equipmentdetails
           (equipment_id, asset_code, service_code, price, description, image_path, start_date, status, warranty_expire)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [id, asset_code || null, service_code || null, price || null, description || null,
          newImagePath, start_date || null, status || null, warranty_expire || null]
      );
    }

    res.json({ ok: true, image_path: newImagePath || undefined });
  } catch (e) {
    cleanupFile();
    next(e);
  }
});

// DELETE
app.delete('/api/equipments/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'invalid id' });
    const [r] = await pool.query(`DELETE FROM equipments WHERE equipment_id=?`, [id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ===== 8) Brands CRUD =====
app.get('/api/brands', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT brand_id, brand_name FROM brands ORDER BY brand_name`);
    res.json(rows);
  } catch (e) { next(e); }
});
app.post('/api/brands', async (req, res, next) => {
  try {
    const { brand_name } = req.body || {};
    if (!brand_name) return res.status(400).json({ message: 'กรอกชื่อยี่ห้อ' });
    const [r] = await pool.query(`INSERT INTO brands (brand_name) VALUES (?)`, [brand_name]);
    res.json({ id: r.insertId, message: 'เพิ่มสำเร็จ' });
  } catch (e) { next(e); }
});
app.put('/api/brands/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { brand_name } = req.body || {};
    if (!id || !brand_name) return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง' });
    await pool.query(`UPDATE brands SET brand_name=? WHERE brand_id=?`, [brand_name, id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
app.delete('/api/brands/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'invalid id' });
    const [r] = await pool.query(`DELETE FROM brands WHERE brand_id=?`, [id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ===== 9) Types CRUD =====
app.get('/api/types', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT type_id, type_name FROM equipmenttypes ORDER BY type_name`);
    res.json(rows);
  } catch (e) { next(e); }
});
app.post('/api/types', async (req, res, next) => {
  try {
    const { type_name } = req.body || {};
    if (!type_name) return res.status(400).json({ message: 'กรอกชื่อประเภท' });
    const [r] = await pool.query(`INSERT INTO equipmenttypes (type_name) VALUES (?)`, [type_name]);
    res.json({ id: r.insertId, message: 'เพิ่มสำเร็จ' });
  } catch (e) { next(e); }
});
app.put('/api/types/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { type_name } = req.body || {};
    if (!id || !type_name) return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง' });
    await pool.query(`UPDATE equipmenttypes SET type_name=? WHERE type_id=?`, [type_name, id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
app.delete('/api/types/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'invalid id' });
    const [r] = await pool.query(`DELETE FROM equipmenttypes WHERE type_id=?`, [id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ===== 10) Warranty List =====
app.get('/api/warranty/list', async (req, res, next) => {
  try {
    const status = (req.query.status || 'soon').toLowerCase();
    const days = Math.max(1, Number(req.query.days || 30));
    const q = (req.query.q || '').trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize || 10)));
    const offset = (page - 1) * pageSize;

    const where = []; const p = [];
    if (q) {
      where.push(`(e.equipment_name LIKE ? OR b.brand_name LIKE ? OR t.type_name LIKE ?
                   OR d.asset_code LIKE ? OR d.service_code LIKE ?)`);
      for (let i = 0; i < 5; i++) p.push(`%${q}%`);
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
      JOIN equipments e ON d.equipment_id=e.equipment_id
      LEFT JOIN brands b ON e.brand_id=b.brand_id
      LEFT JOIN equipmenttypes t ON e.type_id=t.type_id
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
       LIMIT ? OFFSET ?`, [...p, pageSize, offset]
    );

    res.json({ data: rows, page, pageSize, total });
  } catch (e) { next(e); }
});

// ===== 11) global error handler =====
app.use((err, _req, res, _next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(500).json({ message: 'Server error', detail: String(err?.message || err) });
});

// ===== 12) start =====
app.listen(3000, () => console.log('✅ Backend running: http://localhost:3000'));
