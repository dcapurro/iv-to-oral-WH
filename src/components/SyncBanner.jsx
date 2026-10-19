import { AlertCircle, Loader2, HardDrive } from 'lucide-react'
import { useMedication } from '../context/MedicationContext'

// Surfaces the state of the connection to the shared database, so a failed save
// is never silent and a local-only session is never mistaken for a saved one.
export default function SyncBanner() {
  const { syncStatus, syncError, isSupabaseConfigured } = useMedication()

  if (!isSupabaseConfigured) {
    return (
      <div className="flex items-center gap-2 text-amber-800 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg mb-6 text-sm">
        <HardDrive className="w-4 h-4 flex-shrink-0" />
        <span>
          <strong>Not connected to the database.</strong> Data is being saved in
          this browser only, and will not be visible on other devices.
        </span>
      </div>
    )
  }

  if (syncStatus === 'loading') {
    return (
      <div className="flex items-center gap-2 text-slate-600 bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg mb-6 text-sm">
        <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
        <span>Loading data…</span>
      </div>
    )
  }

  if (syncStatus === 'error') {
    return (
      <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>
          <strong>Database error.</strong> {syncError} Recent changes may not
          have been saved — reload the page to try again.
        </span>
      </div>
    )
  }

  return null
}
