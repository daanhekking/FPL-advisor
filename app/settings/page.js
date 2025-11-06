'use client'

import { useState, useEffect } from 'react'

export default function Settings() {
  const [teamId, setTeamId] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load team ID from localStorage
    const savedTeamId = localStorage.getItem('fplTeamId')
    if (savedTeamId) {
      setTeamId(savedTeamId)
    }
  }, [])

  const handleSave = () => {
    if (teamId) {
      localStorage.setItem('fplTeamId', teamId)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your FPL Team ID
            </label>
            <input
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="e.g. 7535279"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#37003c] focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-600">
              You can find your Team ID in the URL when viewing your team on the FPL website.
              <br />
              Example: <code className="bg-gray-100 px-2 py-1 rounded">fantasy.premierleague.com/entry/<strong>7535279</strong>/event/10</code>
            </p>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-[#37003c] text-white py-3 rounded-lg font-semibold hover:bg-[#ff2882] transition"
          >
            Save Settings
          </button>

          {saved && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="font-semibold">✓ Settings saved successfully!</p>
              <p className="text-sm">Refresh the page to see your team.</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">How to use FPL Advisor</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Enter your FPL Team ID above and save</li>
            <li>Go to "My Team" to see your squad and AI recommendations</li>
            <li>Check "Fixtures" to plan for upcoming gameweeks</li>
            <li>Use "Compare" to evaluate transfer options side-by-side</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

