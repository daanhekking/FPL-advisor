export const generateChipStrategy = (history, myTeam, upcomingFixtures) => {
    const chips = history?.chips || []
    const usedChips = new Set(chips.map(c => c.name))

    const currentEvent = myTeam?.current_event || 1
    const RESET_GW = 19

    const strategy = []

    // Helper to check if chip is used
    const isUsed = (chipName) => usedChips.has(chipName)

    // Phase 1: Pre-GW19 (First set of chips)
    if (currentEvent <= RESET_GW) {
        if (!isUsed('wildcard')) {
            // If we are close to GW19, force usage
            const weeksLeft = RESET_GW - currentEvent
            const suggestedGW = weeksLeft > 2 ? currentEvent + 2 : currentEvent + 1

            strategy.push({
                chip: 'Wildcard 1',
                suggestedGW: Math.min(suggestedGW, RESET_GW),
                reason: weeksLeft < 3 ? 'URGENT - Must use before GW19 reset!' : 'Must use before GW19 reset',
                urgent: weeksLeft < 3,
                phase: 1
            })
        }
        
        // Triple Captain (First Half)
        if (!isUsed('3xc')) {
            strategy.push({
                chip: 'Triple Captain',
                suggestedGW: Math.min(currentEvent + 3, RESET_GW),
                reason: 'Use on premium player with excellent fixture',
                phase: 1
            })
        }
        
        // Bench Boost (First Half)
        if (!isUsed('benchboost')) {
            strategy.push({
                chip: 'Bench Boost',
                suggestedGW: Math.min(currentEvent + 5, RESET_GW),
                reason: 'When your full squad has good fixtures',
                phase: 1
            })
        }
        
        // Free Hit (First Half)
        if (!isUsed('freehit')) {
            strategy.push({
                chip: 'Free Hit',
                suggestedGW: Math.min(currentEvent + 4, RESET_GW),
                reason: 'Navigate blank or difficult gameweek',
                phase: 1
            })
        }
        
        // Add info about reset
        strategy.push({
            chip: '🔄 CHIP RESET',
            suggestedGW: RESET_GW,
            reason: 'All chips reset at GW19! You get a fresh set for the second half of the season.',
            isInfo: true,
            phase: 1
        })
    }

    // Only show Phase 2 chips if we're past GW19
    if (currentEvent > RESET_GW) {
        // Phase 2: Post-GW19 (Second set of chips)
        const wcUsed = chips.find(c => c.name === 'wildcard' && c.event >= RESET_GW)

        if (!wcUsed) {
            strategy.push({
                chip: 'Wildcard 2',
                suggestedGW: 30, // Late season swing
                reason: 'Refresh team for final run-in',
                phase: 2
            })
        }
        
        // Check second-half chip usage
        const phase2UsedChips = new Set(
            chips.filter(c => c.event >= RESET_GW).map(c => c.name)
        )
        
        // Free Hit (Second Half)
        if (!phase2UsedChips.has('freehit')) {
            strategy.push({
                chip: 'Free Hit 2',
                suggestedGW: 29, // Classic big blank GW
                reason: 'Navigate blank gameweek',
                phase: 2
            })
        }

        // Bench Boost (Second Half)
        if (!phase2UsedChips.has('benchboost')) {
            strategy.push({
                chip: 'Bench Boost 2',
                suggestedGW: 37, // Late Double GW
                reason: 'Maximize points in big Double Gameweek',
                phase: 2
            })
        }

        // Triple Captain (Second Half)
        if (!phase2UsedChips.has('3xc')) {
            strategy.push({
                chip: 'Triple Captain 2',
                suggestedGW: 34, // Often a DGW
                reason: 'Premium asset Double Gameweek',
                phase: 2
            })
        }
    }

    return strategy
        .filter(item => item.suggestedGW <= (currentEvent <= RESET_GW ? RESET_GW : 38))
        .sort((a, b) => a.suggestedGW - b.suggestedGW)
}
