import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, Trash2, AlertCircle, Check, Loader } from "lucide-react"
import CustomerLayout from "./CustomerLayout"
import { useAuthStore } from "@/store/authStore"
import { getMyCompany } from "@/api/companies"
import { getFactories, type Factory } from "@/api/factories"
import { getCertificates, type CertificateDto } from "@/api/certificates"

interface Product {
  sku: string
  name: string
  weightKg: number
  unit: string
}

interface FormData {
  factoryId: string
  factoryCertificateId: number | null
  producerName: string
  producerPhone: string
  producerEmail: string
  producerContact: string
  importerName: string
  importerCountry: string
  importerContact: string
  exporterName: string
  exporterCountry: string
  exporterContact: string
  shipmentDate: string
  shipmentReference: string
  originCountry: string
  destinationCountry: string
  products: Product[]
  totalWeightKg: number
}

const COUNTRIES = [
  "Malaysia", "Indonesia", "Singapore", "Brunei", "Thailand", "Philippines",
  "Vietnam", "Myanmar", "Cambodia", "Bangladesh", "India", "Sri Lanka",
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain",
  "Oman", "Jordan", "Egypt", "Turkey", "Pakistan", "United Kingdom",
  "France", "Germany", "Netherlands", "Belgium", "Spain", "Italy",
  "United States", "Canada", "Australia", "China", "Japan", "South Korea",
  "Nigeria", "South Africa", "Kenya", "Others",
]

const DEFAULT_FORM: FormData = {
  factoryId: "",
  factoryCertificateId: null,
  producerName: "",
  producerPhone: "",
  producerEmail: "",
  producerContact: "",
  importerName: "",
  importerCountry: "",
  importerContact: "",
  exporterName: "",
  exporterCountry: "",
  exporterContact: "",
  shipmentDate: "",
  shipmentReference: "",
  originCountry: "",
  destinationCountry: "",
  products: [{ sku: "", name: "", weightKg: 0, unit: "kg" }],
  totalWeightKg: 0,
}

export default function CustomerBatchCertificateFormPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [factories, setFactories] = useState<Factory[]>([])
  const [certificates, setCertificates] = useState<CertificateDto[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [unitPrice, setUnitPrice] = useState<number>(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const company = await getMyCompany()
      const factoriesData = await getFactories(company.id)
      const certData = await getCertificates()

      setFactories(factoriesData.content)
      setCertificates((certData as any).content || [])

      // Fetch batch settings for unit price
      const settingsResp = await fetch("/api/batch-certificates/settings")
      if (settingsResp.ok) {
        const settings = await settingsResp.json()
        setUnitPrice(parseFloat(settings.unitPricePerKg))
      }
    } catch (err) {
      console.error("Failed to load data", err)
      setError("Failed to load factories and certificates")
    } finally {
      setLoading(false)
    }
  }

  function getFactoryCertificates(factoryId: string) {
    return certificates.filter(
      c => c.status === "ACTIVE" && c.applicationId > 0 // Factory certificates
    )
  }

  function handleFactoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const factoryId = e.target.value
    setForm(prev => ({
      ...prev,
      factoryId,
      factoryCertificateId: null,
    }))
  }

  function handleCertificateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const certId = parseInt(e.target.value)
    setForm(prev => ({
      ...prev,
      factoryCertificateId: certId,
    }))
  }

  function handleProductChange(
    index: number,
    field: keyof Product,
    value: string | number
  ) {
    setForm(prev => {
      const products = [...prev.products]
      products[index] = { ...products[index], [field]: value }

      const totalWeight = products.reduce((sum, p) => sum + (p.weightKg || 0), 0)

      return {
        ...prev,
        products,
        totalWeightKg: parseFloat(totalWeight.toFixed(2)),
      }
    })
  }

  function addProduct() {
    setForm(prev => ({
      ...prev,
      products: [...prev.products, { sku: "", name: "", weightKg: 0, unit: "kg" }],
    }))
  }

  function removeProduct(index: number) {
    setForm(prev => {
      const products = prev.products.filter((_, i) => i !== index)
      const totalWeight = products.reduce((sum, p) => sum + (p.weightKg || 0), 0)

      return {
        ...prev,
        products,
        totalWeightKg: parseFloat(totalWeight.toFixed(2)),
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!form.factoryId) {
      setError("Please select a factory")
      return
    }

    if (!form.factoryCertificateId) {
      setError("Please select a factory certificate")
      return
    }

    if (!form.producerName) {
      setError("Producer name is required")
      return
    }

    if (form.products.length === 0 || form.totalWeightKg === 0) {
      setError("Please add at least one product with weight")
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        factoryId: form.factoryId,
        factoryCertificateId: form.factoryCertificateId,
        producerName: form.producerName,
        producerPhone: form.producerPhone,
        producerEmail: form.producerEmail,
        producerContact: form.producerContact,
        importerName: form.importerName || null,
        importerCountry: form.importerCountry || null,
        importerContact: form.importerContact || null,
        exporterName: form.exporterName || null,
        exporterCountry: form.exporterCountry || null,
        exporterContact: form.exporterContact || null,
        shipmentDate: form.shipmentDate,
        shipmentReference: form.shipmentReference || null,
        originCountry: form.originCountry,
        destinationCountry: form.destinationCountry,
        products: form.products,
        totalWeightKg: form.totalWeightKg,
      }

      const resp = await fetch("/api/batch-certificates/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!resp.ok) {
        const errorData = await resp.json()
        throw new Error(errorData.message || "Failed to submit batch certificate request")
      }

      const result = await resp.json()
      setSuccess(true)

      setTimeout(() => {
        navigate(`/customer/batch-certificates/${result.id}`)
      }, 2000)
    } catch (err) {
      console.error("Submission error", err)
      setError((err as Error).message || "Failed to submit request")
    } finally {
      setSubmitting(false)
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

  const totalFee = (form.totalWeightKg * unitPrice).toFixed(2)
  const selectedFactory = factories.find(f => f.id === form.factoryId)
  const factoryCerts = getFactoryCertificates(form.factoryId)

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/customer/batch-certificates")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold">Request Batch Certificate</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700">Batch certificate request submitted successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Factory Selection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Factory Selection</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Factory <span className="text-red-600">*</span>
                </label>
                <select
                  value={form.factoryId}
                  onChange={handleFactoryChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a factory</option>
                  {factories.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {form.factoryId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Active Certificate <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={form.factoryCertificateId || ""}
                    onChange={handleCertificateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a certificate</option>
                    {factoryCerts.length > 0 ? (
                      factoryCerts.map(cert => (
                        <option key={cert.id} value={cert.id}>
                          {cert.certificateNumber} (Exp: {cert.expiryDate})
                        </option>
                      ))
                    ) : (
                      <option disabled>No active certificates available</option>
                    )}
                  </select>
                  {factoryCerts.length === 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      This factory has no active certificates. Please obtain a factory certificate first.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Producer Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Producer Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Producer Name *"
                value={form.producerName}
                onChange={e => setForm(prev => ({ ...prev, producerName: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                value={form.producerPhone}
                onChange={e => setForm(prev => ({ ...prev, producerPhone: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.producerEmail}
                onChange={e => setForm(prev => ({ ...prev, producerEmail: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Contact Person"
                value={form.producerContact}
                onChange={e => setForm(prev => ({ ...prev, producerContact: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Importer Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Importer Information (Optional)</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Importer Name"
                value={form.importerName}
                onChange={e => setForm(prev => ({ ...prev, importerName: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={form.importerCountry}
                onChange={e => setForm(prev => ({ ...prev, importerCountry: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Importer Country</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Contact Information"
                value={form.importerContact}
                onChange={e => setForm(prev => ({ ...prev, importerContact: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Exporter Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Exporter Information (Optional)</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Exporter Name"
                value={form.exporterName}
                onChange={e => setForm(prev => ({ ...prev, exporterName: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={form.exporterCountry}
                onChange={e => setForm(prev => ({ ...prev, exporterCountry: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Exporter Country</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Contact Information"
                value={form.exporterContact}
                onChange={e => setForm(prev => ({ ...prev, exporterContact: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Shipment Details */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Shipment Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipment Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={form.shipmentDate}
                  onChange={e => setForm(prev => ({ ...prev, shipmentDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Shipment Reference"
                value={form.shipmentReference}
                onChange={e => setForm(prev => ({ ...prev, shipmentReference: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={form.originCountry}
                onChange={e => setForm(prev => ({ ...prev, originCountry: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Origin Country *</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={form.destinationCountry}
                onChange={e => setForm(prev => ({ ...prev, destinationCountry: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Destination Country *</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Products</h2>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            <div className="space-y-3">
              {form.products.map((product, idx) => (
                <div key={idx} className="flex gap-3 items-end">
                  <input
                    type="text"
                    placeholder="SKU"
                    value={product.sku}
                    onChange={e => handleProductChange(idx, "sku", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={product.name}
                    onChange={e => handleProductChange(idx, "name", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Weight (kg)"
                    value={product.weightKg || ""}
                    onChange={e => handleProductChange(idx, "weightKg", parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                    step="0.01"
                  />
                  <select
                    value={product.unit}
                    onChange={e => handleProductChange(idx, "unit", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="kg">kg</option>
                    <option value="tonnes">tonnes</option>
                    <option value="litres">litres</option>
                  </select>
                  {form.products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProduct(idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fee Summary */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold mb-4 text-blue-900">Fee Summary</h2>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-blue-700">Total Weight</p>
                <p className="text-2xl font-bold text-blue-900">{form.totalWeightKg.toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Unit Price</p>
                <p className="text-2xl font-bold text-blue-900">RM {unitPrice.toFixed(2)}/kg</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Fee</p>
                <p className="text-2xl font-bold text-blue-900">RM {totalFee}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Payment Status</p>
                <p className="text-xl font-semibold text-orange-600">Pending</p>
              </div>
            </div>
            <p className="text-sm text-blue-700 mt-4">
              You will not be charged immediately. Payment will be due after approval.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/customer/batch-certificates")}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </CustomerLayout>
  )
}
