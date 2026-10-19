import { useRef, useState, useMemo } from 'react'
import { Plus, Trash2, Check, Syringe, Upload, AlertCircle, Download } from 'lucide-react'
import { useMedication } from '../context/MedicationContext'
import { parseAuditFile } from '../utils/auditFile'
import { toCsv, downloadCsv } from '../utils/csv'

export default function MedicationForm() {
  const {
    medications,
    doseEntries,
    filteredDoseEntries,
    addDoseEntry,
    clearDoseEntries,
    importAuditDoses,
  } = useMedication()

  const [selectedMedication, setSelectedMedication] = useState('')
  const [doseCount, setDoseCount] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const fileInputRef = useRef(null)

  const handleClearAudit = () => {
    clearDoseEntries()
    setImportResult(null)
    setConfirmingClear(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedMedication || !doseCount || parseInt(doseCount) <= 0) return
    addDoseEntry(selectedMedication, parseInt(doseCount))
    setSelectedMedication('')
    setDoseCount('')
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseAuditFile(String(reader.result))
      const result = importAuditDoses(parsed.entries)
      setImportResult({ ...result, ...parsed })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Export medication names from the audit in the exact shape the Configuration
  // page's CSV upload expects, so the user can fill in the blank carbon/plastic
  // cells and upload it straight back. Known drugs carry their current values;
  // unknown ones are left blank (a blank value is skipped on re-import rather
  // than being read as zero). The trailing dose count is informational and
  // ignored on upload.
  const downloadMedicationCsv = (list, scope) => {
    const rows = [
      ['medication', 'carbon', 'plastic', 'doses in audit'],
      ...list.map((m) => [m.name, m.co2PerDose, m.plasticPerDose, m.doses]),
    ]
    const date = new Date().toISOString().slice(0, 10)
    downloadCsv(`medications-${scope}-${date}.csv`, toCsv(rows))
  }

  const getMedicationName = (medicationId) => {
    const med = medications.find((m) => m.id === medicationId)
    return med ? med.name : 'Unknown'
  }

  // Aggregate the (filtered) eligible doses by medication for a readable list.
  const summary = useMemo(() => {
    const map = new Map()
    filteredDoseEntries.forEach((e) => {
      const cur = map.get(e.medicationId) || { doses: 0, units: new Set() }
      cur.doses += e.doses
      if (e.unit) cur.units.add(e.unit)
      map.set(e.medicationId, cur)
    })
    return [...map.entries()]
      .map(([medicationId, v]) => ({
        medicationId,
        name: getMedicationName(medicationId),
        doses: v.doses,
        unitCount: v.units.size,
      }))
      .sort((a, b) => b.doses - a.doses)
  }, [filteredDoseEntries, medications])

  const totalDoses = filteredDoseEntries.reduce((s, e) => s + e.doses, 0)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Syringe className="w-5 h-5 text-primary-500" />
          Switchable IV Doses
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Audit CSV
          </button>
          {doseEntries.length > 0 && (
            <button
              onClick={() => setConfirmingClear(true)}
              className="btn-danger flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear audit data
            </button>
          )}
        </div>
      </div>

      {confirmingClear && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <div className="flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Clear all loaded audit data? This removes every dose entry and
              resets the filters so you can upload a new batch. This cannot be
              undone.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleClearAudit}
              className="btn-danger flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Yes, clear it
            </button>
            <button
              onClick={() => setConfirmingClear(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        className="hidden"
      />

      <p className="text-sm text-slate-500 mb-4">
        Upload the ward audit export (wide format). Only doses flagged{' '}
        <strong>Switch = Yes</strong> are counted. Use the filters below to scope
        by unit, ward or date.
      </p>

      {importResult && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded text-sm">
            <Check className="w-4 h-4 shrink-0" />
            Loaded {importResult.matchedDoses} switchable dose
            {importResult.matchedDoses === 1 ? '' : 's'} across{' '}
            {importResult.matched} medication
            {importResult.matched === 1 ? '' : 's'}
            {importResult.dateBounds &&
              ` (${importResult.dateBounds.min} to ${importResult.dateBounds.max})`}
            .
          </div>
          {importResult.unmatched.length > 0 && (
            <div className="text-amber-800 bg-amber-50 border border-amber-200 px-3 py-3 rounded text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <strong>
                    {importResult.unmatched.length} medication
                    {importResult.unmatched.length === 1 ? '' : 's'} not in the
                    impact database
                  </strong>{' '}
                  — {importResult.unmatchedDoses} dose
                  {importResult.unmatchedDoses === 1 ? '' : 's'} were skipped and
                  are not counted in the savings below.
                  <p className="mt-1 text-amber-700">
                    Download the list, fill in the carbon and plastic columns,
                    then upload it on the Configuration page.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3 sm:ml-6">
                <button
                  onClick={() => downloadMedicationCsv(importResult.unmatched, 'unmatched')}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Unmatched only ({importResult.unmatched.length})
                </button>
                <button
                  onClick={() =>
                    downloadMedicationCsv(importResult.auditMedications, 'all')
                  }
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  All in audit ({importResult.auditMedications.length})
                </button>
              </div>

              <ul className="mt-3 sm:ml-6 grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-xs text-amber-700">
                {importResult.unmatched.map((m) => (
                  <li key={m.name} className="flex justify-between gap-2 py-0.5">
                    <span className="truncate">{m.name}</span>
                    <span className="shrink-0 tabular-nums">{m.doses}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {importResult.droppedZeroDose > 0 && (
            <div className="text-xs text-slate-400">
              {importResult.droppedZeroDose} eligible slot
              {importResult.droppedZeroDose === 1 ? '' : 's'} skipped for zero /
              blank dose count.
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={selectedMedication}
          onChange={(e) => setSelectedMedication(e.target.value)}
          className="input-field flex-1"
        >
          <option value="">Add manually...</option>
          {medications.map((med) => (
            <option key={med.id} value={med.id}>
              {med.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          value={doseCount}
          onChange={(e) => setDoseCount(e.target.value)}
          placeholder="# Doses"
          className="input-field w-full sm:w-32"
        />

        <button
          type="submit"
          disabled={!selectedMedication || !doseCount}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Add
        </button>
      </form>

      {summary.length === 0 ? (
        <p className="text-slate-500 text-center py-4">
          No switchable doses in view. Upload an audit CSV, add one manually, or
          relax the filters.
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {summary.map((row) => (
              <li
                key={row.medicationId}
                className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-700">{row.name}</span>
                  {row.unitCount > 0 && (
                    <span className="text-xs text-slate-400">
                      {row.unitCount} unit{row.unitCount === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
                <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-sm">
                  {row.doses} doses
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center mt-3 px-4 text-sm font-medium text-slate-600">
            <span>Total switchable doses in view</span>
            <span>{totalDoses}</span>
          </div>
        </>
      )}
    </div>
  )
}
