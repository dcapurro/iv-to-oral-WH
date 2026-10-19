import { Percent } from 'lucide-react'
import { useMedication } from '../context/MedicationContext'

export default function SavingsSlider() {
  const { switchPercentage, setSwitchPercentage } = useMedication()

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Percent className="w-5 h-5 text-primary-500" />
        IV to Oral Switch Rate
      </h2>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Percentage of patients switched:</span>
          <span className="text-2xl font-bold text-primary-600">{switchPercentage}%</span>
        </div>

        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={switchPercentage}
            onChange={(e) => setSwitchPercentage(parseInt(e.target.value))}
            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-6
                       [&::-webkit-slider-thumb]:h-6
                       [&::-webkit-slider-thumb]:bg-primary-500
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:shadow-lg
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:transition-all
                       [&::-webkit-slider-thumb]:hover:bg-primary-600
                       [&::-webkit-slider-thumb]:hover:scale-110
                       [&::-moz-range-thumb]:w-6
                       [&::-moz-range-thumb]:h-6
                       [&::-moz-range-thumb]:bg-primary-500
                       [&::-moz-range-thumb]:border-none
                       [&::-moz-range-thumb]:rounded-full
                       [&::-moz-range-thumb]:shadow-lg
                       [&::-moz-range-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${switchPercentage}%, #e2e8f0 ${switchPercentage}%, #e2e8f0 100%)`,
            }}
          />
        </div>

        <div className="flex justify-between text-sm text-slate-500">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>

        <p className="text-sm text-slate-600 mt-2">
          Adjust the slider to estimate savings based on the percentage of patients who could
          switch from IV to oral therapy.
        </p>
      </div>
    </div>
  )
}
