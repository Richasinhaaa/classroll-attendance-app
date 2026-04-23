import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../context/AuthContext";
import { Save, CheckCircle2, XCircle, Clock, FileQuestion, ChevronDown, Users } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "present", label: "Present", icon: CheckCircle2, cls: "badge-present" },
  { value: "absent",  label: "Absent",  icon: XCircle,      cls: "badge-absent" },
  { value: "late",    label: "Late",    icon: Clock,        cls: "badge-late" },
  { value: "excused", label: "Excused", icon: FileQuestion, cls: "badge-excused" },
];

export default function TakeAttendancePage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cls, setCls] = useState("");
  const [subject, setSubject] = useState("");
  const [records, setRecords] = useState({});
  const [saved, setSaved] = useState(false);

  const { data: classData } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.get("/students/classes").then((r) => r.data.classes),
  });

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ["students-for-attendance", cls],
    queryFn: () => api.get("/students", { params: { class: cls, limit: 200 } }).then((r) => r.data),
    enabled: !!cls,
  });

  // Init records when students load
  useEffect(() => {
    if (studentsData?.students) {
      const init = {};
      studentsData.students.forEach((s) => {
        init[s._id] = records[s._id] || { status: "present", note: "" };
      });
      setRecords(init);
      setSaved(false);
    }
  }, [studentsData]);

  const setStatus = (id, status) =>
    setRecords((r) => ({ ...r, [id]: { ...r[id], status } }));

  const setNote = (id, note) =>
    setRecords((r) => ({ ...r, [id]: { ...r[id], note } }));

  const markAll = (status) => {
    const updated = {};
    Object.keys(records).forEach((id) => { updated[id] = { ...records[id], status }; });
    setRecords(updated);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        date, class: cls, subject,
        records: Object.entries(records).map(([student, r]) => ({
          student, status: r.status, note: r.note,
        })),
      };
      return api.post("/attendance", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries(["dashboard"]);
      setSaved(true);
      toast.success("Attendance saved!");
    },
    onError: (err) => toast.error(err.response?.data?.error || "Failed to save."),
  });

  const students = studentsData?.students || [];
  const stats = Object.values(records).reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-7">
        <h2 className="font-display font-bold text-ink-900 text-3xl">Take Attendance</h2>
        <p className="text-ink-400 text-sm mt-0.5">Mark attendance for your class below.</p>
      </div>

      {/* Config row */}
      <div className="card mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Class *</label>
            <select className="input" value={cls} onChange={(e) => setCls(e.target.value)}>
              <option value="">Select class…</option>
              {(classData || []).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Subject</label>
            <input className="input" placeholder="Mathematics" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
        </div>
      </div>

      {!cls ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center text-ink-400">
          <Users size={36} className="mb-3 text-ink-200" />
          <p className="font-medium text-ink-700 mb-1">Select a class to begin</p>
          <p className="text-sm">Choose the class above to load the student list.</p>
        </div>
      ) : isLoading ? (
        <div className="card flex items-center justify-center py-16 text-ink-400 text-sm">Loading students…</div>
      ) : students.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-medium text-ink-700 mb-1">No students in this class</p>
          <p className="text-sm text-ink-400">Add students first from the Students page.</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(({ value, label, cls: badgeCls }) => (
                <span key={value} className={badgeCls}>
                  {stats[value] || 0} {label}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => markAll("present")} className="btn-secondary text-xs py-1.5 px-3">All Present</button>
              <button onClick={() => markAll("absent")}  className="btn-secondary text-xs py-1.5 px-3">All Absent</button>
            </div>
          </div>

          {/* Student list */}
          <div className="card p-0 overflow-hidden mb-5">
            {students.map((s, i) => {
              const rec = records[s._id] || { status: "present", note: "" };
              const opt = STATUS_OPTIONS.find((o) => o.value === rec.status);
              return (
                <div key={s._id} className={`flex items-center gap-4 px-5 py-3.5 border-b border-ink-50 last:border-0 ${i % 2 === 0 ? "" : "bg-ink-50/30"}`}>
                  <div className="w-8 h-8 rounded-full bg-amber-400/15 flex items-center justify-center text-amber-600 font-bold text-sm shrink-0">
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-900 text-sm">{s.name}</p>
                    <p className="text-ink-400 text-xs font-mono">{s.rollNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Status buttons */}
                    <div className="hidden sm:flex gap-1">
                      {STATUS_OPTIONS.map(({ value, label, cls: bc }) => (
                        <button key={value} onClick={() => setStatus(s._id, value)}
                          className={`text-xs px-2.5 py-1 rounded-full font-mono transition-all ${rec.status === value ? bc + " ring-2 ring-offset-1 ring-current" : "bg-ink-100 text-ink-400 hover:bg-ink-200"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {/* Mobile dropdown */}
                    <div className="sm:hidden">
                      <select
                        value={rec.status}
                        onChange={(e) => setStatus(s._id, e.target.value)}
                        className="text-xs border border-ink-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                        {STATUS_OPTIONS.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Note input */}
                    <input
                      className="hidden md:block w-32 text-xs border border-ink-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-ink-900 bg-white placeholder:text-ink-300"
                      placeholder="Note…"
                      value={rec.note}
                      onChange={(e) => setNote(s._id, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            {saved && <p className="text-emerald-500 text-sm flex items-center gap-1.5"><CheckCircle2 size={14} /> Saved successfully</p>}
            <div className="ml-auto">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="btn-primary flex items-center gap-2">
                {saveMutation.isPending
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Save size={14} />}
                Save Attendance
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
