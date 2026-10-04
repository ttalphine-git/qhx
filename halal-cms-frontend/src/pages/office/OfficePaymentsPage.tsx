import { useState, useEffect } from "react"
import { Send, Eye, Download, TrendingUp, AlertCircle, CheckCircle, Clock, Loader } from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import apiClient from "@/api/client"

interface Payment {
  id: number
  requestNumber: string
  companyName: string
  certificateType: "BATCH" | "FACTORY"
  amount: number
  status: "PENDING" | "PAID" | "OVERDUE"
  dueDate: string
  submittedAt: string
  paidAt?: string
  remindersSent: number
}

export default function OfficePaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [showRemindModal, setShowRemindModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [reminderMessage, setReminderMessage] = useState("")

  const [stats, setStats] = useState({
    totalPending: 0,
    totalOverdue: 0,
    totalPendingAmount: 0,
    collectedThisMonth: 0,
    totalCollected: 0,
  })

  useEffect(() => {
    loadPayments()
    loadStats()
  }, [statusFilter, typeFilter, page])

  async function loadPayments() {
    try {
      setLoading(true)
      const data = await apiClient.get("/batch-certificates/admin/requests", { params: { page, size: 20 } }).then(r => r.data)
      const rows = (data.content || []).map((request: any): Payment => ({
        id: request.id,
        requestNumber: request.requestNumber,
        companyName: request.producerName || request.companyId || "-",
        certificateType: "BATCH",
        amount: Number(request.totalFee || request.amountOwed || 0),
        status: request.paymentStatus === "PAID" ? "PAID" : "PENDING",
        dueDate: request.submittedAt || request.createdAt || new Date().toISOString(),
        submittedAt: request.submittedAt || request.createdAt || new Date().toISOString(),
        paidAt: request.paymentStatus === "PAID" ? (request.approvedAt || request.updatedAt) : undefined,
        remindersSent: 0,
      })).filter((payment: Payment) =>
        (!statusFilter || payment.status === statusFilter) &&
        (!typeFilter || payment.certificateType === typeFilter)
      )
      setPayments(rows)
      setTotalElements(data.totalElements || rows.length)
    } catch (err) {
      console.error("Failed to load payments", err)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      const data = await apiClient.get("/batch-certificates/admin/requests", { params: { page: 0, size: 1000 } }).then(r => r.data)
      const rows = data.content || []
      const pending = rows.filter((request: any) => request.paymentStatus !== "PAID")
      const paid = rows.filter((request: any) => request.paymentStatus === "PAID")
      const paidAmount = paid.reduce((sum: number, request: any) => sum + Number(request.totalFee || request.amountOwed || 0), 0)
      setStats({
        totalPending: pending.length,
        totalOverdue: 0,
        totalPendingAmount: pending.reduce((sum: number, request: any) => sum + Number(request.totalFee || request.amountOwed || 0), 0),
        collectedThisMonth: paidAmount,
        totalCollected: paidAmount,
      })
    } catch (err) {
      console.error("Failed to load stats", err)
    }
  }

  async function sendReminder(payment: Payment) {
    if (!reminderMessage.trim()) {
      alert("Please enter a message for the reminder")
      return
    }

    try {
      alert(`Reminder noted for ${payment.requestNumber}. Email reminder delivery is not connected to a backend endpoint yet.`)
      setShowRemindModal(false)
      setReminderMessage("")
    } catch (err) {
      console.error("Failed to send reminder", err)
      alert("Failed to send reminder")
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "PENDING":
        return <Clock className="w-5 h-5 text-orange-500" />
      case "PAID":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "OVERDUE":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "PENDING":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "PAID":
        return "bg-green-50 text-green-700 border-green-200"
      case "OVERDUE":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  function getTypeColor(type: string) {
    return type === "BATCH" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
  }

  const totalPages = Math.ceil(totalElements / 20)

  return (
    <OfficeLayout title="Payments">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Payment Management</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <p className="text-sm text-gray-600">Pending Payments</p>
            <p className="text-3xl font-bold text-orange-600">{stats.totalPending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Overdue</p>
            <p className="text-3xl font-bold text-red-600">{stats.totalOverdue}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <p className="text-sm text-gray-600">Pending Amount</p>
            <p className="text-2xl font-bold text-purple-600">RM {stats.totalPendingAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-teal-500">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-2xl font-bold text-teal-600">RM {stats.collectedThisMonth.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Total Collected</p>
            <p className="text-2xl font-bold text-green-600">RM {stats.totalCollected.toFixed(2)}</p>
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
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select
              value={typeFilter}
              onChange={e => {
                setTypeFilter(e.target.value)
                setPage(0)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="BATCH">Batch Certificate</option>
              <option value="FACTORY">Factory Certificate</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No payments found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Request #</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Company</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Reminders</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <span className="font-semibold">{payment.requestNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm">{payment.companyName}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(payment.certificateType)}`}>
                        {payment.certificateType}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-semibold">RM {payment.amount.toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="text-sm font-medium text-gray-600">{payment.remindersSent}</span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment)
                          setShowRemindModal(true)
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Send className="w-4 h-4" />
                        Remind
                      </button>
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

        {/* Reminder Modal */}
        {showRemindModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Send Payment Reminder</h2>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Request:</strong> {selectedPayment.requestNumber}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Amount:</strong> RM {selectedPayment.amount.toFixed(2)}
                </p>
              </div>
              <textarea
                value={reminderMessage}
                onChange={e => setReminderMessage(e.target.value)}
                placeholder="Enter your reminder message..."
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRemindModal(false)
                    setReminderMessage("")
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => sendReminder(selectedPayment)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Reminder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OfficeLayout>
  )
}
