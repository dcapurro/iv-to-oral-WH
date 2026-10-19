import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from 'recharts'
import { ClipboardList } from 'lucide-react'
import { useMedication } from '../context/MedicationContext'

// Emerald = switched (the win), slate = not switched (the recessive remainder,
// deliberately neutral rather than a competing hue). Colourblind separation
// between the two is ΔE 27 (deutan), well clear of the floor.
const SWITCHED = '#059669'
const NOT_SWITCHED = '#64748b'

const ROW_HEIGHT = 26
const CHART_PADDING = 60

// A full audit runs to ~70 medications, which is an unreadable wall of bars.
// Show the busiest by default and let the user open up the long tail.
const TOP_N = 20

export default function AuditChart() {
  const { filteredAuditEntries, medications } = useMedication()
  const [showAll, setShowAll] = useState(false)

  // One row per drug: total audited doses, split by switch flag. Keyed on the
  // lowercased name so spelling variants that differ only in case collapse
  // together; the impact database's spelling wins as the display label when the
  // drug is known, otherwise the audit's own spelling is used.
  const data = useMemo(() => {
    const byName = new Map()

    filteredAuditEntries.forEach((entry) => {
      const key = (entry.name || '').toLowerCase()
      if (!key) return

      let row = byName.get(key)
      if (!row) {
        const med = medications.find((m) => m.id === entry.medicationId)
        row = {
          name: med ? med.name : entry.name,
          switched: 0,
          notSwitched: 0,
          total: 0,
          inDatabase: Boolean(entry.medicationId),
        }
        byName.set(key, row)
      }

      if (entry.switchable) row.switched += entry.doses
      else row.notSwitched += entry.doses
      row.total += entry.doses
    })

    return [...byName.values()].sort((a, b) => b.total - a.total)
  }, [filteredAuditEntries, medications])

  const totals = useMemo(
    () =>
      data.reduce(
        (acc, row) => ({
          switched: acc.switched + row.switched,
          total: acc.total + row.total,
        }),
        { switched: 0, total: 0 }
      ),
    [data]
  )

  if (data.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary-500" />
          Audited Doses by Medication
        </h2>
        <div className="h-64 flex items-center justify-center text-slate-400 text-center px-4">
          No audit data in view. Upload an audit CSV or relax the filters.
        </div>
      </div>
    )
  }

  const switchRate = totals.total
    ? Math.round((totals.switched / totals.total) * 100)
    : 0

  // Totals above always describe the whole audit; only the bars are truncated.
  const visible = showAll ? data : data.slice(0, TOP_N)
  const hiddenCount = data.length - visible.length

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const row = payload[0].payload
    const rate = row.total ? Math.round((row.switched / row.total) * 100) : 0
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-sm">
        <p className="font-medium text-slate-700 mb-1">{row.name}</p>
        <p className="text-slate-600">
          <span
            className="inline-block w-2 h-2 rounded-sm mr-2"
            style={{ backgroundColor: SWITCHED }}
          />
          Switchable: Yes — {row.switched} dose{row.switched === 1 ? '' : 's'}
        </p>
        <p className="text-slate-600">
          <span
            className="inline-block w-2 h-2 rounded-sm mr-2"
            style={{ backgroundColor: NOT_SWITCHED }}
          />
          Switchable: No — {row.notSwitched} dose{row.notSwitched === 1 ? '' : 's'}
        </p>
        <p className="text-slate-500 mt-1 pt-1 border-t border-slate-100">
          {rate}% switchable of {row.total} total
        </p>
        {!row.inDatabase && (
          <p className="text-amber-600 text-xs mt-1">
            No impact data — excluded from savings
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-1 gap-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary-500" />
          Audited Doses by Medication
        </h2>
        <div className="text-right shrink-0">
          <span className="text-2xl font-bold text-primary-600">{switchRate}%</span>
          <span className="text-sm text-slate-500 ml-1">switchable</span>
        </div>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Every audited dose in view ({totals.total} across {data.length} medication
        {data.length === 1 ? '' : 's'}), including drugs with no impact data.
        Reflects the unit, ward and date filters.
        {hiddenCount > 0 && ` Showing the ${TOP_N} busiest.`}
      </p>

      <div style={{ height: visible.length * ROW_HEIGHT + CHART_PADDING }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={visible}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 5, bottom: 5 }}
            barCategoryGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#cbd5e1' }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fill: '#475569', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <Tooltip content={renderTooltip} cursor={{ fill: '#f1f5f9' }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
            />
            {/* stroke matches the card surface: a 2px gap between the two
                segments so they read as distinct even at low contrast */}
            <Bar
              dataKey="switched"
              name="Switchable: Yes"
              stackId="doses"
              fill={SWITCHED}
              stroke="#fff"
              strokeWidth={1}
              animationDuration={500}
            />
            <Bar
              dataKey="notSwitched"
              name="Switchable: No"
              stackId="doses"
              fill={NOT_SWITCHED}
              stroke="#fff"
              strokeWidth={1}
              radius={[0, 4, 4, 0]}
              animationDuration={500}
            >
              <LabelList
                dataKey="total"
                position="right"
                style={{ fill: '#64748b', fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {(hiddenCount > 0 || showAll) && (
        <button
          onClick={() => setShowAll((prev) => !prev)}
          className="btn-secondary w-full mt-3 text-sm"
        >
          {showAll
            ? `Show top ${TOP_N} only`
            : `Show all ${data.length} medications (${hiddenCount} more)`}
        </button>
      )}
    </div>
  )
}
