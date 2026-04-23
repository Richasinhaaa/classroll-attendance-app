import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../context/AuthContext";
import { Trash2, Eye, X, CalendarDays, BookOpen } from "lucide-react";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

function SessionDetailModal({ session, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ["session", session._id],
    queryFn: () => api.get(`/attendance/${session._id}`).then((r) => r.data.session),
  });

  const s = data || session;

  const statusBadge = (status) => ({
    present: "badge-present", absent: "badge-absent",
    late: "badge-late", excused: "badge-excused",
  }[status] || "badge-absent");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 sticky top-0 bg-white">
          <div>
            <h3 className="font-display font-bold text-ink-900 text-lg">{s.class} — {format(parseISO(s.date), "d MMM yyyy")}</h3>
            {s.subject && <p className="text-ink-400 text-xs">{s.subject}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-ink-50 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <p className="text-ink-400 text-sm text-center py-8">Loading…</p>
          ) : (
            <div className="space-y-2">
              {(s.records || []).map((r) => (
                <div key={r._id || r.student?._id} className="flex items-center justify-between py-2 border-b border-ink-50">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{r.student?.name || "—"}</p>
                    <p className="text-xs text-ink-400 font-mono">{r.student?.rollNumber || ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.note && <span className="text-xs text-ink-400 hidden sm:block">{r.note}</span>}
                    <span className={statusBadge(r.status)}>{r.status}</span>
                  </div>
                </div>
              ))}
              {(s.records || []).length === 0 && (
                <p className="text-ink-400 text-sm text-center py-4">No records found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AttendanceHistoryPage() {
  const qc = useQueryClient();
  const [classFilter, setClassFilter] = useState("");
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [viewSession, setViewSession] = useState(null);

  const { data: classData } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.get("/students/classes").then((r) => r.data.classes),
  });

  const [year, mon] = month.split("-");

  const { data, isLoading } = useQuery({
    queryKey: ["history", classFilter, month],
    queryFn: () =>
      api.get("/attendance", {
        params: { class: classFilter || undefined, month: mon, year },
      }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/attendance/${id}`),
    onSuccess: () => { qc.invalidateQueries(["history"]); toast.success("Session deleted."); },
    onError: (err) => toast.error(err.response?.data?.error || "Failed to delete."),
  });

  const sessions = data?.sessions || [];

  const statusCounts = (records) =>
    records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-7">
        <h2 className="font-display font-bold text-ink-900 text-3xl">Attendance History</h2>
        <p className="text-ink-400 text-sm mt-0.5">{data?.total ?? 0} sessions recorded</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input type="month" className="input w-44" value={month} onChange={(e) => setMonth(e.target.value)} />
        <select className="input w-40" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {(classData || []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="card flex items-center justify-center py-16 text-ink-400 text-sm">Loading history…</div>
      ) : sessions.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays size={38} className="text-ink-200 mb-3" />
          <p className="font-medium text-ink-700 mb-1">No sessions found</p>
          <p className="text-sm text-ink-400">No attendance recorded for this period.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const counts = statusCounts(s.records || []);
            const total = s.records?.length || 0;
            const present = (counts.present || 0) + (counts.late || 0);
            const pct = total > 0 ? Math.round((present / total) * 100) : 0;

            return (
              <div key={s._id} className="card flex items-center gap-4">
                {/* Date block */}
                <div className="bg-ink-900 text-white rounded-xl px-4 py-3 text-center min-w-[60px] shrink-0">
                  <p className="font-mono text-xs text-white/50">{format(parseISO(s.date), "MMM")}</p>
                  <p className="font-display font-bold text-xl leading-none">{format(parseISO(s.date), "d")}</p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-ink-900">Class {s.class}</p>
                    {s.subject && <span className="text-xs text-ink-400 flex items-center gap-1"><BookOpen size={11} />{s.subject}</span>}
                  </div>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="badge-present">{counts.present || 0} present</span>
                    <span className="badge-absent">{counts.absent || 0} absent</span>
                    {counts.late   > 0 && <span className="badge-late">{counts.late} late</span>}
                    {counts.excused > 0 && <span className="badge-excused">{counts.excused} excused</span>}
                  </div>
                </div>

                {/* Progress */}
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <p className="font-mono text-sm font-medium text-ink-900">{pct}%</p>
                  <div className="w-24 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-ink-400">{total} students</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setViewSession(s)} className="p-2 hover:bg-ink-50 rounded-lg text-ink-400 hover:text-ink-900 transition-colors">
                    <Eye size={15} />
                  </button>
                  <button onClick={() => { if (window.confirm("Delete this session?")) deleteMutation.mutate(s._id); }}
                    className="p-2 hover:bg-rose-50 rounded-lg text-ink-400 hover:text-rose-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewSession && (
        <SessionDetailModal session={viewSession} onClose={() => setViewSession(null)} />
      )}
    </div>
  );
}
