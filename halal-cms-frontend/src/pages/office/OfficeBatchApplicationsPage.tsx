import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, ChevronLeft, ChevronRight, Eye, Loader } from "lucide-react"
import { useNavigate } from "react-router-dom"
import OfficeLayout from "./OfficeLayout"
import { formatDate } from "@/lib/utils"

interface BatchApplication {
  id: number
  requestNumber: string
  status: string
  companyName: string
  submittedAt?: string
}

export default function OfficeBatchApplicationsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("Active")

  const { data, isLoading } = useQuery({
    queryKey: ["office-batch-applications", page, search, activeTab],
    queryFn: async () => {
      // Placeholder - replace with actual API call
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
      }
    },
  })

  const applications = data?.content || []
  const totalElements = data?.totalElements || 0
  const totalPages = Math.ceil(totalElements / 20)

  const tabs = ["Active", "Certified", "Draft", "Rejected"]

  function getStatusStyle(status: string): string {
    const styles: Record<string, string> = {
      "PENDING": "bg-amber-50 text-amber-700 border-amber-200",
      "APPROVED": "bg-green-50 text-green-700 border-green-200",
      "REJECTED": "bg-red-50 text-red-700 border-red-200",
    }
    return styles[status] || "bg-gray-50 text-gray-700 border-gray-200"
  }

  return (
    <OfficeLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Batch Applications</h1>
            <p className="text-gray-600">{totalElements} applications total</p>
          </div>

          {/* Stat Cards */}
          <div className="flex gap-3">
            <div className="bg-blue-600 text-white rounded-lg p-4 min-w-fit">
              <p className="text-xs font-semibold mb-1">Total</p>
              <p className="text-2xl font-bold">{totalElements}</p>
            </div>
            <div className="bg-blue-500 text-white rounded-lg p-4 min-w-fit">
              <p className="text-xs font-semibold mb-1">Active</p>
              <p className="text-2xl font-bold">1</p>
            </div>
            <div className="bg-green-600 text-white rounded-lg p-4 min-w-fit">
              <p className="text-xs font-semibold mb-1">Certified</p>
              <p className="text-2xl font-bold">1</p>
            </div>
            <div className="bg-gray-600 text-white rounded-lg p-4 min-w-fit">
              <p className="text-xs font-semibold mb-1">Draft</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setPage(0)
                }}
                className={`pb-3 font-medium text-sm transition border-b-2 ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company or app number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Batch Applications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No batch applications found</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Request #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app: BatchApplication) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">{app.requestNumber}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{app.companyName}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(app.status)}`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {app.submittedAt ? formatDate(app.submittedAt) : "Not submitted"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {app.submittedAt ? formatDate(app.submittedAt) : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => navigate(`/office/batch-applications/${app.id}`)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <span className="text-sm text-gray-600">
                    Page {page + 1} of {totalPages}
                  </span>

                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page === totalPages - 1}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </OfficeLayout>
  )
}
