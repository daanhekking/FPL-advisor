export const generateChipStrategy = (history, myTeam, upcomingFixtures) => {
    const chips = history?.chips || []
    const usedChips = new Set(chips.map(c => c.name))

    const currentEvent = myTeam?.current_event || 1
    const RESET_GW = 19

    const strategy = []
    const assignedGWs = new Set()

    // Helper to check if chip is used
    const isUsed = (chipName) => usedChips.has(chipName)

    // Helper to find a unique GW for a chip
    const getUniqueGW = (preferred, limit, min) => {
        let gw = preferred
        // Try forward
        while (assignedGWs.has(gw) && gw <= limit) {
            gw++
        }
        if (gw <= limit && !assignedGWs.has(gw)) return gw

        // Try backward if forward failed
        gw = preferred - 1
        while (assignedGWs.has(gw) && gw >= min) {
            gw--
        }
        if (gw >= min && !assignedGWs.has(gw)) return gw

        return null // No available unique week
    }

    // Phase 1: Pre-GW19 (First set of chips)
    if (currentEvent <= RESET_GW) {
        if (!isUsed('wildcard')) {
            // If we are close to GW19, force usage
            const weeksLeft = RESET_GW - currentEvent
            const preferredGW = weeksLeft > 2 ? currentEvent + 2 : currentEvent + 1
            const finalGW = getUniqueGW(Math.min(preferredGW, RESET_GW), RESET_GW, currentEvent)

            if (finalGW !== null) {
                assignedGWs.add(finalGW)
                strategy.push({
                    chip: 'Wildcard 1',
                    suggestedGW: finalGW,
                    reason: weeksLeft < 3 ? 'URGENT - Must use before GW19 reset!' : 'Must use before GW19 reset',
                    urgent: weeksLeft < 3,
                    phase: 1
                })
            }
        }

        // Triple Captain (First Half)
        if (!isUsed('3xc')) {
            const finalGW = getUniqueGW(Math.min(currentEvent + 3, RESET_GW), RESET_GW, currentEvent)
            if (finalGW !== null) {
                assignedGWs.add(finalGW)
                strategy.push({
                    chip: 'Triple Captain',
                    suggestedGW: finalGW,
                    reason: 'Use on premium player with excellent fixture',
                    phase: 1
                })
            }
        }

        // Bench Boost (First Half)
        if (!isUsed('benchboost')) {
            const finalGW = getUniqueGW(Math.min(currentEvent + 5, RESET_GW), RESET_GW, currentEvent)
            if (finalGW !== null) {
                assignedGWs.add(finalGW)
                strategy.push({
                    chip: 'Bench Boost',
                    suggestedGW: finalGW,
                    reason: 'When your full squad has good fixtures',
                    phase: 1
                })
            }
        }

        // Free Hit (First Half)
        if (!isUsed('freehit')) {
            const finalGW = getUniqueGW(Math.min(currentEvent + 4, RESET_GW), RESET_GW, currentEvent)
            if (finalGW !== null) {
                assignedGWs.add(finalGW)
                strategy.push({
                    chip: 'Free Hit',
                    suggestedGW: finalGW,
                    reason: 'Navigate blank or difficult gameweek',
                    phase: 1
                })
            }
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
            const finalGW = getUniqueGW(30, 38, currentEvent)
            if (finalGW !== null) {
                assignedGWs.add(finalGW)
                strategy.push({
                    chip: 'Wildcard 2',
                    suggestedGW: finalGW,
                    reason: 'Refresh team for final run-in',
                    phase: 2
                })
            }
        }

        // Check second-half chip usage
        const phase2UsedChips = new Set(
            chips.filter(c => c.event >= RESET_GW).map(c => c.name)
        )

        // Free Hit (Second Half)
        if (!phase2UsedChips.has('freehit')) {
            const finalGW = getUniqueGW(29, 38, currentEvent)
            if (finalGW !== null) {
                assignedGWs.add(finalGW)
                strategy.push({
                    chip: 'Free Hit 2',
                    suggestedGW: finalGW,
                    reason: 'Navigate blank gameweek',
                    phase: 2
                })
            }
        }

        // Bench Boost (Second Half)
        if (!phase2UsedChips.has('benchboost')) {
            const finalGW = getUniqueGW(37, 38, currentEvent)
            if (finalGW !== null) {
                assignedGWs.add(finalGW)
                strategy.push({
                    chip: 'Bench Boost 2',
                    suggestedGW: finalGW,
                    reason: 'Maximize points in big Double Gameweek',
                    phase: 2
                })
            }
        }

        // Triple Captain (Second Half)
        if (!phase2UsedChips.has('3xc')) {
            const finalGW = getUniqueGW(34, 38, currentEvent)
            if (finalGW !== null) {
                assignedGWs.add(finalGW)
                strategy.push({
                    chip: 'Triple Captain 2',
                    suggestedGW: finalGW,
                    reason: 'Premium asset Double Gameweek',
                    phase: 2
                })
            }
        }
    }

    return strategy
        .filter(item => item.suggestedGW <= (currentEvent <= RESET_GW ? RESET_GW : 38))
        .sort((a, b) => a.suggestedGW - b.suggestedGW)
}
