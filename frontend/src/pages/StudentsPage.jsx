import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../context/AuthContext";
import { Plus, Search, Pencil, Trash2, X, UserRound, Upload } from "lucide-react";
import toast from "react-hot-toast";

const EMPTY = { name: "", rollNumber: "", class: "", section: "", subject: "", email: "", phone: "", guardian: "", guardianPhone: "" };

function StudentModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 sticky top-0 bg-white">
          <h3 className="font-display font-bold text-ink-900 text-lg">{initial?._id ? "Edit Student" : "Add Student"}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-ink-50 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Full Name *</label>
            <input className="input" value={form.name} onChange={set("name")} placeholder="Arjun Sharma" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Roll Number *</label>
            <input className="input" value={form.rollNumber} onChange={set("rollNumber")} placeholder="A-01" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Class *</label>
            <input className="input" value={form.class} onChange={set("class")} placeholder="10th" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Section</label>
            <input className="input" value={form.section} onChange={set("section")} placeholder="B" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Subject</label>
            <input className="input" value={form.subject} onChange={set("subject")} placeholder="Mathematics" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Email</label>
            <input className="input" type="email" value={form.email} onChange={set("email")} placeholder="arjun@school.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Phone</label>
            <input className="input" value={form.phone} onChange={set("phone")} placeholder="+91 98765..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Guardian</label>
            <input className="input" value={form.guardian} onChange={set("guardian")} placeholder="Parent name" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Guardian Phone</label>
            <input className="input" value={form.guardianPhone} onChange={set("guardianPhone")} placeholder="+91 98765..." />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(form)} className="btn-primary">
            {initial?._id ? "Save Changes" : "Add Student"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [modal, setModal] = useState(null); // null | "add" | student object

  const { data: classData } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.get("/students/classes").then((r) => r.data.classes),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["students", search, classFilter],
    queryFn: () => api.get("/students", { params: { search, class: classFilter } }).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (form) =>
      form._id
        ? api.put(`/students/${form._id}`, form)
        : api.post("/students", form),
    onSuccess: (_, form) => {
      qc.invalidateQueries(["students"]);
      qc.invalidateQueries(["classes"]);
      toast.success(form._id ? "Student updated!" : "Student added!");
      setModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || "Failed to save."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/students/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(["students"]);
      toast.success("Student removed.");
    },
    onError: (err) => toast.error(err.response?.data?.error || "Failed to delete."),
  });

  const handleDelete = (s) => {
    if (window.confirm(`Remove ${s.name}?`)) deleteMutation.mutate(s._id);
  };

  const students = data?.students || [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="font-display font-bold text-ink-900 text-3xl">Students</h2>
          <p className="text-ink-400 text-sm mt-0.5">{data?.total ?? 0} students enrolled</p>
        </div>
        <button onClick={() => setModal("add")} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="input pl-9" placeholder="Search by name or roll number…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {(classData || []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-ink-400 text-sm">Loading…</div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UserRound size={40} className="text-ink-200 mb-3" />
            <p className="font-medium text-ink-700 mb-1">No students found</p>
            <p className="text-ink-400 text-sm">Add your first student to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="text-left px-6 py-3.5 font-mono text-xs text-ink-400 font-medium">Roll</th>
                  <th className="text-left px-6 py-3.5 font-mono text-xs text-ink-400 font-medium">Name</th>
                  <th className="text-left px-6 py-3.5 font-mono text-xs text-ink-400 font-medium">Class</th>
                  <th className="text-left px-6 py-3.5 font-mono text-xs text-ink-400 font-medium hidden md:table-cell">Subject</th>
                  <th className="text-left px-6 py-3.5 font-mono text-xs text-ink-400 font-medium hidden lg:table-cell">Guardian</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s._id} className={`border-b border-ink-50 hover:bg-ink-50/50 transition-colors ${i % 2 === 0 ? "" : "bg-ink-50/30"}`}>
                    <td className="px-6 py-3.5 font-mono text-xs text-ink-500">{s.rollNumber}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-600 font-bold text-xs shrink-0">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-ink-900">{s.name}</p>
                          {s.email && <p className="text-ink-400 text-xs">{s.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-ink-700">
                      {s.class}{s.section ? `-${s.section}` : ""}
                    </td>
                    <td className="px-6 py-3.5 text-ink-500 hidden md:table-cell">{s.subject || "—"}</td>
                    <td className="px-6 py-3.5 text-ink-500 hidden lg:table-cell">{s.guardian || "—"}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => setModal(s)} className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-400 hover:text-ink-900 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(s)} className="p-1.5 rounded-lg hover:bg-rose-50 text-ink-400 hover:text-rose-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <StudentModal
          initial={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={(form) => saveMutation.mutate(modal === "add" ? form : { ...form, _id: modal._id })}
        />
      )}
    </div>
  );
}
