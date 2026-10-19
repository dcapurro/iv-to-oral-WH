import { Cloud, Recycle, TrendingUp, Car, TreeDeciduous } from 'lucide-react'
import { useMedication } from '../context/MedicationContext'
import { calculateTotalSavings } from '../utils/calculations'

export default function SavingsSummary() {
  const {
    medications,
    filteredDoseEntries,
    switchPercentage,
    timePeriod,
    effectiveAuditDays,
    selectedUnit,
    selectedWard,
  } = useMedication()

  const savings = calculateTotalSavings(
    filteredDoseEntries,
    medications,
    switchPercentage,
    timePeriod,
    effectiveAuditDays
  )

  const timePeriodLabel = timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)
  const scopeLabel = `${selectedUnit === 'all' ? 'All units' : selectedUnit} · ${
    selectedWard === 'all' ? 'All wards' : selectedWard
  }`

  const totalDoses = filteredDoseEntries.reduce((sum, e) => sum + e.doses, 0)
  const switchedDoses = Math.round(totalDoses * (switchPercentage / 100))

  return (
    <div className="card bg-gradient-to-br from-primary-500 to-secondary-600 text-white">
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Total Savings ({timePeriodLabel})
        </h2>
        <p className="text-primary-100 text-sm mt-1">{scopeLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-6 h-6" />
            <span className="text-primary-100">CO2 Saved</span>
          </div>
          <div className="text-3xl font-bold">{savings.co2}</div>
          <div className="text-primary-100 text-sm">kilograms</div>
        </div>

        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Recycle className="w-6 h-6" />
            <span className="text-primary-100">Plastic Saved</span>
          </div>
          <div className="text-3xl font-bold">{savings.plastic}</div>
          <div className="text-primary-100 text-sm">grams</div>
        </div>
      </div>

      <div className="bg-white/10 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-primary-100">Doses switched:</span>
          <span className="font-semibold">
            {switchedDoses} of {totalDoses}
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2 mt-2">
          <div
            className="bg-accent-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${switchPercentage}%` }}
          />
        </div>
      </div>

      {savings.co2 > 0 && (
        <div className="mt-4 space-y-2 text-sm text-primary-100">
          <p className="flex items-center gap-2">
            <Car className="w-5 h-5 text-white" />
            <span>
              Equivalent to driving{' '}
              <span className="font-semibold text-white">
                {Math.round(savings.co2 * 4)} km
              </span>{' '}
              less by car
            </span>
          </p>
          <p className="flex items-center gap-2">
            <TreeDeciduous className="w-5 h-5 text-white" />
            <span>
              Equivalent to saving{' '}
              <span className="font-semibold text-white">
                {(savings.co2 * 0.025).toFixed(2)} m²
              </span>{' '}
              of rainforest
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
