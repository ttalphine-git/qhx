import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus, Eye, AlertCircle, CheckCircle, XCircle, Clock, Loader
} from "lucide-react"
import CustomerLayout from "./CustomerLayout"
import { useAuthStore } from "@/store/authStore"

interface BatchRequest {
  id: number
  requestNumber: string
  status: string
  factoryCertNumber: string
  totalWeightKg: number
  totalFee: number
  amountOwed: number
  paymentStatus: string
  submittedAt: string
  approvedAt?: string
}

export default function CustomerBatchCertificatesPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending")
  const [requests, setRequests] = useState<BatchRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingApproval: 0,
    approved: 0,
    amountOwed: 0,
  })

  useEffect(() => {
    loadRequests()
    loadStats()
  }, [activeTab, page])

  async function loadRequests() {
    try {
      setLoading(true)
      const statusMap = {
        pending: "PENDING",
        approved: "APPROVED",
        rejected: "REJECTED",
      }

      const resp = await fetch(
        `/batch-certificates/requests?status=${statusMap[activeTab]}&page=${page}&size=20`
      )

      if (resp.ok) {
        const data = await resp.json()
        setRequests(data.content || [])
        setTotalElements(data.totalElements || 0)
      }
    } catch (err) {
      console.error("Failed to load requests", err)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      const resp = await fetch("/batch-certificates/requests?page=0&size=1000")
      if (resp.ok) {
        const data = await resp.json()
        const allRequests = data.content || []

        setStats({
          totalRequests: allRequests.length,
          pendingApproval: allRequests.filter((r: any) => r.status === "PENDING").length,
          approved: allRequests.filter((r: any) => r.status === "APPROVED").length,
          amountOwed: allRequests
            .filter((r: any) => r.paymentStatus === "PENDING")
            .reduce((sum: number, r: any) => sum + (r.amountOwed || 0), 0),
        })
      }
    } catch (err) {
      console.error("Failed to load stats", err)
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "PENDING":
        return <Clock className="w-5 h-5 text-orange-500" />
      case "APPROVED":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "PENDING":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "APPROVED":
        return "bg-green-50 text-green-700 border-green-200"
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const totalPages = Math.ceil(totalElements / 20)

  return (
    <CustomerLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Batch Certificates</h1>
          <button
            onClick={() => navigate("/customer/batch-certificates/new")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Requests</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRequests}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Pending Approval</p>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingApproval}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Amount Owed</p>
            <p className="text-3xl font-bold text-red-600">RM {stats.amountOwed.toFixed(2)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          {(["pending", "approved", "rejected"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setPage(0)
              }}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No batch certificate requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div
                key={req.id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border-l-4 border-blue-600"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(req.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{req.requestNumber}</h3>
                      <p className="text-sm text-gray-600">
                        Cert: {req.factoryCertNumber}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">Total Weight</p>
                    <p className="font-semibold">{req.totalWeightKg.toFixed(2)} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Fee</p>
                    <p className="font-semibold">RM {req.totalFee.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Payment</p>
                    <p className={`font-semibold ${req.paymentStatus === "PENDING" ? "text-orange-600" : "text-green-600"}`}>
                      {req.paymentStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Amount Owed</p>
                    <p className="font-semibold text-red-600">RM {req.amountOwed.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    {req.submittedAt
                      ? new Date(req.submittedAt).toLocaleDateString()
                      : "Not submitted"}
                  </span>
                  <button
                    onClick={() => navigate(`/customer/batch-certificates/${req.id}`)}
                    className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`px-3 py-2 rounded-lg ${
                  page === i
                    ? "bg-blue-600 text-white"
                    : "border hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
