import { createClient } from '@supabase/supabase-js'

// Both values are baked into the bundle at build time and are safe to expose:
// the anon key only grants what the tables' row-level security policies allow.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// When the env vars are absent the app falls back to browser-local storage, so
// it still runs (single-device, non-persistent) before Supabase is set up.
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null

// Both tables use replace-on-write semantics: a write wipes the table and
// inserts the full current list. Volumes are small (tens to hundreds of rows)
// and it keeps the client a straightforward mirror of the remote state.
export async function replaceTable(table, rows) {
  // .delete() requires a filter; `id` is never an empty string, so this is
  // "every row" expressed as a predicate.
  const { error: deleteError } = await supabase.from(table).delete().neq('id', '')
  if (deleteError) throw deleteError

  if (!rows.length) return

  const { error: insertError } = await supabase.from(table).insert(rows)
  if (insertError) throw insertError
}

// ── Row <-> app-object mapping ────────────────────────────────────────────
// Postgres columns are snake_case; the app's objects are camelCase.

export const medicationToRow = (med) => ({
  id: med.id,
  name: med.name,
  co2_per_dose: med.co2PerDose,
  plastic_per_dose: med.plasticPerDose,
})

export const rowToMedication = (row) => ({
  id: row.id,
  name: row.name,
  co2PerDose: Number(row.co2_per_dose),
  plasticPerDose: Number(row.plastic_per_dose),
})

export const doseEntryToRow = (entry) => ({
  id: entry.id,
  medication_id: entry.medicationId || '',
  name: entry.name,
  switchable: entry.switchable,
  doses: entry.doses,
  unit: entry.unit || '',
  ward: entry.ward || '',
  date_str: entry.dateStr || '',
})

export const rowToDoseEntry = (row) => ({
  id: row.id,
  medicationId: row.medication_id || '',
  name: row.name,
  switchable: Boolean(row.switchable),
  doses: Number(row.doses),
  unit: row.unit || '',
  ward: row.ward || '',
  dateStr: row.date_str || '',
})
