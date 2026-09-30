import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Loader } from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import { createApplication } from "@/api/applications"
import { addNotification } from "@/lib/notifications"

export default function OfficeApplicationFormPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: "",
    registrationNumber: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    website: "",
    industry: "",
    companyType: "",
    businessLicenseNo: "",
    licenseExpiry: "",
    issuingAuthority: "",
    vatSstNo: "",
    halalStandard: "",
    products: "",
    status: "DRAFT",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.companyName || !formData.email || !formData.phone || !formData.country) {
      addNotification("office", {
        type: "error",
        title: "Missing Fields",
        body: "Please fill in all required fields (Company Name, Email, Phone, Country)",
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        companyName: formData.companyName,
        registrationNumber: formData.registrationNumber,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        selectedMarkets: formData.country ? [formData.country] : [],
        website: formData.website,
        industry: formData.industry,
        companyType: formData.companyType,
        businessLicenseNo: formData.businessLicenseNo,
        licenseExpiry: formData.licenseExpiry,
        issuingAuthority: formData.issuingAuthority,
        vatSstNo: formData.vatSstNo,
        selectedStandards: formData.halalStandard ? [formData.halalStandard] : [],
        products: formData.products ? formData.products.split(",").map(p => p.trim()).filter(p => p) : [],
        status: formData.status,
      }

      const result = await createApplication(payload)
      addNotification("office", {
        type: "success",
        title: "Application Created",
        body: `New application ${result.applicationNumber} created successfully`,
      })
      navigate(`/office/applications/${result.id}`)
    } catch (error) {
      addNotification("office", {
        type: "error",
        title: "Failed",
        body: "Could not create application. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <OfficeLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/office/applications-list")}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Application</h1>
            <p className="text-gray-600">Submit a new application on behalf of a customer</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow p-8 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information Section */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Registration Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="Enter registration number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter street address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Enter country"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select industry</option>
                    <option value="Food & Beverages">Food & Beverages</option>
                    <option value="Cosmetics & Personal Care">Cosmetics & Personal Care</option>
                    <option value="Pharmaceuticals">Pharmaceuticals</option>
                    <option value="Logistics & Warehousing">Logistics & Warehousing</option>
                    <option value="Restaurant & F&B">Restaurant & F&B</option>
                    <option value="Manufacturing">Manufacturing</option>
                  </select>
                </div>

                {/* Company Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Type
                  </label>
                  <input
                    type="text"
                    name="companyType"
                    value={formData.companyType}
                    onChange={handleChange}
                    placeholder="e.g., Manufacturer, Importer, Distributor"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Business License */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business License #
                  </label>
                  <input
                    type="text"
                    name="businessLicenseNo"
                    value={formData.businessLicenseNo}
                    onChange={handleChange}
                    placeholder="Enter license number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* License Expiry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    name="licenseExpiry"
                    value={formData.licenseExpiry}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Issuing Authority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issuing Authority
                  </label>
                  <input
                    type="text"
                    name="issuingAuthority"
                    value={formData.issuingAuthority}
                    onChange={handleChange}
                    placeholder="Enter issuing authority"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* VAT/SST Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VAT/SST Number
                  </label>
                  <input
                    type="text"
                    name="vatSstNo"
                    value={formData.vatSstNo}
                    onChange={handleChange}
                    placeholder="Enter VAT or SST number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Application Details Section */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Halal Standard */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Halal Standard
                  </label>
                  <select
                    name="halalStandard"
                    value={formData.halalStandard}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select standard</option>
                    <option value="MS1500">MS1500 (Malaysia)</option>
                    <option value="JAKIM">JAKIM (Malaysia)</option>
                    <option value="HAS">HAS (SMIIC)</option>
                    <option value="OIC">OIC/ISO</option>
                  </select>
                </div>

                {/* Products */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Products (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="products"
                    value={formData.products}
                    onChange={handleChange}
                    placeholder="e.g., Meat, Dairy, Cosmetics"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SUBMITTED">Submitted</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/office/applications-list")}
                className="flex-1 px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {loading ? "Creating..." : "Create Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </OfficeLayout>
  )
}
