import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Loader } from "lucide-react"
import OfficeLayout from "./OfficeLayout"

interface ChartData {
  month: string
  batchRevenue: number
  factoryRevenue: number
  batchPaid: number
  batchPending: number
  factoryPaid: number
  factoryPending: number
}

interface PaymentMetrics {
  totalBatchRevenue: number
  totalFactoryRevenue: number
  batchPaymentRate: number
  factoryPaymentRate: number
  averageDaysToPayBatch: number
  averageDaysToPayFactory: number
  largestPendingBatch: { requestNumber: string; amount: number }
  largestPendingFactory: { requestNumber: string; amount: number }
}

export default function PaymentsDashboardPage() {
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
      const resp = await fetch(`/payments/admin/metrics?range=${timeRange}`)
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
      const resp = await fetch(`/payments/admin/chart-data?range=${timeRange}`)
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
      <OfficeLayout title="Payments Dashboard">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </OfficeLayout>
    )

  return (
    <OfficeLayout title="Payments Dashboard">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Payments Analytics</h1>
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

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow">
            <p className="text-sm text-blue-600 font-medium">Total Batch Revenue</p>
            <p className="text-3xl font-bold text-blue-900">RM {metrics.totalBatchRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow">
            <p className="text-sm text-purple-600 font-medium">Total Factory Revenue</p>
            <p className="text-3xl font-bold text-purple-900">RM {metrics.totalFactoryRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Batch Payment Rate</p>
                <p className="text-3xl font-bold text-green-900">{metrics.batchPaymentRate.toFixed(0)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Factory Payment Rate</p>
                <p className="text-3xl font-bold text-orange-900">{metrics.factoryPaymentRate.toFixed(0)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Batch Certificates */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-xl font-bold mb-4 text-blue-900">Batch Certificates</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Avg Days to Pay</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.averageDaysToPayBatch} days</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Largest Pending</p>
                <div className="text-right">
                  <p className="font-semibold">{metrics.largestPendingBatch.requestNumber}</p>
                  <p className="text-blue-600 font-bold">RM {metrics.largestPendingBatch.amount.toFixed(2)}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${metrics.batchPaymentRate}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Payment completion rate</p>
              </div>
            </div>
          </div>

          {/* Factory Certificates */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <h3 className="text-xl font-bold mb-4 text-purple-900">Factory Certificates</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Avg Days to Pay</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.averageDaysToPayFactory} days</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Largest Pending</p>
                <div className="text-right">
                  <p className="font-semibold">{metrics.largestPendingFactory.requestNumber}</p>
                  <p className="text-purple-600 font-bold">RM {metrics.largestPendingFactory.amount.toFixed(2)}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${metrics.factoryPaymentRate}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Payment completion rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-6">Revenue Trend</h3>
            <div className="space-y-4">
              {chartData.map((data, idx) => (
                <div key={idx} className="pb-4 border-b last:border-b-0">
                  <p className="font-semibold text-gray-700 mb-2">{data.month}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Batch Revenue</p>
                      <div className="flex items-end gap-2">
                        <div className="flex-1 bg-blue-200 rounded" style={{ height: `${(data.batchRevenue / 5000) * 100}px` }} />
                        <p className="text-sm font-semibold">RM {data.batchRevenue.toFixed(0)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Factory Revenue</p>
                      <div className="flex items-end gap-2">
                        <div className="flex-1 bg-purple-200 rounded" style={{ height: `${(data.factoryRevenue / 5000) * 100}px` }} />
                        <p className="text-sm font-semibold">RM {data.factoryRevenue.toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </OfficeLayout>
  )
}
