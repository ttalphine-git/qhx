import { useState, useEffect } from "react"
import { Eye, CheckCircle, XCircle, Clock, AlertCircle, Download, Loader } from "lucide-react"
import CustomerLayout from "./CustomerLayout"
import { useAuthStore } from "@/store/authStore"

interface BatchRequest {
  id: number
  requestNumber: string
  certificateNumber?: string
  status: string
  totalWeightKg: number
  totalFee: number
  paymentStatus: string
  submittedAt: string
  approvedAt?: string
  pdfUrl?: string
}

export default function CustomerBatchCertificatesPaymentPage() {
  const user = useAuthStore(s => s.user)

  const [requests, setRequests] = useState<BatchRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("")
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingApproval: 0,
    approvedRequests: 0,
    totalFeesPending: 0,
    totalFeesCollected: 0,
  })

  useEffect(() => {
    loadRequests()
    loadStats()
  }, [statusFilter, paymentStatusFilter, page])

  async function loadRequests() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append("status", statusFilter)
      if (paymentStatusFilter) params.append("paymentStatus", paymentStatusFilter)
      params.append("page", page.toString())
      params.append("size", "20")

      const resp = await fetch(`/batch-certificates/my-requests?${params.toString()}`)
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
      const resp = await fetch("/batch-certificates/my-requests/stats")
      if (resp.ok) {
        const data = await resp.json()
        setStats(data)
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

  function getPaymentStatusColor(status: string) {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "PAID":
        return "bg-green-50 text-green-700 border-green-200"
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const totalPages = Math.ceil(totalElements / 20)

  return (
    <CustomerLayout title="Batch Certificates & Payments">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">My Batch Certificates</h1>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalRequests}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingApproval}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600">{stats.approvedRequests}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
              <p className="text-sm text-gray-600">Pending Payment</p>
              <p className="text-2xl font-bold text-red-600">RM {stats.totalFeesPending.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-teal-500">
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-teal-600">RM {stats.totalFeesCollected.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value)
                setPage(0)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Payment</label>
            <select
              value={paymentStatusFilter}
              onChange={e => {
                setPaymentStatusFilter(e.target.value)
                setPage(0)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Payment Statuses</option>
              <option value="PENDING">Pending Payment</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No batch certificate requests found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Request #</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Weight</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fee</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Payment</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Submitted</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(req.status)}
                        <span className="font-semibold">{req.requestNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">{req.totalWeightKg.toFixed(2)} kg</td>
                    <td className="px-6 py-3 font-semibold">RM {req.totalFee.toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(req.paymentStatus)}`}>
                        {req.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(req.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {}}
                          className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        {req.pdfUrl && (
                          <a
                            href={req.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Download className="w-4 h-4" />
                            PDF
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = Math.max(0, Math.min(page - 2 + i, totalPages - 1))
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-2 rounded-lg ${
                    page === pageNum
                      ? "bg-blue-600 text-white"
                      : "border hover:bg-gray-50"
                  }`}
                >
                  {pageNum + 1}
                </button>
              )
            })}
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
