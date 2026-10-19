// Environmental savings are computed per dose:
//   savings = (impact per dose) x (number of doses) x (switch fraction) x (projection)
//
// The uploaded / entered doses are treated as the observed audit. The audit is
// assumed to span `auditDays` days, and the time-period selector projects that
// observation onto a week / month / year.

const round2 = (n) => Math.round(n * 100) / 100

// Days represented by each time period.
export const timePeriodDays = {
  week: 7,
  month: 30,
  year: 365,
}

// Scale factor to project the observed audit onto the chosen time period.
// auditDays defaults sensibly and is guarded against 0.
export const projectionFactor = (timePeriod, auditDays) => {
  const days = timePeriodDays[timePeriod] ?? 30
  const audit = auditDays > 0 ? auditDays : 1
  return days / audit
}

// Total savings across all dose entries.
export const calculateTotalSavings = (
  doseEntries,
  medications,
  switchPercentage,
  timePeriod,
  auditDays
) => {
  const factor = projectionFactor(timePeriod, auditDays)
  const switchRatio = switchPercentage / 100

  let totalCO2 = 0
  let totalPlastic = 0

  doseEntries.forEach((entry) => {
    const medication = medications.find((m) => m.id === entry.medicationId)
    if (medication) {
      const doses = entry.doses || 0
      totalCO2 += (medication.co2PerDose || 0) * doses * switchRatio * factor
      totalPlastic += (medication.plasticPerDose || 0) * doses * switchRatio * factor
    }
  })

  return {
    co2: round2(totalCO2),
    plastic: round2(totalPlastic),
  }
}

// Per-medication chart data.
export const generateChartData = (
  doseEntries,
  medications,
  switchPercentage,
  timePeriod,
  auditDays
) => {
  const factor = projectionFactor(timePeriod, auditDays)
  const switchRatio = switchPercentage / 100

  return doseEntries
    .map((entry) => {
      const medication = medications.find((m) => m.id === entry.medicationId)
      if (!medication) return null
      const doses = entry.doses || 0

      return {
        name: medication.name,
        co2: round2((medication.co2PerDose || 0) * doses * switchRatio * factor),
        plastic: round2((medication.plasticPerDose || 0) * doses * switchRatio * factor),
        doses,
      }
    })
    .filter(Boolean)
}
