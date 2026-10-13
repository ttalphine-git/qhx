import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Clock, ChevronRight, AlertCircle, CheckCircle2, User, Building2, Calendar, Search, RefreshCw, Loader } from "lucide-react"
import toast from "react-hot-toast"
import OfficeLayout from "./OfficeLayout"
import apiClient from "@/api/client"
import { useAuthStore } from "@/store/authStore"
import { getStatusStyle } from "@/lib/utils"

const F = "'Inter', system-ui, sans-serif"

interface AssignedApplication {
  id: number
  applicationNumber: string
  companyName: string
  status: string
  assignedAt: string
  products?: any[]
  ncsCleared?: boolean
}

export default function DecisionMakerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [search, setSearch] = useState("")

  const { data: applications = [], isLoading, refetch } = useQuery({
    queryKey: ["decision-maker-assignments", user?.id],
    queryFn: async () => {
      try {
        const response = await apiClient.get<AssignedApplication[]>(`/applications/assigned-to-me/decision-maker`)
        return response.data
      } catch (err) {
        console.error("Error fetching assignments:", err)
        return []
      }
    },
  })

  const filtered = applications.filter(app =>
    app.applicationNumber.toLowerCase().includes(search.toLowerCase()) ||
    app.companyName.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "DECISION_MAKING").length,
    completed: applications.filter(a => a.status === "CERTIFIED").length,
  }

  const handleRefresh = () => {
    refetch()
    toast.success("Refreshed assignments")
  }

  return (
    <OfficeLayout title="Decision Maker Dashboard">
      <div style={{ padding: "28px 32px", fontFamily: F }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#0f172a" }}>
              Decision Making Queue
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
              Review assigned applications and make certification decisions
            </p>
          </div>
          <button
            onClick={handleRefresh}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: F,
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#475569",
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Assigned", value: stats.total, icon: "📋", color: "#2563eb" },
            { label: "Pending Review", value: stats.pending, icon: "⏳", color: "#f59e0b" },
            { label: "Completed", value: stats.completed, icon: "✅", color: "#16a34a" },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div style={{ fontSize: "2rem" }}>{stat.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                  {stat.label}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "1.8rem", fontWeight: 800, color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ position: "relative", maxWidth: 400 }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by application number or company..."
              style={{
                width: "100%",
                paddingLeft: 40,
                paddingRight: 12,
                paddingTop: 10,
                paddingBottom: 10,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: "0.85rem",
                fontFamily: F,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Loader size={32} style={{ margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Loading assignments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#f8fafc", borderRadius: 12 }}>
            <AlertCircle size={32} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#475569", margin: "0 0 4px" }}>
              {applications.length === 0 ? "No assignments yet" : "No matching applications"}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
              {applications.length === 0 ? "Assignments will appear here when applications are ready for decision" : "Try different search terms"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(app => {
              const statusStyle = getStatusStyle(app.status)
              const daysAgo = Math.floor((Date.now() - new Date(app.assignedAt).getTime()) / (1000 * 60 * 60 * 24))

              return (
                <div
                  key={app.id}
                  onClick={() => navigate(`/office/applications/${app.id}`)}
                  style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "16px 20px",
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns: "1fr 120px 120px 100px 40px",
                    gap: 16,
                    alignItems: "center",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = "#f8fafc"
                    e.currentTarget.style.borderColor = "#2563eb"
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.1)"
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = "#fff"
                    e.currentTarget.style.borderColor = "#e2e8f0"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  {/* Company Info */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: "0 0 6px", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                      {app.companyName}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.75rem", color: "#64748b" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Building2 size={14} />
                        {app.applicationNumber}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={14} />
                        {daysAgo} day{daysAgo !== 1 ? "s" : ""} ago
                      </span>
                    </div>
                  </div>

                  {/* Products */}
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: "0 0 6px", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Products
                    </p>
                    <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
                      {app.products?.length || 0}
                    </p>
                  </div>

                  {/* NCs Status */}
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: "0 0 6px", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      NCs
                    </p>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      {app.ncsCleared ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 12px",
                            background: "#f0fdf4",
                            color: "#166534",
                            borderRadius: 20,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={12} />
                          Cleared
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 12px",
                            background: "#fffbeb",
                            color: "#92400e",
                            borderRadius: 20,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          <Clock size={12} />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        borderRadius: 6,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        border: `1px solid ${statusStyle.dot}33`,
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusStyle.dot }}></span>
                      {app.status}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div style={{ display: "flex", justifyContent: "center", color: "#cbd5e1" }}>
                    <ChevronRight size={20} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </OfficeLayout>
  )
}
