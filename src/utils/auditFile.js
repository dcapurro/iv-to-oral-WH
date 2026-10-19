// Parser for the long-format IV-medication audit export (REDCap, labels).
//
// The export uses a REDCap repeating instrument, so one audit (one Record ID)
// spans several rows:
//   - one AUDIT row, with "Repeat Instrument" blank, carrying the admin fields:
//     "Audit Date and Time", "Campus", "Ward", "Treating Unit", ...
//   - one row per audited drug, with "Repeat Instrument" = "IV medication",
//     carrying "Medication Name" (or "If Other Medication" when the name is
//     "Other"), "Number of doses" and "Missed Opportunity". Its admin columns
//     are blank, so they are looked up from the audit row by Record ID.
//
// "Missed Opportunity" = Yes marks an eligible IV->oral switch. "No" and
// "Unable to determine" are both treated as not switchable.
//
// Header matching ignores case, spaces and underscores. The export repeats some
// headers ("Survey Timestamp", "Complete?"); later copies overwrite earlier ones
// in the row object, which is harmless because none of them are read here.
//
// The result has the same shape as the original wide parser (plus campus), so
// everything downstream (matching, filters, charts, savings) is unchanged.

import { parseCsv, toObjects } from './csv.js'

const MEDICATION_INSTRUMENT = 'ivmedication'

// Normalize a header for matching: lowercase + strip whitespace and
// underscores, so "Number of doses" and "number_of_doses" both collapse to
// "numberofdoses".
const norm = (s) => (s || '').toLowerCase().replace(/[\s_]+/g, '')

// Build a lookup from normalized-header -> original key for one row object.
const normKeyMap = (row) => {
  const map = {}
  for (const key of Object.keys(row)) map[norm(key)] = key
  return map
}

// Read a trimmed value from a row by trying several header candidates.
const readBy = (row, keyMap, ...candidates) => {
  for (const cand of candidates) {
    const key = keyMap[norm(cand)]
    if (key !== undefined) return (row[key] || '').trim()
  }
  return ''
}

// Pull the calendar date (YYYY-MM-DD) out of an audit timestamp such as
// "2026-07-28 13:12". Returns '' if it can't be parsed.
export const toDateStr = (raw) => {
  const s = (raw || '').trim()
  if (!s) return ''
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  // dd-mm-yyyy or dd/mm/yyyy fallback
  const dmy = s.match(/(\d{2})[-/](\d{2})[-/](\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  return ''
}

export function parseAuditFile(text) {
  const rows = toObjects(parseCsv(text)).map((row) => ({
    row,
    keyMap: normKeyMap(row),
  }))
  const read = ({ row, keyMap }, ...candidates) => readBy(row, keyMap, ...candidates)

  // Pass 1: the admin fields of each audit, keyed by Record ID. A separate pass
  // so a drug row still resolves if it happens to precede its audit row.
  const audits = new Map()
  rows.forEach((r) => {
    if (read(r, 'repeat instrument')) return
    const recordId = read(r, 'record id')
    if (!recordId) return
    audits.set(recordId, {
      dateStr: toDateStr(read(r, 'audit date and time')),
      campus: read(r, 'campus'),
      // Normalize ward to uppercase so e.g. "7a" and "7A" collapse to one.
      ward: read(r, 'ward').toUpperCase(),
      unit: read(r, 'treating unit'),
    })
  })

  // Pass 2: one entry per audited drug.
  const entries = []
  let eligibleSlots = 0
  let droppedZeroDose = 0
  const units = new Set()
  const wards = new Set()
  const campuses = new Set()

  rows.forEach((r) => {
    if (norm(read(r, 'repeat instrument')) !== MEDICATION_INSTRUMENT) return

    // "Other" means the real name was typed into the free-text field.
    let name = read(r, 'medication name')
    if (name.toLowerCase() === 'other') name = read(r, 'if other medication') || name
    if (!name) return

    const switchable = read(r, 'missed opportunity').toLowerCase() === 'yes'
    if (switchable) eligibleSlots++

    const doses = parseInt(read(r, 'number of doses'), 10)
    if (Number.isNaN(doses) || doses <= 0) {
      if (switchable) droppedZeroDose++
      return
    }

    const recordId = read(r, 'record id')
    const audit = audits.get(recordId) || { dateStr: '', campus: '', ward: '', unit: '' }

    if (audit.unit) units.add(audit.unit)
    if (audit.ward) wards.add(audit.ward)
    if (audit.campus) campuses.add(audit.campus)

    // Non-switchable doses are kept too: only switchable ones drive the
    // savings figures, but the audit chart needs both to show a switch rate.
    entries.push({ recordId, ...audit, name, doses, switchable })
  })

  const dateList = entries.map((e) => e.dateStr).filter(Boolean).sort()

  return {
    entries,
    eligibleSlots, // total Missed Opportunity = Yes drug rows seen
    droppedZeroDose, // Yes rows skipped for 0/blank doses
    units: [...units].sort(),
    wards: [...wards].sort(),
    campuses: [...campuses].sort(),
    dateBounds: dateList.length
      ? { min: dateList[0], max: dateList[dateList.length - 1] }
      : null,
  }
}
