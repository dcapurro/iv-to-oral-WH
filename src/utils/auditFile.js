// Parser for the wide-format ward IV-medication audit export (REDCap style).
//
// Each CSV row is ONE patient audit and carries up to 10 parallel medication
// slots. For slot i the three linked columns are:
//   "medication i"  /  "number doses i"  /  "switch i"
// Header matching ignores spaces and underscores, so both the hand-built
// ("medication 1") and REDCap ("medication_1") spellings work. Likewise the
// switch flag may be Yes/No or REDCap's 1/0.
//
// We keep a slot only when the switch flag is set (an eligible IV->oral
// opportunity), the medication name is non-empty, and doses parse to > 0. Each kept
// slot becomes one long record carrying the row's Record ID, audit date, unit
// and ward so the calculator can filter/aggregate by any of those dimensions.

import { parseCsv, toObjects } from './csv.js'

const SLOTS = 10

// Normalize a header for matching: lowercase + strip whitespace and
// underscores, so "number doses 1", "number_doses1" and "numberdoses1" all
// collapse to "numberdoses1". REDCap exports the underscored form.
const norm = (s) => (s || '').toLowerCase().replace(/[\s_]+/g, '')

// Build a lookup from normalized-header -> original key for one row object.
const normKeyMap = (row) => {
  const map = {}
  for (const key of Object.keys(row)) map[norm(key)] = key
  return map
}

// Read a value from a row by trying several normalized header candidates.
const readBy = (row, keyMap, ...candidates) => {
  for (const cand of candidates) {
    const key = keyMap[norm(cand)]
    if (key !== undefined) return row[key]
  }
  return ''
}

// Pull the calendar date (YYYY-MM-DD) out of an audit timestamp such as
// "2026-04-21 08:00". Returns '' if it can't be parsed.
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
  const rows = toObjects(parseCsv(text))

  const entries = []
  let eligibleSlots = 0
  let droppedZeroDose = 0
  const units = new Set()
  const wards = new Set()

  rows.forEach((row) => {
    const keyMap = normKeyMap(row)
    const recordId = readBy(row, keyMap, 'record id', 'recordid').trim()
    const dateRaw = readBy(row, keyMap, 'date and time of audit', 'date').trim()
    const dateStr = toDateStr(dateRaw)
    const unit = readBy(row, keyMap, 'unit').trim()
    // Normalize ward to uppercase so e.g. "5se" and "5SE" collapse to one.
    const ward = readBy(row, keyMap, 'ward').trim().toUpperCase()

    for (let i = 1; i <= SLOTS; i++) {
      const name = readBy(row, keyMap, `medication ${i}`, `medication${i}`).trim()
      if (!name) continue // empty slot

      // Is this slot flagged as an IV->oral switch opportunity? REDCap exports
      // the flag as 1/0; the hand-built format uses Yes/No. Accept both.
      const switchVal = readBy(row, keyMap, `switch${i}`, `switch ${i}`).trim().toLowerCase()
      const switchable = switchVal === 'yes' || switchVal === '1' || switchVal === 'true'
      if (switchable) eligibleSlots++

      const doses = parseInt(readBy(row, keyMap, `number doses ${i}`, `numberdoses${i}`), 10)
      if (Number.isNaN(doses) || doses <= 0) {
        if (switchable) droppedZeroDose++
        continue
      }

      if (unit) units.add(unit)
      if (ward) wards.add(ward)

      // Non-switchable doses are kept too: only switchable ones drive the
      // savings figures, but the audit chart needs both to show a switch rate.
      entries.push({
        recordId,
        dateStr,
        unit: unit || '',
        ward: ward || '',
        name,
        doses,
        switchable,
      })
    }
  })

  const dateList = entries.map((e) => e.dateStr).filter(Boolean).sort()

  return {
    entries,
    eligibleSlots, // total switch=Yes slots seen
    droppedZeroDose, // Yes slots skipped for 0/blank doses
    units: [...units].sort(),
    wards: [...wards].sort(),
    dateBounds: dateList.length
      ? { min: dateList[0], max: dateList[dateList.length - 1] }
      : null,
  }
}
