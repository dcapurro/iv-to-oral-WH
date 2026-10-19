// Minimal CSV utilities for parsing uploaded files in the browser.
// Handles quoted fields, embedded commas, escaped quotes ("") and CRLF.

export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') {
      field += c
    }
  }
  // flush the final field/row (files without a trailing newline)
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  // drop fully-empty rows
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

// Turn parsed rows into objects keyed by the (trimmed) header row.
export function toObjects(rows) {
  if (rows.length === 0) return []
  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).map((r) => {
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = (r[i] ?? '').trim()
    })
    return obj
  })
}

// Serialize rows (array of arrays) back to CSV text, quoting any field that
// contains a comma, quote or newline.
export function toCsv(rows) {
  const escape = (value) => {
    const s = value === null || value === undefined ? '' : String(value)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return rows.map((r) => r.map(escape).join(',')).join('\n')
}

// Trigger a browser download of `text` as `filename`.
export function downloadCsv(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Pick a value from a row object by fuzzy header match (case-insensitive
// "contains"). Returns the first keyword that matches a header.
export function pick(obj, ...keywords) {
  const keys = Object.keys(obj)
  for (const kw of keywords) {
    const match = keys.find((key) => key.toLowerCase().includes(kw.toLowerCase()))
    if (match !== undefined) return obj[match]
  }
  return undefined
}
