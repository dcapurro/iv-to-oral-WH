import { Filter, X } from 'lucide-react'
import { useMedication } from '../context/MedicationContext'

export default function AuditFilters() {
  const {
    selectedUnit,
    setSelectedUnit,
    selectedWard,
    setSelectedWard,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    availableUnits,
    availableWards,
    dataDateBounds,
  } = useMedication()

  const hasData = availableUnits.length > 0 || dataDateBounds
  const filtersActive =
    selectedUnit !== 'all' || selectedWard !== 'all' || startDate || endDate

  const clearFilters = () => {
    setSelectedUnit('all')
    setSelectedWard('all')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary-500" />
          Filters
        </h2>
        {filtersActive && (
          <button
            onClick={clearFilters}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {!hasData && (
        <p className="text-sm text-slate-500">
          Upload an audit file to filter by unit, ward and date.
        </p>
      )}

      {hasData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Unit</label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="input-field"
              >
                <option value="all">All units</option>
                {availableUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Ward</label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="input-field"
              >
                <option value="all">All wards</option>
                {availableWards.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">From</label>
              <input
                type="date"
                value={startDate}
                min={dataDateBounds?.min}
                max={dataDateBounds?.max}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">To</label>
              <input
                type="date"
                value={endDate}
                min={dataDateBounds?.min}
                max={dataDateBounds?.max}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {dataDateBounds && (
            <p className="text-xs text-slate-400">
              Audit data spans {dataDateBounds.min} to {dataDateBounds.max}.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
