import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, Eye, EyeOff, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-1/2 bg-ink-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: `${(i+1)*120}px`, height: `${(i+1)*120}px`,
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)" }} />
          ))}
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center">
              <GraduationCap size={20} className="text-ink-900" />
            </div>
            <span className="font-display font-bold text-white text-2xl">ClassRoll</span>
          </div>
        </div>
        <div className="relative">
          <blockquote className="text-white/80 font-body text-lg leading-relaxed mb-4">
            "The art of teaching is the art of assisting discovery."
          </blockquote>
          <cite className="text-amber-400 font-mono text-sm">— Mark Van Doren</cite>
        </div>
        <div className="relative flex gap-4">
          {[["Total Classes", "2,400+"], ["Teachers", "580+"], ["Accuracy", "99.9%"]].map(([label, val]) => (
            <div key={label} className="bg-white/10 rounded-2xl px-5 py-4">
              <p className="text-white font-display font-bold text-xl">{val}</p>
              <p className="text-white/50 text-xs font-mono mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <GraduationCap size={24} className="text-amber-500" />
            <span className="font-display font-bold text-ink-900 text-xl">ClassRoll</span>
          </div>
          <h2 className="font-display font-bold text-ink-900 text-3xl mb-1">Welcome back</h2>
          <p className="text-ink-400 font-body text-sm mb-8">Sign in to your account to continue.</p>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Email</label>
              <input className="input" type="email" placeholder="you@school.edu"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPw ? "text" : "password"} placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-ink-400 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-ink-900 font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
