// Default medications with environmental impact data, pre-seeded from
// sample_impact_data.csv so uploaded audit files match out of the box.
//
// CO2 and plastic figures are PER DOSE of IV administration saved when a dose
// is switched to oral. These are sample values - real data should be sourced
// from environmental impact studies specific to your setting, and can be
// replaced in bulk via the CSV upload on the Configuration page.

export const defaultMedications = [
  { id: 'furosemide', name: 'Furosemide', co2PerDose: 0.15, plasticPerDose: 22 },
  { id: 'cefazolin', name: 'Cefazolin', co2PerDose: 0.25, plasticPerDose: 35 },
  { id: 'vancomycin', name: 'Vancomycin', co2PerDose: 0.3, plasticPerDose: 40 },
  { id: 'ceftriaxone', name: 'Ceftriaxone', co2PerDose: 0.22, plasticPerDose: 33 },
  { id: 'hydrocortisone', name: 'Hydrocortisone', co2PerDose: 0.12, plasticPerDose: 20 },
  { id: 'potassium-chloride', name: 'Potassium chloride', co2PerDose: 0.1, plasticPerDose: 18 },
]
