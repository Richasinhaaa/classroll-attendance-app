import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { TrendingDown, Award, BarChart3 } from "lucide-react";
import { format } from "date-fns";

const PIE_COLORS = ["#34D399", "#FB7185", "#FFBF40", "#38BDF8"];

export default function ReportsPage() {
  const [cls, setCls] = useState("");
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));

  const { data: classData } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.get("/students/classes").then((r) => r.data.classes),
  });

  const [year, mon] = month.split("-");

  const { data, isLoading } = useQuery({
    queryKey: ["reports", cls, month],
    queryFn: () =>
      api.get("/reports/summary", {
        params: { class: cls || undefined, month: mon, year },
      }).then((r) => r.data),
    enabled: true,
  });

  const report = data?.report || [];
  const totalSessions = data?.totalSessions || 0;

  // Build pie data from all records
  const aggStatus = report.reduce((acc, r) => {
    acc.present  = (acc.present  || 0) + (r.stats.present  || 0);
    acc.absent   = (acc.absent   || 0) + (r.stats.absent   || 0);
    acc.late     = (acc.late     || 0) + (r.stats.late     || 0);
    acc.excused  = (acc.excused  || 0) + (r.stats.excused  || 0);
    return acc;
  }, {});

  const pieData = [
    { name: "Present", value: aggStatus.present || 0 },
    { name: "Absent",  value: aggStatus.absent  || 0 },
    { name: "Late",    value: aggStatus.late    || 0 },
    { name: "Excused", value: aggStatus.excused || 0 },
  ].filter((d) => d.value > 0);

  const barData = report.slice(0, 15).map((r) => ({
    name: r.student?.name?.split(" ")[0] || "?",
    pct: r.attendancePercentage,
  }));

  const low = report.filter((r) => r.attendancePercentage < 75);
  const top = report.filter((r) => r.attendancePercentage >= 90);

  const pctColor = (pct) =>
    pct >= 90 ? "#34D399" : pct >= 75 ? "#FFBF40" : "#FB7185";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-7">
        <h2 className="font-display font-bold text-ink-900 text-3xl">Reports</h2>
        <p className="text-ink-400 text-sm mt-0.5">Attendance analytics for your classes.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="month" className="input w-44" value={month} onChange={(e) => setMonth(e.target.value)} />
        <select className="input w-40" value={cls} onChange={(e) => setCls(e.target.value)}>
          <option value="">All Classes</option>
          {(classData || []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="card flex items-center justify-center py-16 text-ink-400 text-sm">Generating report…</div>
      ) : report.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 size={38} className="text-ink-200 mb-3" />
          <p className="font-medium text-ink-700 mb-1">No data for this period</p>
          <p className="text-sm text-ink-400">Mark attendance first to see reports.</p>
        </div>
      ) : (
        <>
          {/* Top-level summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Sessions", value: totalSessions },
              { label: "Students Tracked", value: report.length },
              { label: "Low Attendance (<75%)", value: low.length, bad: true },
              { label: "Excellent (≥90%)", value: top.length, good: true },
            ].map(({ label, value, bad, good }) => (
              <div key={label} className="card text-center">
                <p className={`font-display font-bold text-3xl ${bad ? "text-rose-500" : good ? "text-emerald-500" : "text-ink-900"}`}>{value}</p>
                <p className="text-ink-400 text-xs font-mono mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-5 mb-6">
            {/* Bar chart */}
            <div className="card">
              <h3 className="font-display font-bold text-ink-900 mb-4">Attendance % by Student</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#737373" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#737373" }} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, "Attendance"]}
                    contentStyle={{ borderRadius: "10px", border: "1px solid #E8E8E8", fontSize: 12 }}
                  />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={pctColor(entry.pct)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="card">
              <h3 className="font-display font-bold text-ink-900 mb-4">Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8}
                    formatter={(v) => <span style={{ fontSize: 12, color: "#404040" }}>{v}</span>} />
                  <Tooltip
                    formatter={(v) => [v, "count"]}
                    contentStyle={{ borderRadius: "10px", border: "1px solid #E8E8E8", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Student table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-ink-900">Student Breakdown</h3>
              <p className="text-xs text-ink-400 font-mono">{report.length} students</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-50">
                    {["Student", "Present", "Absent", "Late", "Excused", "Attendance %"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-mono text-xs text-ink-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.map((r, i) => (
                    <tr key={r.student?._id || i} className="border-b border-ink-50 hover:bg-ink-50/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-ink-100 flex items-center justify-center text-ink-600 font-bold text-xs shrink-0">
                            {r.student?.name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-ink-900">{r.student?.name}</p>
                            <p className="text-ink-400 text-xs font-mono">{r.student?.rollNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-emerald-500 font-mono text-xs">{r.stats.present || 0}</td>
                      <td className="px-5 py-3 text-rose-500 font-mono text-xs">{r.stats.absent || 0}</td>
                      <td className="px-5 py-3 text-amber-600 font-mono text-xs">{r.stats.late || 0}</td>
                      <td className="px-5 py-3 text-sky-500 font-mono text-xs">{r.stats.excused || 0}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${r.attendancePercentage}%`, backgroundColor: pctColor(r.attendancePercentage) }} />
                          </div>
                          <span className="font-mono text-xs font-medium" style={{ color: pctColor(r.attendancePercentage) }}>
                            {r.attendancePercentage}%
                          </span>
                          {r.attendancePercentage < 75 && <TrendingDown size={12} className="text-rose-400" />}
                          {r.attendancePercentage >= 90 && <Award size={12} className="text-emerald-400" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
