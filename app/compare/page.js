'use client'

import { useState, useEffect } from 'react'

export default function ComparePlayer() {
  const [allPlayers, setAllPlayers] = useState([])
  const [player1Name, setPlayer1Name] = useState('')
  const [player2Name, setPlayer2Name] = useState('')
  const [player1Data, setPlayer1Data] = useState(null)
  const [player2Data, setPlayer2Data] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPlayersData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPlayersData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/fpl/bootstrap')
      const data = await response.json()
      
      const playersWithTeams = data.elements.map(player => {
        const team = data.teams.find(t => t.id === player.team)
        return {
          ...player,
          fullName: `${player.first_name} ${player.second_name}`,
          teamName: team?.short_name || 'Unknown',
          position: getPositionName(player.element_type)
        }
      })
      
      setAllPlayers(playersWithTeams)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching players:', err)
      setError('Failed to load player data')
      setLoading(false)
    }
  }

  const getPositionName = (elementType) => {
    const positions = {
      1: 'Goalkeeper',
      2: 'Defender',
      3: 'Midfielder',
      4: 'Forward'
    }
    return positions[elementType] || 'Unknown'
  }

  const findPlayer = (name) => {
    if (!name) return null
    const searchName = name.toLowerCase()
    return allPlayers.find(p => 
      p.fullName.toLowerCase().includes(searchName) ||
      p.second_name.toLowerCase().includes(searchName)
    )
  }

  const handleCompare = () => {
    const p1 = findPlayer(player1Name)
    const p2 = findPlayer(player2Name)
    
    setPlayer1Data(p1)
    setPlayer2Data(p2)
  }

  const getSuggestions = (inputValue) => {
    if (!inputValue || inputValue.length < 2) return []
    const searchName = inputValue.toLowerCase()
    return allPlayers
      .filter(p => 
        p.fullName.toLowerCase().includes(searchName) ||
        p.second_name.toLowerCase().includes(searchName)
      )
      .slice(0, 5)
  }

  const PlayerCard = ({ player, playerNumber }) => {
    if (!player) {
      return (
        <div className="bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-400 text-lg">
            {playerNumber === 1 ? 'Select first player' : 'Select second player'}
          </p>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-[#37003c] text-white px-6 py-4">
          <h3 className="text-2xl font-bold">{player.fullName}</h3>
          <p className="text-sm opacity-80">{player.teamName} • {player.position}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-xs text-gray-600 mb-1">Total Points</p>
              <p className="text-3xl font-bold text-[#37003c]">{player.total_points}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-xs text-gray-600 mb-1">Price</p>
              <p className="text-3xl font-bold text-[#37003c]">£{(player.now_cost / 10).toFixed(1)}m</p>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Goals</span>
              <span className="text-xl font-semibold text-gray-900">{player.goals_scored}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Assists</span>
              <span className="text-xl font-semibold text-gray-900">{player.assists}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Form</span>
              <span className="text-xl font-semibold text-gray-900">{player.form}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Selected by</span>
              <span className="text-xl font-semibold text-gray-900">{player.selected_by_percent}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Minutes Played</span>
              <span className="text-xl font-semibold text-gray-900">{player.minutes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Clean Sheets</span>
              <span className="text-xl font-semibold text-gray-900">{player.clean_sheets}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bonus Points</span>
              <span className="text-xl font-semibold text-gray-900">{player.bonus}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#37003c]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold mb-2">Error</p>
        <p>{error}</p>
        <button 
          onClick={fetchPlayersData}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Compare Players</h2>
        <p className="text-gray-600">Enter player names to compare their statistics</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Player 1
            </label>
            <input
              type="text"
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              placeholder="e.g. Haaland, Salah"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#37003c] focus:border-transparent"
            />
            {player1Name.length >= 2 && (
              <div className="mt-2 bg-gray-50 rounded border border-gray-200 max-h-40 overflow-y-auto">
                {getSuggestions(player1Name).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setPlayer1Name(p.fullName)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    <span className="font-medium">{p.fullName}</span>
                    <span className="text-gray-500 ml-2">({p.teamName})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Player 2
            </label>
            <input
              type="text"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              placeholder="e.g. Kane, Son"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#37003c] focus:border-transparent"
            />
            {player2Name.length >= 2 && (
              <div className="mt-2 bg-gray-50 rounded border border-gray-200 max-h-40 overflow-y-auto">
                {getSuggestions(player2Name).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setPlayer2Name(p.fullName)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    <span className="font-medium">{p.fullName}</span>
                    <span className="text-gray-500 ml-2">({p.teamName})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleCompare}
          className="w-full bg-[#37003c] text-white py-3 rounded-lg font-semibold hover:bg-[#ff2882] transition"
        >
          Compare Players
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlayerCard player={player1Data} playerNumber={1} />
        <PlayerCard player={player2Data} playerNumber={2} />
      </div>

      {player1Data && player2Data && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Comparison</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-2">Better Points</p>
              <p className="text-lg font-bold text-[#37003c]">
                {player1Data.total_points > player2Data.total_points 
                  ? player1Data.web_name 
                  : player2Data.web_name}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-2">Better Value</p>
              <p className="text-lg font-bold text-[#37003c]">
                {(player1Data.total_points / player1Data.now_cost) > (player2Data.total_points / player2Data.now_cost)
                  ? player1Data.web_name 
                  : player2Data.web_name}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-2">Better Form</p>
              <p className="text-lg font-bold text-[#37003c]">
                {parseFloat(player1Data.form) > parseFloat(player2Data.form)
                  ? player1Data.web_name 
                  : player2Data.web_name}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-2">More Popular</p>
              <p className="text-lg font-bold text-[#37003c]">
                {parseFloat(player1Data.selected_by_percent) > parseFloat(player2Data.selected_by_percent)
                  ? player1Data.web_name 
                  : player2Data.web_name}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

