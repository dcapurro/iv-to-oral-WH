import { Calculator, Settings } from 'lucide-react'
import westernHealthLogo from '../assets/western-health-logo.png'

export default function Header({ currentPage, onPageChange }) {
  return (
    <header className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* White tile: the logo's grey wordmark is unreadable on the green. */}
            <div className="bg-white px-2 py-1.5 rounded-lg shadow-sm shrink-0">
              <img src={westernHealthLogo} alt="Western Health" className="h-8 sm:h-11 w-auto" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold">IV to Oral Therapy</h1>
              <p className="hidden sm:block text-primary-100 text-sm">Environmental Savings Calculator</p>
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
