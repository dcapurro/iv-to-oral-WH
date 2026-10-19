import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react'
import { defaultMedications } from '../data/defaultMedications'
import {
  supabase,
  isSupabaseConfigured,
  replaceTable,
  medicationToRow,
  rowToMedication,
  doseEntryToRow,
  rowToDoseEntry,
} from '../lib/supabase'

const MedicationContext = createContext()

// Storage keys are versioned (v3): dose entries now carry unit/ward/date so the
// calculator can filter by unit, ward and an audit date range.
// Only used as a fallback when Supabase is not configured.
// The "wh" prefix matters: the sibling hospital site shares the same
// dcapurro.github.io origin, and so the same localStorage.
const STORAGE_KEYS = {
  medications: 'iv-oral-wh-medications-v3',
  doseEntries: 'iv-oral-wh-dose-entries-v3',
}

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const loadStored = (key, fallback) => {
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return fallback
    }
  }
  return fallback
}

// Inclusive day count between two YYYY-MM-DD strings (>= 1).
const daysBetween = (min, max) => {
  if (!min || !max) return 1
  const a = Date.parse(min)
  const b = Date.parse(max)
  if (Number.isNaN(a) || Number.isNaN(b)) return 1
  return Math.max(1, Math.round((b - a) / 86400000) + 1)
}

