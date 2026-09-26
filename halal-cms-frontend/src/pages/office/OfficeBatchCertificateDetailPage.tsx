import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Loader, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import OfficeLayout from "./OfficeLayout"

interface BatchRequestDetail {
  id: number
  requestNumber: string
  certificateNumber?: string
  status: string
  factoryCertNumber: string
  producerName: string
  producerPhone: string
  producerEmail: string
  producerContact: string
  importerName?: string
  importerCountry?: string
  importerContact?: string
  exporterName?: string
  exporterCountry?: string
  exporterContact?: string
  shipmentDate: string
  shipmentReference?: string
  originCountry: string
  destinationCountry: string
  products: Array<any>
  totalWeightKg: number
  unitPricePerKg: number
  totalFee: number
  currency: string
  paymentStatus: string
  amountOwed: number
  adminNotes?: string
  approvedAt?: string
  approvedBy?: string
  rejectionReason?: string
  rejectedAt?: string
  rejectedBy?: string
  submittedAt: string
}

export default function OfficeBatchCertificateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [request, setRequest] = useState<BatchRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false)
  const [showRejectionConfirm, setShowRejectionConfirm] = useState(false)

  useEffect(() => {
    loadRequest()
  }, [id])

  async function loadRequest() {
    try {
      setLoading(true)
      const resp = await fetch(`/api/batch-certificates/requests/${id}`)
      if (resp.ok) {
        const data = await resp.json()
        setRequest(data)
      } else {
        setError("Failed to load batch certificate request")
      }
    } catch (err) {
      console.error("Failed to load request", err)
      setError("An error occurred while loading the request")
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (!request) return

    try {
      setApproving(true)
      const resp = await fetch(`/api/batch-certificates/admin/requests/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: approvalNotes }),
      })

      if (resp.ok) {
        const updatedRequest = await resp.json()
        setRequest(updatedRequest)
        setShowApprovalConfirm(false)
        setApprovalNotes("")
      } else {
        const errorData = await resp.json()
        setError(errorData.message || "Failed to approve request")
      }
    } catch (err) {
      console.error("Failed to approve request", err)
      setError("An error occurred while approving")
    } finally {
      setApproving(false)
    }
  }

  async function handleReject() {
    if (!request || !rejectionReason.trim()) {
      setError("Rejection reason is required")
      return
    }

    try {
      setRejecting(true)
      const resp = await fetch(`/api/batch-certificates/admin/requests/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      })

      if (resp.ok) {
        const updatedRequest = await resp.json()
        setRequest(updatedRequest)
        setShowRejectionConfirm(false)
        setRejectionReason("")
      } else {
        const errorData = await resp.json()
        setError(errorData.message || "Failed to reject request")
      }
    } catch (err) {
      console.error("Failed to reject request", err)
      setError("An error occurred while rejecting")
    } finally {
      setRejecting(false)
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

  if (loading) {
    return (
      <OfficeLayout title="Batch Certificate Detail">
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </OfficeLayout>
    )
  }

  if (error || !request) {
    return (
      <OfficeLayout title="Batch Certificate Detail">
        <div className="max-w-6xl mx-auto p-6">
          <button
            onClick={() => navigate("/office/batch-certificates")}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </OfficeLayout>
    )
  }

  return (
    <OfficeLayout title="Batch Certificate Detail">
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={() => navigate("/office/batch-certificates")}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Batch Certificates
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{request.requestNumber}</h1>
              <p className="text-gray-600">
                Submitted: {new Date(request.submittedAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-lg border font-medium ${getStatusColor(request.status)}`}>
              {request.status}
            </span>
          </div>

          {request.status === "APPROVED" && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-700">Approved</p>
                <p className="text-sm text-green-700">
                  Certificate: {request.certificateNumber}
                </p>
                <p className="text-sm text-green-700">
                  Approved by {request.approvedBy} on{" "}
                  {new Date(request.approvedAt!).toLocaleDateString()}
                </p>
                {request.adminNotes && (
                  <p className="text-sm text-green-700 mt-2">Notes: {request.adminNotes}</p>
                )}
              </div>
            </div>
          )}

          {request.status === "REJECTED" && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700">Rejected</p>
                <p className="text-sm text-red-700">Reason: {request.rejectionReason}</p>
                <p className="text-sm text-red-700">
                  Rejected by {request.rejectedBy} on{" "}
                  {new Date(request.rejectedAt!).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Request Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Producer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Producer Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">{request.producerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{request.producerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold">{request.producerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact Person</p>
                <p className="font-semibold">{request.producerContact}</p>
              </div>
            </div>
          </div>

          {/* Factory Certificate */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Factory Certificate</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Certificate Number</p>
                <p className="font-semibold">{request.factoryCertNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold text-green-600">ACTIVE</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Shipment Details</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Shipment Date</p>
              <p className="font-semibold">{request.shipmentDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Origin</p>
              <p className="font-semibold">{request.originCountry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Destination</p>
              <p className="font-semibold">{request.destinationCountry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reference</p>
              <p className="font-semibold">{request.shipmentReference || "-"}</p>
            </div>
          </div>
        </div>

        {/* Fee Summary */}
        <div className="bg-blue-50 rounded-lg shadow p-6 mb-6 border border-blue-200">
          <h2 className="text-lg font-semibold mb-4 text-blue-900">Fee Summary</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-blue-700">Total Weight</p>
              <p className="text-2xl font-bold text-blue-900">{request.totalWeightKg.toFixed(2)} kg</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Unit Price</p>
              <p className="text-2xl font-bold text-blue-900">
                {request.currency} {request.unitPricePerKg.toFixed(2)}/kg
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Fee</p>
              <p className="text-2xl font-bold text-blue-900">
                {request.currency} {request.totalFee.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Payment Status</p>
              <p className={`text-lg font-semibold ${request.paymentStatus === "PENDING" ? "text-orange-600" : "text-green-600"}`}>
                {request.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Approval/Rejection Form - Only show if PENDING */}
        {request.status === "PENDING" && (
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <h2 className="text-lg font-semibold mb-4">Approval Workflow</h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Approve */}
              <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                <h3 className="font-semibold text-green-900 mb-3">Approve Request</h3>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={e => setApprovalNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Add any notes for the customer..."
                  />
                </div>
                <button
                  onClick={() => setShowApprovalConfirm(true)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Approve Request
                </button>
              </div>

              {/* Reject */}
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h3 className="font-semibold text-red-900 mb-3">Reject Request</h3>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Provide detailed reason for rejection..."
                  />
                </div>
                <button
                  onClick={() => setShowRejectionConfirm(true)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approval Confirmation Modal */}
        {showApprovalConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Confirm Approval</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to approve this batch certificate request?
              </p>
              <p className="text-sm text-gray-600 mb-6">
                This will generate a certificate number, create a PDF, and send an email to the customer.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowApprovalConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400"
                >
                  {approving ? "Processing..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Confirmation Modal */}
        {showRejectionConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Confirm Rejection</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to reject this batch certificate request?
              </p>
              <p className="text-sm text-gray-600 mb-6">
                This will send a rejection email to the customer with the reason provided.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowRejectionConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejecting || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400"
                >
                  {rejecting ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OfficeLayout>
  )
}
