export const generateChipStrategy = (history, myTeam, upcomingFixtures) => {
    const chips = history?.chips || []
    const usedChips = new Set(chips.map(c => c.name))

    const currentEvent = myTeam?.current_event || 1
    const RESET_GW = 19

    const strategy = []

    // Helper to check if chip is used
    const isUsed = (chipName) => usedChips.has(chipName)

    // Phase 1: Pre-GW19 (Wildcard 1 must be used)
    if (currentEvent < RESET_GW) {
        if (!isUsed('wildcard')) {
            // If we are close to GW19, force usage
            const weeksLeft = RESET_GW - currentEvent
            const suggestedGW = weeksLeft > 2 ? currentEvent + 2 : currentEvent + 1

            strategy.push({
                chip: 'Wildcard 1',
                suggestedGW: suggestedGW,
                reason: 'Must use before GW19 reset',
                urgent: weeksLeft < 3
            })
        }
    } else {
        // Phase 2: Post-GW19 (Wildcard 2 available)
        // Note: We need to check if WC2 is used. The API calls it 'wildcard' too, 
        // but we can infer based on the 'time' it was used. 
        // For simplicity, if we are past GW19 and 'wildcard' is in history, 
        // we need to check if it was used AFTER GW19.
        const wcUsed = chips.find(c => c.name === 'wildcard' && c.event >= RESET_GW)

        if (!wcUsed) {
            strategy.push({
                chip: 'Wildcard 2',
                suggestedGW: 30, // Late season swing
                reason: 'Refresh for final run-in'
            })
        }
    }

    // Other Chips (Available all season, but usually best in DGWs)

    // Free Hit
    if (!isUsed('freehit')) {
        strategy.push({
            chip: 'Free Hit',
            suggestedGW: 29, // Classic big blank GW
            reason: 'Navigate blank gameweek'
        })
    }

    // Bench Boost
    if (!isUsed('benchboost')) {
        strategy.push({
            chip: 'Bench Boost',
            suggestedGW: 37, // Late Double GW
            reason: 'Maximize points in big Double Gameweek'
        })
    }

    // Triple Captain
    if (!isUsed('3xc')) {
        strategy.push({
            chip: 'Triple Captain',
            suggestedGW: 25, // Often a DGW (e.g. City/Liverpool)
            reason: 'Premium asset Double Gameweek'
        })
    }

    return strategy.sort((a, b) => a.suggestedGW - b.suggestedGW)
}
