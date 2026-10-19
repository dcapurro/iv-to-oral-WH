import { useRef, useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, Database, AlertCircle, Upload } from 'lucide-react'
import { useMedication } from '../context/MedicationContext'
import { parseCsv, toObjects, pick } from '../utils/csv'

export default function Settings() {
  const {
    medications,
    addMedication,
    updateMedication,
    deleteMedication,
    importMedications,
  } = useMedication()

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    co2PerDose: '',
    plasticPerDose: '',
  })
  const [error, setError] = useState('')
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  const resetForm = () => {
    setFormData({ name: '', co2PerDose: '', plasticPerDose: '' })
    setError('')
  }

  const startAdding = () => {
    setIsAdding(true)
    setEditingId(null)
    resetForm()
  }

  const startEditing = (med) => {
    setEditingId(med.id)
    setIsAdding(false)
    setFormData({
      name: med.name,
      co2PerDose: med.co2PerDose.toString(),
      plasticPerDose: med.plasticPerDose.toString(),
    })
    setError('')
  }

  const cancelForm = () => {
    setIsAdding(false)
    setEditingId(null)
    resetForm()
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Medication name is required')
      return false
    }
    if (formData.co2PerDose === '' || parseFloat(formData.co2PerDose) < 0) {
      setError('CO2 per dose must be a positive number')
      return false
    }
    if (formData.plasticPerDose === '' || parseFloat(formData.plasticPerDose) < 0) {
      setError('Plastic per dose must be a positive number')
      return false
    }
    return true
  }

  const handleSave = () => {
    if (!validateForm()) return

    const data = {
      name: formData.name.trim(),
      co2PerDose: parseFloat(formData.co2PerDose),
      plasticPerDose: parseFloat(formData.plasticPerDose),
    }

    if (isAdding) {
      addMedication(data)
    } else if (editingId) {
      updateMedication(editingId, data)
    }

    cancelForm()
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      deleteMedication(id)
    }
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const objects = toObjects(parseCsv(String(reader.result)))
      const list = objects.map((row) => ({
        name: pick(row, 'medication', 'drug', 'name'),
        co2PerDose: pick(row, 'carbon', 'co2', 'co2perdose'),
        plasticPerDose: pick(row, 'plastic', 'plasticperdose'),
      }))
      setImportResult(importMedications(list))
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const renderForm = () => (
    <div className="bg-slate-50 rounded-lg p-4 mb-4">
      <h3 className="font-medium text-slate-700 mb-3">
        {isAdding ? 'Add New Medication' : 'Edit Medication'}
      </h3>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded mb-3">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Medication Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
            placeholder="e.g., Amoxicillin"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Carbon (kg CO2/dose)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.co2PerDose}
            onChange={(e) => setFormData({ ...formData, co2PerDose: e.target.value })}
            className="input-field"
            placeholder="e.g., 0.15"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Plastic (g/dose)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={formData.plasticPerDose}
            onChange={(e) => setFormData({ ...formData, plasticPerDose: e.target.value })}
            className="input-field"
            placeholder="e.g., 22"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Check className="w-4 h-4" />
          Save
        </button>
        <button onClick={cancelForm} className="btn-secondary flex items-center gap-2">
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  )

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary-500" />
          Medication Database
        </h2>

        {!isAdding && !editingId && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload CSV
            </button>
            <button onClick={startAdding} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Medication
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        className="hidden"
      />

      {importResult && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded mb-4 text-sm">
          <Check className="w-4 h-4" />
          Imported: {importResult.added} added, {importResult.updated} updated
          {importResult.skipped > 0 && `, ${importResult.skipped} skipped (invalid)`}.
        </div>
      )}

      {(isAdding || editingId) && renderForm()}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-slate-600 font-medium">Medication</th>
              <th className="text-right py-3 px-4 text-slate-600 font-medium">Carbon (kg CO2/dose)</th>
              <th className="text-right py-3 px-4 text-slate-600 font-medium">Plastic (g/dose)</th>
              <th className="text-right py-3 px-4 text-slate-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {medications.map((med) => (
              <tr
                key={med.id}
                className={`border-b border-slate-100 hover:bg-slate-50 ${
                  editingId === med.id ? 'bg-primary-50' : ''
                }`}
              >
                <td className="py-3 px-4 font-medium text-slate-700">{med.name}</td>
                <td className="py-3 px-4 text-right text-slate-600">{med.co2PerDose}</td>
                <td className="py-3 px-4 text-right text-slate-600">{med.plasticPerDose}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => startEditing(med)}
                      disabled={isAdding || editingId}
                      className="p-2 text-slate-500 hover:bg-slate-200 rounded disabled:opacity-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(med.id)}
                      disabled={isAdding || editingId}
                      className="p-2 text-red-500 hover:bg-red-100 rounded disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {medications.length === 0 && (
        <p className="text-slate-500 text-center py-8">
          No medications in database. Click "Add Medication" or upload a CSV.
        </p>
      )}

      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-600">
          <strong>CSV format:</strong> three columns -{' '}
          <code>medication</code>, <code>carbon</code> (kg CO2 per dose),{' '}
          <code>plastic</code> (g per dose). Rows matching an existing medication
          name update it; new names are added. Values represent the environmental
          impact avoided for each IV dose switched to oral, and should be sourced
          from environmental impact studies specific to your healthcare setting.
        </p>
      </div>
    </div>
  )
}
