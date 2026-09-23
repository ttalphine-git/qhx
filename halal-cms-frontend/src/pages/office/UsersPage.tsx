import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Search, Filter, RefreshCw, Users,
  UserCheck, UserX, ShieldCheck,
} from "lucide-react"
import toast from "react-hot-toast"
import OfficeLayout from "./OfficeLayout"
import { getMgmtUsers, updateUserStatus } from "@/api/users"
import { C, getStatusStyle, formatDate } from "@/lib/utils"

const ROLES = [
  "ADMIN", "AUDITOR", "REVIEWER", "OFFICER",
  "DECISION_MAKER", "FINANCE", "HALAL_REVIEWER",
  "AUDIT_PLANNER", "CERTIFICATE_CONTROLLER", "QUALITY_MANAGER",
]

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  ADMIN:                  { bg: "#fde7e9", color: "#d13438" },
  AUDITOR:                { bg: "#e5f0ff", color: "#004ea8" },
  REVIEWER:               { bg: "#f0e6f6", color: "#6b4fa0" },
  OFFICER:                { bg: "#e5f4f0", color: "#005e4e" },
  DECISION_MAKER:         { bg: "#e8f0fe", color: "#1a56db" },
  FINANCE:                { bg: "#fff8e5", color: "#8a6000" },
  HALAL_REVIEWER:         { bg: "#e6f4e8", color: "#156b20" },
  AUDIT_PLANNER:          { bg: "#e0f0ff", color: "#0057a3" },
  CERTIFICATE_CONTROLLER: { bg: "#dcfce7", color: "#15803d" },
  QUALITY_MANAGER:        { bg: "#fef3e5", color: "#7a4500" },
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [page, setPage] = useState(0)

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["users", { page, search, roleFilter }],
    queryFn: () =>
      getMgmtUsers({
        page,
        size: 20,
        search: search || undefined,
        filterByRole: roleFilter || undefined,
      }),
  })

  const users = data?.content ?? []
  const totalElements = data?.totalElements ?? 0

  const { mutate: toggleStatus, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateUserStatus(String(id), { status }),
    onSuccess: updated => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success(`User ${updated.status === "ACTIVE" ? "activated" : "suspended"} successfully`)
    },
    onError: () => toast.error("Failed to update user status"),
  })

  const activeCount    = users.filter(u => u.status === "ACTIVE").length
  const suspendedCount = users.filter(u => u.status === "SUSPENDED").length
  const adminCount     = users.filter(u => u.role === "ADMIN").length

  return (
    <OfficeLayout title="Employee Management">
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Users",  value: totalElements,  accent: C.primary  },
            { label: "Active",       value: activeCount,    accent: "#107c10"  },
            { label: "Suspended",    value: suspendedCount, accent: "#d13438"  },
            { label: "Admins",       value: adminCount,     accent: "#8764b8"  },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}
            >
              <p className="text-sm" style={{ color: C.muted }}>{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.accent }}>
                {s.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.muted }} />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
              style={{ border: `1px solid ${C.border}`, background: C.white, color: C.text, outline: "none" }}
              onFocus={e => (e.target.style.borderColor = C.accent)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.muted }} />
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(0) }}
              className="pl-9 pr-8 py-2 rounded-lg text-sm appearance-none cursor-pointer"
              style={{ border: `1px solid ${C.border}`, background: C.white, color: C.text, outline: "none" }}
            >
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button
            onClick={() => refetch()}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
            style={{ border: `1px solid ${C.border}`, background: C.white, color: C.muted }}
            onMouseOver={e => (e.currentTarget.style.background = C.bg)}
            onMouseOut={e => (e.currentTarget.style.background = C.white)}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: "#fafbfc" }}>
                {["User", "Role", "Organization", "Country", "Status", "Joined", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 rounded animate-pulse" style={{ background: "#f0f0f0" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Users className="w-9 h-9 mx-auto mb-3" style={{ color: "#d1d5db" }} />
                    <p className="font-medium" style={{ color: C.muted }}>No users found</p>
                  </td>
                </tr>
              ) : (
                users.map(user => {
                  const s = getStatusStyle(user.status)
                  const roleStyle = ROLE_STYLE[user.role] ?? { bg: "#f3f4f6", color: "#6b7280" }
                  const isActive = user.status === "ACTIVE"

                  return (
                    <tr
                      key={user.id}
                      style={{ borderBottom: `1px solid ${C.border}` }}
                      onMouseOver={e => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                            style={{ background: C.primary }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm" style={{ color: C.textDark }}>{user.name}</p>
                            <p className="text-xs" style={{ color: C.muted }}>{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="flex items-center gap-1.5 w-fit text-xs px-2.5 py-1 rounded-full font-semibold"
                          style={{ background: roleStyle.bg, color: roleStyle.color }}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm" style={{ color: C.muted }}>{user.organization ?? "—"}</td>
                      <td className="px-4 py-3.5 text-sm" style={{ color: C.muted }}>{user.country ?? "—"}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: s.bg, color: s.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm" style={{ color: C.muted }}>{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        <button
                          disabled={isPending}
                          onClick={() => toggleStatus({ id: Number(user.id), status: isActive ? "SUSPENDED" : "ACTIVE" })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          style={{ background: isActive ? "#fff0e5" : "#e6f4e6", color: isActive ? "#ca5010" : "#107c10" }}
                          onMouseOver={e => (e.currentTarget.style.opacity = "0.75")}
                          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
                        >
                          {isActive
                            ? <><UserX className="w-3.5 h-3.5" />Suspend</>
                            : <><UserCheck className="w-3.5 h-3.5" />Activate</>
                          }
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </OfficeLayout>
  )
}
