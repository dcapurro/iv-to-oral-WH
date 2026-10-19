import { Leaf, Calculator, Settings } from 'lucide-react'

export default function Header({ currentPage, onPageChange }) {
  return (
    <header className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Leaf className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold">IV to Oral Therapy</h1>
              <p className="text-primary-100 text-sm">Environmental Savings Calculator · WH</p>
            </div>
          </div>

          <nav className="flex gap-2">
            <button
              onClick={() => onPageChange('calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                currentPage === 'calculator'
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Calculator className="w-5 h-5" />
              <span className="hidden sm:inline">Calculator</span>
            </button>
            <button
              onClick={() => onPageChange('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                currentPage === 'settings'
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
