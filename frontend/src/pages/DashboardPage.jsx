import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, useAuth } from "../context/AuthContext";
import { Users, ClipboardCheck, TrendingDown, BookOpen, ArrowRight, CalendarDays } from "lucide-react";
import { format } from "date-fns";

function StatCard({ icon: Icon, label, value, sub, color = "amber", onClick }) {
  const colorMap = {
    amber:   "bg-amber-400/15 text-amber-600",
    emerald: "bg-emerald-400/15 text-emerald-500",
    rose:    "bg-rose-400/15 text-rose-500",
    sky:     "bg-sky-400/15 text-sky-500",
  };
  return (
    <div className={`card flex items-start gap-4 ${onClick ? "cursor-pointer" : ""}`} onClick={onClick}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-ink-400 text-xs font-mono mb-1">{label}</p>
        <p className="text-ink-900 font-display font-bold text-2xl leading-none">{value ?? "—"}</p>
        {sub && <p className="text-ink-400 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const displayDate = format(new Date(), "EEEE, d MMMM yyyy");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/reports/dashboard").then((r) => r.data),
    refetchInterval: 60_000,
  });

  const d = data || {};

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-display font-bold text-ink-900 text-3xl mb-1">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
            {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-ink-400 text-sm flex items-center gap-1.5">
            <CalendarDays size={13} /> {displayDate}
          </p>
        </div>
        <button onClick={() => navigate("/attendance")} className="btn-primary flex items-center gap-2 hidden sm:flex">
          Take Attendance <ArrowRight size={14} />
        </button>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-24 bg-ink-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users}         label="Total Students"    value={d.totalStudents}         color="sky"     onClick={() => navigate("/students")} />
          <StatCard icon={ClipboardCheck} label="Today's Rate"     value={d.todayAttendanceRate != null ? `${d.todayAttendanceRate}%` : "N/A"} sub="attendance today" color="emerald" />
          <StatCard icon={BookOpen}       label="Sessions / Month" value={d.totalSessionsThisMonth} color="amber" />
          <StatCard icon={TrendingDown}   label="Low Attendance"   value={d.lowAttendanceCount}    sub="students < 75%"  color="rose" onClick={() => navigate("/reports")} />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quick actions card */}
        <div className="card">
          <h3 className="font-display font-bold text-ink-900 text-lg mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "Take Today's Attendance", to: "/attendance", emoji: "✅" },
              { label: "Add New Student",          to: "/students",   emoji: "➕" },
              { label: "View Attendance History",  to: "/history",    emoji: "📋" },
              { label: "Generate Reports",         to: "/reports",    emoji: "📊" },
            ].map(({ label, to, emoji }) => (
              <button key={to} onClick={() => navigate(to)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-ink-50 transition-colors group text-sm font-body">
                <span className="flex items-center gap-2.5 text-ink-700">
                  <span className="text-base">{emoji}</span> {label}
                </span>
                <ArrowRight size={13} className="text-ink-300 group-hover:text-ink-700 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Info card */}
        <div className="card bg-ink-900 text-white">
          <h3 className="font-display font-bold text-xl mb-2">
            {d.todayAttendanceRate != null
              ? `${d.todayAttendanceRate}% present today`
              : "No attendance yet today"}
          </h3>
          <p className="text-white/60 text-sm mb-5">
            {d.todayAttendanceRate != null
              ? "Attendance has been marked for today."
              : "Mark today's attendance to track your class."}
          </p>
          <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white/50 text-xs font-mono">Sessions this month</p>
              <p className="text-white font-display font-bold text-2xl">{d.totalSessionsThisMonth ?? 0}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs font-mono">Classes tracked</p>
              <p className="text-white font-display font-bold text-2xl">{d.classesThisMonth ?? 0}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs font-mono">Low attendance</p>
              <p className="text-amber-400 font-display font-bold text-2xl">{d.lowAttendanceCount ?? 0}</p>
            </div>
          </div>
          <button onClick={() => navigate("/attendance")}
            className="mt-4 w-full bg-amber-400 text-ink-900 font-medium rounded-xl py-2.5 text-sm hover:bg-amber-500 transition-colors">
            Mark Attendance Now →
          </button>
        </div>
      </div>
    </div>
  );
}
