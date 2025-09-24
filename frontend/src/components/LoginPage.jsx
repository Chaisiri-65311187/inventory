import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { loginRequest } from "../services/api";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = e => setForm(s => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { user } = await loginRequest(form.username, form.password);
      localStorage.setItem("auth_user", JSON.stringify(user));
      Swal.fire({ icon: "success", title: "เข้าสู่ระบบสำเร็จ", timer: 900, showConfirmButton: false });
      navigate("/home", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ";
      Swal.fire("ผิดพลาด", msg, "error");
    } finally { setLoading(false); }
  };

  return (
  <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
    <div className="card shadow border-0 rounded-4 w-100" style={{ maxWidth: 420, margin: '0 16px' }}>
      <div className="card-body p-4 p-md-5">
        <h5 className="text-primary fw-bold mb-4 text-center">ระบบจัดการอุปกรณ์</h5>

        <form onSubmit={onSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label">ชื่อผู้ใช้</label>
            <input className="form-control" name="username" value={form.username}
                   onChange={onChange} autoComplete="username" required />
          </div>
          <div className="mb-3">
            <label className="form-label">รหัสผ่าน</label>
            <input type="password" className="form-control" name="password" value={form.password}
                   onChange={onChange} autoComplete="current-password" required />
          </div>
          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  </div>
);
}
