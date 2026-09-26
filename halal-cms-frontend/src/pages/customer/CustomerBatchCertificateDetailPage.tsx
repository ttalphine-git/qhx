import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Loader, AlertCircle, CheckCircle, Copy } from "lucide-react"
import CustomerLayout from "./CustomerLayout"

interface BatchRequestDetail {
  id: number
  requestNumber: string
  status: string
  factoryCertNumber: string
  factoryCertValidFrom: string
  factoryCertValidTo: string
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
  products: Array<{ sku: string; name: string; weightKg: number; unit: string }>
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
  createdAt: string
}

export default function CustomerBatchCertificateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [request, setRequest] = useState<BatchRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </CustomerLayout>
    )
  }

  if (error || !request) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto p-6">
          <button
            onClick={() => navigate("/customer/batch-certificates")}
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
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate("/customer/batch-certificates")}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Batch Certificates
        </button>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{request.requestNumber}</h1>
              <p className="text-gray-600">
                Submitted: {new Date(request.submittedAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-lg border font-medium ${getStatusColor(request.status)}`}>
              {request.status}
            </span>
          </div>

          {request.status === "APPROVED" && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-700">Request Approved</p>
                <p className="text-sm text-green-700">
                  Approved on {new Date(request.approvedAt!).toLocaleDateString()} by {request.approvedBy}
                </p>
                {request.adminNotes && (
                  <p className="text-sm text-green-700 mt-2">Admin Notes: {request.adminNotes}</p>
                )}
              </div>
            </div>
          )}

          {request.status === "REJECTED" && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700">Request Rejected</p>
                <p className="text-sm text-red-700">
                  Reason: {request.rejectionReason}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Rejected on {new Date(request.rejectedAt!).toLocaleDateString()} by {request.rejectedBy}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Factory Certificate Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Factory Certificate</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Certificate Number</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-semibold">{request.factoryCertNumber}</p>
                <button
                  onClick={() => copyToClipboard(request.factoryCertNumber)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valid From</p>
              <p className="font-semibold mt-1">{request.factoryCertValidFrom}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valid Until</p>
              <p className="font-semibold mt-1">{request.factoryCertValidTo}</p>
            </div>
          </div>
        </div>

        {/* Producer Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Producer Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Producer Name</p>
              <p className="font-semibold mt-1">{request.producerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-semibold mt-1">{request.producerPhone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold mt-1">{request.producerEmail || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Person</p>
              <p className="font-semibold mt-1">{request.producerContact || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Importer Information */}
        {request.importerName && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Importer Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Importer Name</p>
                <p className="font-semibold mt-1">{request.importerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Country</p>
                <p className="font-semibold mt-1">{request.importerCountry}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="font-semibold mt-1">{request.importerContact}</p>
              </div>
            </div>
          </div>
        )}

        {/* Exporter Information */}
        {request.exporterName && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Exporter Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Exporter Name</p>
                <p className="font-semibold mt-1">{request.exporterName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Country</p>
                <p className="font-semibold mt-1">{request.exporterCountry}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="font-semibold mt-1">{request.exporterContact}</p>
              </div>
            </div>
          </div>
        )}

        {/* Shipment Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Shipment Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Shipment Date</p>
              <p className="font-semibold mt-1">{request.shipmentDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Shipment Reference</p>
              <p className="font-semibold mt-1">{request.shipmentReference || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Origin Country</p>
              <p className="font-semibold mt-1">{request.originCountry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Destination Country</p>
              <p className="font-semibold mt-1">{request.destinationCountry}</p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold">SKU</th>
                  <th className="text-left py-2 px-3 font-semibold">Product Name</th>
                  <th className="text-right py-2 px-3 font-semibold">Weight (kg)</th>
                  <th className="text-left py-2 px-3 font-semibold">Unit</th>
                </tr>
              </thead>
              <tbody>
                {request.products.map((product, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{product.sku}</td>
                    <td className="py-2 px-3">{product.name}</td>
                    <td className="py-2 px-3 text-right">{product.weightKg.toFixed(2)}</td>
                    <td className="py-2 px-3">{product.unit}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={2} className="py-2 px-3">Total Weight</td>
                  <td className="py-2 px-3 text-right">{request.totalWeightKg.toFixed(2)} kg</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Fee Summary */}
        <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Fee Summary</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-blue-700">Total Weight</p>
              <p className="text-2xl font-bold text-blue-900">{request.totalWeightKg.toFixed(2)} kg</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Unit Price</p>
              <p className="text-2xl font-bold text-blue-900">{request.currency} {request.unitPricePerKg.toFixed(2)}/kg</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Fee</p>
              <p className="text-2xl font-bold text-blue-900">{request.currency} {request.totalFee.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Payment Status</p>
              <p className={`text-lg font-semibold ${request.paymentStatus === "PENDING" ? "text-orange-600" : "text-green-600"}`}>
                {request.paymentStatus}
              </p>
            </div>
          </div>
          {request.paymentStatus === "PENDING" && (
            <p className="text-sm text-blue-700 mt-4">
              Amount owed: <span className="font-semibold">{request.currency} {request.amountOwed.toFixed(2)}</span>
            </p>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}
