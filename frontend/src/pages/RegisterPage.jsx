import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", institution: "", role: "teacher" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError(""); setLoading(true);
    try {
      await register(form);
      toast.success("Account created! Welcome to ClassRoll.");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 bg-ink-900 rounded-xl flex items-center justify-center">
            <GraduationCap size={18} className="text-amber-400" />
          </div>
          <span className="font-display font-bold text-ink-900 text-2xl">ClassRoll</span>
        </div>

        <div className="card">
          <h2 className="font-display font-bold text-ink-900 text-2xl mb-1">Create your account</h2>
          <p className="text-ink-400 text-sm mb-6">Start tracking attendance in minutes.</p>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink-700 mb-1.5">Full Name</label>
                <input className="input" placeholder="Jane Smith" value={form.name} onChange={set("name")} required />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink-700 mb-1.5">Email</label>
                <input className="input" type="email" placeholder="jane@school.edu" value={form.email} onChange={set("email")} required />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink-700 mb-1.5">Password</label>
                <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set("password")} required />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink-700 mb-1.5">Institution (optional)</label>
                <input className="input" placeholder="DPS, Delhi" value={form.institution} onChange={set("institution")} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink-700 mb-1.5">Role</label>
                <select className="input" value={form.role} onChange={set("role")}>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-400 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-ink-900 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
