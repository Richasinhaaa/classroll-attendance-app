import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, useAuth } from "../context/AuthContext";
import { ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

const HEADERS = ["User", "Institution", "Students", "Role", "Status", "Last login"];

export default function AdminPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/admin/users").then((r) => r.data.users),
  });

  const onError = (err) => toast.error(err.response?.data?.error || "Update failed.");
  const onSuccess = (message) => () => {
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    toast.success(message);
  };

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: onSuccess("Role updated."),
    onError,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/admin/users/${id}/status`, { isActive }),
    onSuccess: onSuccess("Status updated."),
    onError,
  });

  const users = data || [];
  const busy = roleMutation.isPending || statusMutation.isPending;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-7">
        <h2 className="font-display font-bold text-ink-900 text-3xl">Admin</h2>
        <p className="text-ink-400 text-sm mt-0.5">
          {users.length} accounts. New accounts start as teachers; promote or deactivate them here.
        </p>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-ink-400 text-sm">Loading…</div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShieldCheck size={40} className="text-ink-200 mb-3" />
            <p className="font-medium text-ink-700">No accounts yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100">
                  {HEADERS.map((h) => (
                    <th key={h} className="text-left px-6 py-3.5 font-mono text-xs text-ink-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isMe = u._id === me?._id;
                  return (
                    <tr key={u._id} className="border-b border-ink-50 hover:bg-ink-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-medium text-ink-900">{u.name}{isMe && " (you)"}</p>
                        <p className="text-ink-400 text-xs">{u.email}</p>
                      </td>
                      <td className="px-6 py-3.5 text-ink-600">{u.institution || "-"}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-ink-500">{u.studentCount}</td>
                      <td className="px-6 py-3.5">
                        <select
                          className="input py-1.5 w-32"
                          value={u.role}
                          disabled={isMe || busy}
                          onChange={(e) => roleMutation.mutate({ id: u._id, role: e.target.value })}
                        >
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-3.5">
                        <button
                          className={u.isActive ? "badge-present" : "badge-absent"}
                          disabled={isMe || busy}
                          title={isMe ? "You can't deactivate yourself" : "Click to toggle"}
                          onClick={() => statusMutation.mutate({ id: u._id, isActive: !u.isActive })}
                        >
                          {u.isActive ? "active" : "inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-ink-500">
                        {u.lastLogin ? format(new Date(u.lastLogin), "d MMM yyyy") : "never"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}