import { useState } from 'react'
import Header from './components/Header'
import MedicationForm from './components/MedicationForm'
import AuditFilters from './components/AuditFilters'
import SavingsSlider from './components/SavingsSlider'
import TimePeriodSelector from './components/TimePeriodSelector'
import SavingsChart from './components/SavingsChart'
import AuditChart from './components/AuditChart'
import SavingsSummary from './components/SavingsSummary'
import Settings from './components/Settings'
import SyncBanner from './components/SyncBanner'

function App() {
  const [currentPage, setCurrentPage] = useState('calculator')

  return (
    <div className="min-h-screen bg-slate-100">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="container mx-auto px-4 py-8">
        <SyncBanner />

        {currentPage === 'calculator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <MedicationForm />
              <AuditFilters />
              <SavingsSlider />
              <TimePeriodSelector />
            </div>
            <div className="space-y-6">
              <SavingsSummary />
              <SavingsChart />
              <AuditChart />
            </div>
          </div>
        ) : (
          <Settings />
        )}
      </main>

      <footer className="bg-slate-800 text-slate-400 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            IV to Oral Therapy Environmental Savings Calculator
          </p>
          <p className="text-xs mt-2">
            Helping healthcare reduce environmental impact through medication optimization
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