export function MedicationProvider({ children }) {
  // With Supabase configured, the remote tables are the source of truth and
  // local state starts empty until the initial fetch lands. Without it, the app
  // falls back to browser-local storage (single device, not persistent).
  //
  // Medication impact database: { id, name, co2PerDose, plasticPerDose }
  const [medications, setMedications] = useState(() =>
    isSupabaseConfigured ? [] : loadStored(STORAGE_KEYS.medications, defaultMedications)
  )

  // Dose entries (one per eligible audit slot):
  // { id, medicationId, doses, unit, ward, dateStr }
  const [doseEntries, setDoseEntries] = useState(() =>
    isSupabaseConfigured ? [] : loadStored(STORAGE_KEYS.doseEntries, [])
  )

  // 'loading' | 'ready' | 'error' — gates the sync effects below so the initial
  // (empty) state is never written back over the remote data.
  const [syncStatus, setSyncStatus] = useState(
    isSupabaseConfigured ? 'loading' : 'ready'
  )
  const [syncError, setSyncError] = useState('')
  const hydrated = useRef(!isSupabaseConfigured)

  // Calculator state
  const [switchPercentage, setSwitchPercentage] = useState(50)
  const [timePeriod, setTimePeriod] = useState('month')
  const [auditDays, setAuditDays] = useState(30)

  // Filters that scope what the calculator displays.
  const [selectedUnit, setSelectedUnit] = useState('all')
  const [selectedWard, setSelectedWard] = useState('all')
  const [startDate, setStartDate] = useState('') // YYYY-MM-DD, '' = no bound
  const [endDate, setEndDate] = useState('')

  // ── Initial load from Supabase ──────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    const load = async () => {
      try {
        const [medsResult, dosesResult] = await Promise.all([
          supabase.from('medications').select('*').order('name'),
          supabase.from('dose_entries').select('*'),
        ])
        if (medsResult.error) throw medsResult.error
        if (dosesResult.error) throw dosesResult.error
        if (cancelled) return

        // First run against an empty database: seed it with the built-in list
        // so there is something to calculate with.
        let meds = medsResult.data.map(rowToMedication)
        if (meds.length === 0) {
          await replaceTable('medications', defaultMedications.map(medicationToRow))
          if (cancelled) return
          meds = defaultMedications
        }

        setMedications(meds)
        setDoseEntries(dosesResult.data.map(rowToDoseEntry))
        hydrated.current = true
        setSyncStatus('ready')
      } catch (err) {
        if (cancelled) return
        setSyncError(err.message || 'Could not reach the database.')
        setSyncStatus('error')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // ── Persistence ─────────────────────────────────────────────────────────
  // Each change mirrors the full list to the remote table (or to localStorage
  // when Supabase is not configured). `hydrated` stops the initial empty state
  // from wiping the remote tables before the first fetch completes.
  const persist = (table, rows, toRow) => {
    if (!hydrated.current) return
    if (!isSupabaseConfigured) {
      localStorage.setItem(table, JSON.stringify(rows))
      return
    }
    replaceTable(table, rows.map(toRow)).catch((err) => {
      setSyncError(err.message || 'Could not save to the database.')
      setSyncStatus('error')
    })
  }

  useEffect(() => {
    persist(
      isSupabaseConfigured ? 'medications' : STORAGE_KEYS.medications,
      medications,
      medicationToRow
    )
  }, [medications])

  useEffect(() => {
    persist(
      isSupabaseConfigured ? 'dose_entries' : STORAGE_KEYS.doseEntries,
      doseEntries,
      doseEntryToRow
    )
  }, [doseEntries])

  // ── Derived filter options ──────────────────────────────────────────────
  const availableUnits = useMemo(
    () => [...new Set(doseEntries.map((e) => e.unit).filter(Boolean))].sort(),
    [doseEntries]
  )
  const availableWards = useMemo(
    () => [...new Set(doseEntries.map((e) => e.ward).filter(Boolean))].sort(),
    [doseEntries]
  )
  // Min/max audit date across all loaded entries (for date-picker bounds).
  const dataDateBounds = useMemo(() => {
    const dates = doseEntries.map((e) => e.dateStr).filter(Boolean).sort()
    return dates.length ? { min: dates[0], max: dates[dates.length - 1] } : null
  }, [doseEntries])

  // ── Filtered views of the dose entries ──────────────────────────────────
  // Every audited dose passing the unit/ward/date filters — switchable or not,
  // in the impact database or not. Drives the audit chart.
  const filteredAuditEntries = useMemo(() => {
    return doseEntries.filter((e) => {
      if (selectedUnit !== 'all' && e.unit !== selectedUnit) return false
      if (selectedWard !== 'all' && e.ward !== selectedWard) return false
      // Undated (manually added) entries always pass the date filter.
      if (e.dateStr) {
        if (startDate && e.dateStr < startDate) return false
        if (endDate && e.dateStr > endDate) return false
      }
      return true
    })
  }, [doseEntries, selectedUnit, selectedWard, startDate, endDate])

  // The subset that actually earns savings: flagged switchable AND costed in
  // the impact database. Everything downstream of the calculator uses this.
  const filteredDoseEntries = useMemo(
    () => filteredAuditEntries.filter((e) => e.switchable && e.medicationId),
    [filteredAuditEntries]
  )

  // Effective audit length used for week/month/year projection. When dated
  // entries exist, use the active date window (explicit start/end, else the
  // data bounds); otherwise fall back to the manual auditDays field.
  const effectiveAuditDays = useMemo(() => {
    if (!dataDateBounds) return auditDays
    const min = startDate || dataDateBounds.min
    const max = endDate || dataDateBounds.max
    return daysBetween(min, max)
  }, [dataDateBounds, startDate, endDate, auditDays])

  // ── Medication database operations ──────────────────────────────────────
  const addMedication = (medication) => {
    const newMedication = {
      ...medication,
      id: medication.id || slugify(medication.name) || `med-${Date.now()}`,
    }
    setMedications((prev) => [...prev, newMedication])
    return newMedication
  }

  const updateMedication = (id, updates) => {
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, ...updates } : med))
    )
  }

  const deleteMedication = (id) => {
    setMedications((prev) => prev.filter((med) => med.id !== id))
    // The audited doses still happened, so keep them — they just lose their
    // impact figures. They stay on the audit chart and stop earning savings,
    // exactly like a drug that was never in the database.
    setDoseEntries((prev) =>
      prev.map((entry) =>
        entry.medicationId === id ? { ...entry, medicationId: '' } : entry
      )
    )
  }

  // Bulk import medications from CSV: [{ name, co2PerDose, plasticPerDose }].
  const importMedications = (list) => {
    let added = 0
    let updated = 0
    let skipped = 0

    setMedications((prev) => {
      const next = [...prev]
      list.forEach((item) => {
        const name = (item.name || '').trim()
        const co2 = parseFloat(item.co2PerDose)
        const plastic = parseFloat(item.plasticPerDose)
        if (!name || Number.isNaN(co2) || Number.isNaN(plastic)) {
          skipped++
          return
        }
        const idx = next.findIndex(
          (m) => m.name.toLowerCase() === name.toLowerCase()
        )
        if (idx >= 0) {
          next[idx] = { ...next[idx], co2PerDose: co2, plasticPerDose: plastic }
          updated++
        } else {
          next.push({
            id: slugify(name) || `med-${Date.now()}-${added}`,
            name,
            co2PerDose: co2,
            plasticPerDose: plastic,
          })
          added++
        }
      })
      return next
    })

    return { added, updated, skipped }
  }

  // ── Dose entry operations ───────────────────────────────────────────────
  // Manual add (no unit/ward/date). Merges into an existing manual entry.
  const addDoseEntry = (medicationId, doses) => {
    setDoseEntries((prev) => {
      const existing = prev.find(
        (e) => e.medicationId === medicationId && !e.unit && !e.dateStr
      )
      if (existing) {
        return prev.map((e) =>
          e === existing ? { ...e, doses: e.doses + doses } : e
        )
      }
      const med = medications.find((m) => m.id === medicationId)
      return [
        ...prev,
        {
          id: `dose-${Date.now()}`,
          medicationId,
          name: med ? med.name : medicationId,
          switchable: true, // manual entries are switchable by definition
          doses,
          unit: '',
          ward: '',
          dateStr: '',
        },
      ]
    })
  }

  const removeDoseEntry = (id) => {
    setDoseEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const clearDoseEntries = () => {
    setDoseEntries([])
    setSelectedUnit('all')
    setSelectedWard('all')
    setStartDate('')
    setEndDate('')
  }

  // Load an audit file: replaces all dose entries with the eligible (switch=Yes)
  // slots, matched by medication name (case-insensitive) against the impact DB.
  // Report-only: unmatched names are dropped and returned for display.
  const importAuditDoses = (entries) => {
    const next = []
    let matched = 0
    let matchedDoses = 0
    let unmatchedDoses = 0

    // Every distinct medication name in the audit, keyed by lowercase name so
    // spelling variants that differ only in case collapse into one. Drives the
    // post-import report and the CSV downloads that let the user fill in the
    // impact figures for names the database doesn't know yet.
    const auditNames = new Map()
    const noteName = (name, doses, med) => {
      const key = name.toLowerCase()
      const existing = auditNames.get(key)
      if (existing) {
        existing.doses += doses
        return
      }
      auditNames.set(key, {
        name,
        doses,
        inDatabase: Boolean(med),
        co2PerDose: med ? med.co2PerDose : '',
        plasticPerDose: med ? med.plasticPerDose : '',
      })
    }

    entries.forEach((entry, i) => {
      const name = (entry.name || '').trim()
      const doses = entry.doses
      if (!name || !doses) return

      const med = medications.find(
        (m) => m.name.toLowerCase() === name.toLowerCase()
      )

      // The import report is about savings, so it counts only switchable doses:
      // a non-switchable drug missing from the database costs no savings and is
      // not something the user needs to go and fix.
      if (entry.switchable) {
        noteName(name, doses, med)
        if (med) {
          matched++
          matchedDoses += doses
        } else {
          unmatchedDoses += doses
        }
      }

      // Store every dose regardless. medicationId is '' when the drug has no
      // impact figures; the chart keys off `name` so it can still plot it.
      next.push({
        id: `dose-${Date.now()}-${i}`,
        medicationId: med ? med.id : '',
        name,
        switchable: Boolean(entry.switchable),
        doses,
        unit: entry.unit || '',
        ward: entry.ward || '',
        dateStr: entry.dateStr || '',
      })
    })

    setDoseEntries(next)
    // Reset filters to show everything just loaded.
    setSelectedUnit('all')
    setSelectedWard('all')
    setStartDate('')
    setEndDate('')

    // Busiest first, so the names worth fixing float to the top of the report.
    const auditMedications = [...auditNames.values()].sort((a, b) => b.doses - a.doses)

    return {
      matched,
      matchedDoses,
      unmatchedDoses,
      auditMedications,
      unmatched: auditMedications.filter((m) => !m.inDatabase),
    }
  }

  const value = {
    // Sync state
    syncStatus,
    syncError,
    isSupabaseConfigured,
    // Medication database
    medications,
    addMedication,
    updateMedication,
    deleteMedication,
    importMedications,
    // Dose entries
    doseEntries,
    filteredDoseEntries,
    filteredAuditEntries,
    addDoseEntry,
    removeDoseEntry,
    clearDoseEntries,
    importAuditDoses,
    // Filters
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
    // Calculator state
    switchPercentage,
    setSwitchPercentage,
    timePeriod,
    setTimePeriod,
    auditDays,
    setAuditDays,
    effectiveAuditDays,
  }

  return (
    <MedicationContext.Provider value={value}>
      {children}
    </MedicationContext.Provider>
  )
}

export function useMedication() {
  const context = useContext(MedicationContext)
  if (!context) {
    throw new Error('useMedication must be used within a MedicationProvider')
  }
  return context
}
