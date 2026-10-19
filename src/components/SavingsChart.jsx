import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Cloud, Recycle } from 'lucide-react'
import { useMedication } from '../context/MedicationContext'
import { calculateTotalSavings } from '../utils/calculations'

export default function SavingsChart() {
  const {
    medications,
    filteredDoseEntries,
    switchPercentage,
    timePeriod,
    effectiveAuditDays,
  } = useMedication()

  const savings = calculateTotalSavings(
    filteredDoseEntries,
    medications,
    switchPercentage,
    timePeriod,
    effectiveAuditDays
  )

  const timePeriodLabel = timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)

  const co2Data = [{ name: 'CO2', value: savings.co2 }]
  const plasticData = [{ name: 'Plastic', value: savings.plastic }]

  if (filteredDoseEntries.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Total Savings
        </h2>
        <div className="h-64 flex items-center justify-center text-slate-400">
          Add doses above to see savings visualization
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        Total Savings ({timePeriodLabel})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CO2 Chart */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="w-5 h-5 text-primary-500" />
            <span className="font-medium text-slate-700">CO2 Saved</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={co2Data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  domain={[0, 'auto']}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  hide
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value) => [`${value} kg`, 'CO2 Saved']}
                />
                <Bar
                  dataKey="value"
                  fill="#10b981"
                  radius={[0, 8, 8, 0]}
                  animationDuration={500}
                  barSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-primary-600">{savings.co2}</span>
            <span className="text-sm text-slate-500 ml-1">kg</span>
          </div>
        </div>

        {/* Plastic Chart */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Recycle className="w-5 h-5 text-secondary-500" />
            <span className="font-medium text-slate-700">Plastic Saved</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={plasticData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  domain={[0, 'auto']}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  hide
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value) => [`${value} g`, 'Plastic Saved']}
                />
                <Bar
                  dataKey="value"
                  fill="#14b8a6"
                  radius={[0, 8, 8, 0]}
                  animationDuration={500}
                  barSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-secondary-600">{savings.plastic}</span>
            <span className="text-sm text-slate-500 ml-1">g</span>
          </div>
        </div>
      </div>
    </div>
  )
}
