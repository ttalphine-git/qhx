import { useState, useEffect } from "react"
import { TrendingUp, DollarSign, AlertCircle, Loader, Calendar } from "lucide-react"
import CustomerLayout from "./CustomerLayout"

interface PaymentMetrics {
  totalBatchSpent: number
  totalFactorySpent: number
  totalBatchPaid: number
  totalFactoryPaid: number
  totalBatchPending: number
  totalFactoryPending: number
  batchCertificates: number
  factoryCertificates: number
  paymentRateBatch: number
  paymentRateFactory: number
}

interface ChartData {
  month: string
  batchSpent: number
  batchPaid: number
  factorySpent: number
  factoryPaid: number
}

export default function CustomerPaymentsDashboardPage() {
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("6months")

  useEffect(() => {
    loadMetrics()
    loadChartData()
  }, [timeRange])

  async function loadMetrics() {
    try {
      const resp = await fetch(`/payments/my-dashboard/metrics?range=${timeRange}`)
      if (resp.ok) {
        const data = await resp.json()
        setMetrics(data)
      }
    } catch (err) {
      console.error("Failed to load metrics", err)
    }
  }

  async function loadChartData() {
    try {
      setLoading(true)
      const resp = await fetch(`/payments/my-dashboard/chart-data?range=${timeRange}`)
      if (resp.ok) {
        const data = await resp.json()
        setChartData(data)
      }
    } catch (err) {
      console.error("Failed to load chart data", err)
    } finally {
      setLoading(false)
    }
  }

  if (!metrics)
    return (
      <CustomerLayout title="Payment Dashboard">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </CustomerLayout>
    )

  return (
    <CustomerLayout title="Payment Dashboard">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Payment Dashboard</h1>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow">
            <p className="text-sm text-blue-600 font-medium">Batch Certificates</p>
            <p className="text-3xl font-bold text-blue-900">{metrics.batchCertificates}</p>
            <p className="text-xs text-blue-600 mt-2">RM {metrics.totalBatchSpent.toFixed(2)} total</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow">
            <p className="text-sm text-purple-600 font-medium">Factory Certificates</p>
            <p className="text-3xl font-bold text-purple-900">{metrics.factoryCertificates}</p>
            <p className="text-xs text-purple-600 mt-2">RM {metrics.totalFactorySpent.toFixed(2)} total</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow">
            <p className="text-sm text-green-600 font-medium">Total Paid</p>
            <p className="text-3xl font-bold text-green-900">RM {(metrics.totalBatchPaid + metrics.totalFactoryPaid).toFixed(2)}</p>
            <p className="text-xs text-green-600 mt-2">All certificates</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg shadow">
            <p className="text-sm text-red-600 font-medium">Total Pending</p>
            <p className="text-3xl font-bold text-red-900">RM {(metrics.totalBatchPending + metrics.totalFactoryPending).toFixed(2)}</p>
            <p className="text-xs text-red-600 mt-2">Awaiting payment</p>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Batch Certificates */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-xl font-bold mb-4 text-blue-900">Batch Certificates</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Spent</p>
                <p className="text-2xl font-bold text-blue-600">RM {metrics.totalBatchSpent.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Paid</p>
                <p className="text-lg font-bold text-green-600">RM {metrics.totalBatchPaid.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Pending</p>
                <p className="text-lg font-bold text-red-600">RM {metrics.totalBatchPending.toFixed(2)}</p>
              </div>
              <div className="pt-2 border-t">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${metrics.paymentRateBatch}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{metrics.paymentRateBatch.toFixed(0)}% paid</p>
              </div>
            </div>
          </div>

          {/* Factory Certificates */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <h3 className="text-xl font-bold mb-4 text-purple-900">Factory Certificates</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Spent</p>
                <p className="text-2xl font-bold text-purple-600">RM {metrics.totalFactorySpent.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Paid</p>
                <p className="text-lg font-bold text-green-600">RM {metrics.totalFactoryPaid.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Pending</p>
                <p className="text-lg font-bold text-red-600">RM {metrics.totalFactoryPending.toFixed(2)}</p>
              </div>
              <div className="pt-2 border-t">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${metrics.paymentRateFactory}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{metrics.paymentRateFactory.toFixed(0)}% paid</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-6">Payment History</h3>
            <div className="space-y-4">
              {chartData.map((data, idx) => (
                <div key={idx} className="pb-4 border-b last:border-b-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="font-semibold text-gray-700">{data.month}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Batch: Spent vs Paid</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">RM {data.batchSpent.toFixed(0)}</span>
                        <span className="text-green-600">→ RM {data.batchPaid.toFixed(0)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Factory: Spent vs Paid</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">RM {data.factorySpent.toFixed(0)}</span>
                        <span className="text-green-600">→ RM {data.factoryPaid.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Payment Reminder</h4>
              <p className="text-sm text-blue-800">
                Keep your payments up to date to maintain smooth certificate processing. Contact support if you have any questions about invoices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
