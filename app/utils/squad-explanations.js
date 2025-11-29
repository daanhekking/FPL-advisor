/**
 * Generate extensive explanations for squad selections
 * These functions create detailed, human-readable explanations for why players are selected/benched
 */

/**
 * Helper to get fixture description
 */
const getFixturesSummary = (fixtures) => {
  if (!fixtures || fixtures.length === 0) return 'no upcoming fixtures'
  
  const next3 = fixtures.slice(0, 3)
  const opponents = next3.map(f => `${f.isHome ? 'vs' : '@'}${f.opponent}(${f.difficulty})`).join(', ')
  const avgDiff = (next3.reduce((sum, f) => sum + f.difficulty, 0) / next3.length).toFixed(1)
  
  return `next 3: ${opponents} (avg ${avgDiff})`
}

/**
 * Helper to analyze form trend
 */
const getFormAnalysis = (form) => {
  const formValue = parseFloat(form || 0)
  if (formValue >= 6.0) return { label: 'exceptional', color: 'excellent' }
  if (formValue >= 5.0) return { label: 'excellent', color: 'great' }
  if (formValue >= 4.0) return { label: 'good', color: 'good' }
  if (formValue >= 3.0) return { label: 'average', color: 'average' }
  if (formValue >= 2.0) return { label: 'poor', color: 'poor' }
  return { label: 'very poor', color: 'verypoor' }
}

/**
 * Helper to calculate points per million
 */
const getValueMetric = (totalPoints, price) => {
  if (!price || price === 0) return 0
  return (totalPoints / price).toFixed(1)
}

/**
 * Generate extensive goalkeeper explanation
 */
export const generateGKPExplanation = (gkpPlayers) => {
  const starting = gkpPlayers.find(p => !p.isBenched && !p.isBeingSold)
  const benched = gkpPlayers.find(p => p.isBenched || (!starting && p))
  
  if (!starting) return 'No goalkeeper information available.'
  
  const startingFixDiff = starting.fixtures?.[0]?.difficulty || 3
  const startingForm = parseFloat(starting.form || 0)
  const startingPoints = starting.totalPoints || 0
  const startingPrice = (starting.now_cost || 0) / 10
  const startingCleanSheets = starting.clean_sheets || 0
  const startingMinutes = starting.minutes || 0
  const startingTeam = starting.team?.name || 'Unknown Team'
  const startingNextOpponent = starting.fixtures?.[0] ? 
    `${starting.fixtures[0].isHome ? 'vs' : '@'} ${starting.fixtures[0].opponent}` : 
    'TBD'
  
  let explanation = `🥅 **${starting.web_name}** (${startingTeam}) is your starting goalkeeper. `
  
  // Starting GK detailed analysis
  const startReasons = []
  
  // Form analysis
  const formAnalysis = getFormAnalysis(startingForm)
  startReasons.push(`${formAnalysis.label} form of ${startingForm.toFixed(1)}`)
  
  // Fixture analysis
  if (startingFixDiff <= 2) {
    startReasons.push(`favorable next fixture (${startingNextOpponent}, difficulty ${startingFixDiff}) with strong clean sheet potential`)
  } else if (startingFixDiff === 3) {
    startReasons.push(`moderate next fixture (${startingNextOpponent}, difficulty ${startingFixDiff})`)
  } else {
    startReasons.push(`challenging next fixture (${startingNextOpponent}, difficulty ${startingFixDiff})`)
  }
  
  // Season performance
  if (startingPoints > 80) {
    startReasons.push(`strong season performance with ${startingPoints} total points`)
  } else if (startingPoints > 50) {
    startReasons.push(`solid ${startingPoints} points this season`)
  }
  
  // Clean sheets
  if (startingCleanSheets > 8) {
    startReasons.push(`${startingCleanSheets} clean sheets (elite)`)
  } else if (startingCleanSheets > 5) {
    startReasons.push(`${startingCleanSheets} clean sheets`)
  }
  
  // Minutes played (reliability)
  const gamesPlayed = Math.floor(startingMinutes / 90)
  if (gamesPlayed >= 10) {
    startReasons.push(`reliable starter (${gamesPlayed} full games)`)
  }
  
  // Value
  const valueMetric = getValueMetric(startingPoints, startingPrice)
  if (valueMetric > 15) {
    startReasons.push(`excellent value at £${startingPrice.toFixed(1)}m (${valueMetric} pts/£)`)
  }
  
  // New transfer
  if (starting.isNew) {
    startReasons.push(`🆕 NEW TRANSFER - brought in this gameweek`)
  }
  
  explanation += `Selected for: ${startReasons.join('; ')}. `
  
  // Fixture run analysis
  if (starting.fixtures && starting.fixtures.length >= 3) {
    const next3Avg = (starting.fixtures.slice(0, 3).reduce((sum, f) => sum + f.difficulty, 0) / 3).toFixed(1)
    if (next3Avg <= 2.5) {
      explanation += `🎯 Excellent fixture run ahead (avg difficulty ${next3Avg} over next 3 gameweeks) - expect multiple clean sheets. `
    } else if (next3Avg <= 3.5) {
      explanation += `Next 3 gameweeks show moderate fixtures (avg ${next3Avg}). `
    } else {
      explanation += `⚠️ Tough fixture run ahead (avg difficulty ${next3Avg}). `
    }
  }
  
  // Bench GK analysis
  if (benched && benched !== starting) {
    const benchPrice = (benched.now_cost || 0) / 10
    const benchPoints = benched.totalPoints || 0
    const benchForm = parseFloat(benched.form || 0)
    
    explanation += `| **Bench:** ${benched.web_name} (${benched.team?.name || 'Unknown'}) - `
    
    const benchReasons = []
    
    if (benched.isBeingSold) {
      benchReasons.push('🔄 being transferred out this gameweek')
    } else {
      // Why benched
      if (benchForm < startingForm - 0.5) {
        benchReasons.push(`lower form (${benchForm.toFixed(1)} vs ${startingForm.toFixed(1)})`)
      }
      
      const benchFixDiff = benched.fixtures?.[0]?.difficulty || 3
      if (benchFixDiff > startingFixDiff) {
        benchReasons.push(`harder fixture (${benchFixDiff} vs ${startingFixDiff})`)
      }
      
      if (benchPoints < startingPoints - 15) {
        benchReasons.push(`fewer season points (${benchPoints} vs ${startingPoints})`)
      }
      
      if (benchReasons.length === 0) {
        benchReasons.push(`rotation option at £${benchPrice.toFixed(1)}m`)
      }
    }
    
    explanation += benchReasons.join('; ') + '.'
  }
  
  return explanation
}

/**
 * Generate extensive outfield player explanation
 */
export const generateOutfieldExplanation = (positionPlayers, positionName) => {
  const starting = positionPlayers.filter(p => !p.isBenched && !p.isBeingSold)
  const benched = positionPlayers.filter(p => p.isBenched && !p.isBeingSold)
  const beingSold = positionPlayers.filter(p => p.isBeingSold)
  
  let explanation = ''
  
  // STARTING PLAYERS - Detailed Analysis
  if (starting.length > 0) {
    const plural = starting.length > 1 ? 's' : ''
    explanation += `⭐ **Starting ${starting.length} ${positionName.toLowerCase()}${plural}:** `
    
    // Individual player analysis
    starting.forEach((player, idx) => {
      if (idx > 0) explanation += ' | '
      
      const form = parseFloat(player.form || 0)
      const points = player.totalPoints || 0
      const price = (player.now_cost || 0) / 10
      const minutes = player.minutes || 0
      const nextFixture = player.fixtures?.[0]
      const nextFixDiff = nextFixture?.difficulty || 3
      const nextOpponent = nextFixture ? `${nextFixture.isHome ? 'vs' : '@'}${nextFixture.opponent}` : 'TBD'
      const goals = player.goals_scored || 0
      const assists = player.assists || 0
      const cleanSheets = player.clean_sheets || 0
      
      const formAnalysis = getFormAnalysis(form)
      const valueMetric = getValueMetric(points, price)
      const gamesPlayed = Math.floor(minutes / 90)
      
      explanation += `**${player.web_name}** (${player.team?.short_name || '?'}, £${price.toFixed(1)}m) - `
      
      const playerReasons = []
      
      // Form with context
      if (form >= 5.0) {
        playerReasons.push(`🔥 ${formAnalysis.label} form (${form.toFixed(1)}) - in great shape`)
      } else if (form >= 4.0) {
        playerReasons.push(`good form (${form.toFixed(1)})`)
      } else if (form >= 3.0) {
        playerReasons.push(`average form (${form.toFixed(1)})`)
      } else {
        playerReasons.push(`⚠️ struggling form (${form.toFixed(1)})`)
      }
      
      // Attacking output (MID/FWD) or Defensive output (DEF)
      if (positionName === 'Defenders') {
        if (cleanSheets >= 8) {
          playerReasons.push(`elite defender (${cleanSheets} clean sheets)`)
        } else if (cleanSheets >= 5) {
          playerReasons.push(`${cleanSheets} clean sheets`)
        }
        
        if (goals + assists >= 3) {
          playerReasons.push(`attacking threat (${goals}G, ${assists}A)`)
        }
      } else {
        // Midfielders and Forwards
        if (goals >= 10) {
          playerReasons.push(`prolific scorer (${goals} goals)`)
        } else if (goals >= 5) {
          playerReasons.push(`${goals} goals`)
        }
        
        if (assists >= 5) {
          playerReasons.push(`${assists} assists`)
        }
        
        if (goals + assists >= 12) {
          playerReasons.push(`🎯 top performer (${goals}G + ${assists}A)`)
        }
      }
      
      // Fixture analysis
      if (nextFixDiff <= 2) {
        playerReasons.push(`favorable fixture ${nextOpponent} (${nextFixDiff}) - high points potential`)
      } else if (nextFixDiff === 3) {
        playerReasons.push(`moderate fixture ${nextOpponent}`)
      } else {
        playerReasons.push(`challenging fixture ${nextOpponent} (${nextFixDiff})`)
      }
      
      // Season performance
      if (points > 120) {
        playerReasons.push(`elite season (${points} pts, top tier)`)
      } else if (points > 80) {
        playerReasons.push(`strong season (${points} pts)`)
      } else if (points > 50) {
        playerReasons.push(`${points} pts`)
      }
      
      // Value assessment
      if (valueMetric > 20) {
        playerReasons.push(`outstanding value (${valueMetric} pts/£)`)
      } else if (valueMetric > 16) {
        playerReasons.push(`great value (${valueMetric} pts/£)`)
      }
      
      // Reliability
      if (gamesPlayed >= 12) {
        playerReasons.push(`nailed starter (${gamesPlayed} full games)`)
      } else if (gamesPlayed < 8 && gamesPlayed >= 3) {
        playerReasons.push(`rotation concern (${gamesPlayed} games)`)
      }
      
      // New transfer
      if (player.isNew) {
        playerReasons.push(`🆕 NEW TRANSFER THIS GW`)
      }
      
      explanation += playerReasons.join('; ')
    })
    
    explanation += '. '
    
    // Group-level analysis
    const avgForm = starting.reduce((sum, p) => sum + parseFloat(p.form || 0), 0) / starting.length
    const totalPoints = starting.reduce((sum, p) => sum + (p.totalPoints || 0), 0)
    const avgFixtureDiff = starting.reduce((sum, p) => {
      const nextDiff = p.fixtures?.[0]?.difficulty || 3
      return sum + nextDiff
    }, 0) / starting.length
    const totalGoals = starting.reduce((sum, p) => sum + (p.goals_scored || 0), 0)
    const totalAssists = starting.reduce((sum, p) => sum + (p.assists || 0), 0)
    const totalCleanSheets = starting.reduce((sum, p) => sum + (p.clean_sheets || 0), 0)
    
    explanation += `📊 **Group Analysis:** `
    explanation += `Average form ${avgForm.toFixed(1)}, `
    explanation += `combined ${totalPoints} points, `
    
    if (positionName === 'Defenders') {
      explanation += `${totalCleanSheets} clean sheets total, `
    } else {
      explanation += `${totalGoals} goals + ${totalAssists} assists, `
    }
    
    explanation += `avg next fixture difficulty ${avgFixtureDiff.toFixed(1)}. `
    
    // Tactical assessment
    if (avgFixtureDiff <= 2.5 && avgForm >= 4.5) {
      explanation += `🚀 **Verdict:** Elite attacking potential this gameweek - captain candidate${starting.length > 1 ? 's' : ''} in this group. `
    } else if (avgFixtureDiff <= 2.5) {
      explanation += `✅ **Verdict:** Good fixtures favor this group - expect solid returns. `
    } else if (avgFixtureDiff >= 4.0) {
      explanation += `⚠️ **Verdict:** Tough fixtures - temper expectations, consider bench boost if multiple difficult matchups. `
    } else {
      explanation += `**Verdict:** Solid setup for this gameweek. `
    }
  }
  
  // BENCHED PLAYERS - Individual Analysis
  if (benched.length > 0) {
    explanation += `| 🪑 **Bench Details:** `
    
    benched.forEach((player, idx) => {
      if (idx > 0) explanation += '; '
      
      const form = parseFloat(player.form || 0)
      const points = player.totalPoints || 0
      const price = (player.now_cost || 0) / 10
      const minutes = player.minutes || 0
      const nextFixture = player.fixtures?.[0]
      const nextFixDiff = nextFixture?.difficulty || 3
      const gamesPlayed = Math.floor(minutes / 90)
      
      explanation += `**${player.web_name}** (£${price.toFixed(1)}m, ${points} pts) - `
      
      const benchReasons = []
      
      // Why benched
      if (form < 2.5) {
        benchReasons.push(`very poor form (${form.toFixed(1)})`)
      } else if (form < 3.5) {
        benchReasons.push(`below average form (${form.toFixed(1)})`)
      }
      
      if (nextFixDiff >= 4) {
        const opponent = nextFixture ? `${nextFixture.isHome ? 'vs' : '@'}${nextFixture.opponent}` : 'TBD'
        benchReasons.push(`tough matchup ${opponent} (${nextFixDiff})`)
      }
      
      if (gamesPlayed < 5) {
        benchReasons.push(`limited minutes (${gamesPlayed} games)`)
      }
      
      if (points < 30 && gamesPlayed >= 5) {
        benchReasons.push(`underperforming (${points} pts in ${gamesPlayed} games)`)
      }
      
      // If decent player, explain competitive situation
      if (benchReasons.length === 0 && form >= 3.5) {
        benchReasons.push(`good player but stronger starting options available`)
      }
      
      if (benchReasons.length === 0) {
        benchReasons.push(`backup option`)
      }
      
      explanation += benchReasons.join(', ')
    })
    
    explanation += '. '
    
    // Bench quality assessment
    const avgBenchForm = benched.reduce((sum, p) => sum + parseFloat(p.form || 0), 0) / benched.length
    if (avgBenchForm >= 4.0) {
      explanation += `💪 **Bench Strength:** Strong bench with avg form ${avgBenchForm.toFixed(1)} - good depth if starting players blank. `
    } else if (avgBenchForm < 2.5) {
      explanation += `⚠️ **Bench Weakness:** Weak bench (avg form ${avgBenchForm.toFixed(1)}) - consider upgrading bench quality when possible. `
    }
  }
  
  // TRANSFER OUT ANALYSIS
  if (beingSold.length > 0) {
    explanation += `| 🔄 **Transfer Strategy:** Selling ${beingSold.map(p => p.web_name).join(', ')} to `
    
    const sellReasons = []
    beingSold.forEach(player => {
      const form = parseFloat(player.form || 0)
      const availability = player.chance_of_playing_next_round
      const fixtures = player.fixtures || []
      const avgNext3 = fixtures.length >= 3 ?
        (fixtures.slice(0, 3).reduce((sum, f) => sum + f.difficulty, 0) / 3).toFixed(1) :
        null
      
      if (availability !== null && availability < 75) {
        sellReasons.push('injury concerns')
      }
      if (form < 3.0) {
        sellReasons.push('poor form')
      }
      if (avgNext3 && avgNext3 >= 4.0) {
        sellReasons.push('bad fixture run')
      }
    })
    
    if (sellReasons.length > 0) {
      explanation += `address ${sellReasons.join(', ')}. `
    } else {
      explanation += `free up funds for better options. `
    }
    
    explanation += `The incoming player(s) should provide better points potential. `
  }
  
  return explanation || `${positionName} selection optimized for this gameweek.`
}

/**
 * Generate extensive transfer explanations
 */
export const generateTransferExplanations = (suggestedTransfers) => {
  return suggestedTransfers.map((transfer, idx) => {
    const outForm = parseFloat(transfer.out.form || 0)
    const inForm = parseFloat(transfer.in.form || 0)
    const outFixtures = transfer.out.fixtures || []
    const inFixtures = transfer.in.fixtures || []
    const outNextDiff = outFixtures[0]?.difficulty || 3
    const inNextDiff = inFixtures[0]?.difficulty || 3
    const outPrice = transfer.out.now_cost / 10
    const inPrice = transfer.in.now_cost / 10
    const outPoints = transfer.out.total_points || 0
    const inPoints = transfer.in.total_points || 0
    const outGoals = transfer.out.goals_scored || 0
    const outAssists = transfer.out.assists || 0
    const inGoals = transfer.in.goals_scored || 0
    const inAssists = transfer.in.assists || 0
    
    let reason = ''
    
    // SELLING ANALYSIS
    reason += `📤 **Selling ${transfer.out.web_name}** (${transfer.out.team?.short_name || '?'}, £${outPrice.toFixed(1)}m, ${outPoints} pts) because: `
    
    const sellReasons = []
    
    // Injury/availability (priority)
    if (transfer.out.chance_of_playing_next_round !== null && transfer.out.chance_of_playing_next_round < 75) {
      sellReasons.push(`⚠️ injury/availability concern (only ${transfer.out.chance_of_playing_next_round}% likely to play)`)
    }
    
    // Poor form
    if (outForm < 3.0) {
      const formAnalysis = getFormAnalysis(outForm)
      sellReasons.push(`${formAnalysis.label} form of ${outForm.toFixed(1)} - not performing`)
    } else if (outForm < 4.0) {
      sellReasons.push(`below par form (${outForm.toFixed(1)})`)
    }
    
    // Difficult fixtures
    if (outFixtures.length >= 3) {
      const next3Avg = (outFixtures.slice(0, 3).reduce((sum, f) => sum + f.difficulty, 0) / 3).toFixed(1)
      if (next3Avg >= 4.0) {
        sellReasons.push(`very difficult upcoming fixtures (avg ${next3Avg} over next 3 gameweeks)`)
      } else if (outNextDiff >= 4) {
        sellReasons.push(`tough immediate fixture (difficulty ${outNextDiff})`)
      }
    }
    
    // Low output
    const outOutput = outGoals + outAssists
    if (outOutput < 2 && outPoints < 40) {
      sellReasons.push(`minimal attacking returns (${outGoals}G, ${outAssists}A)`)
    }
    
    // Default reason
    if (sellReasons.length === 0) {
      sellReasons.push(`upgrading to a better option`)
    }
    
    reason += sellReasons.join('; ') + '. '
    
    // BUYING ANALYSIS
    reason += `📥 **Buying ${transfer.in.web_name}** (${transfer.in.team?.short_name || '?'}, £${inPrice.toFixed(1)}m, ${inPoints} pts) because: `
    
    const buyReasons = []
    
    // Form
    const inFormAnalysis = getFormAnalysis(inForm)
    if (inForm >= 5.5) {
      buyReasons.push(`🔥 exceptional form (${inForm.toFixed(1)}) - red hot right now`)
    } else if (inForm >= 5.0) {
      buyReasons.push(`excellent form (${inForm.toFixed(1)}) - top performer`)
    } else if (inForm >= 4.0) {
      buyReasons.push(`good form (${inForm.toFixed(1)}) - reliable returns`)
    } else if (inForm >= 3.0) {
      buyReasons.push(`decent form (${inForm.toFixed(1)})`)
    }
    
    // Fixtures
    if (inFixtures.length >= 3) {
      const next3Avg = (inFixtures.slice(0, 3).reduce((sum, f) => sum + f.difficulty, 0) / 3).toFixed(1)
      const easyCount = inFixtures.slice(0, 5).filter(f => f.difficulty <= 2).length
      
      if (next3Avg <= 2.0) {
        buyReasons.push(`🎯 excellent fixture run (avg ${next3Avg} over next 3, including ${easyCount} easy fixtures in next 5) - prime for hauling`)
      } else if (next3Avg <= 2.5) {
        buyReasons.push(`favorable fixtures ahead (avg ${next3Avg})`)
      } else if (inNextDiff <= 2) {
        buyReasons.push(`easy immediate fixture (${inNextDiff})`)
      } else if (next3Avg === 3) {
        buyReasons.push(`moderate fixtures (avg ${next3Avg})`)
      }
    }
    
    // Season performance comparison
    if (inPoints > outPoints + 30) {
      buyReasons.push(`significantly outperforming the player being sold (${inPoints} pts vs ${outPoints} pts, +${inPoints - outPoints} difference)`)
    } else if (inPoints > outPoints + 15) {
      buyReasons.push(`better season performance (${inPoints} pts vs ${outPoints} pts)`)
    } else if (inPoints > outPoints) {
      buyReasons.push(`slight edge in points (${inPoints} vs ${outPoints})`)
    }
    
    // Attacking output
    const inOutput = inGoals + inAssists
    if (inOutput >= 12) {
      buyReasons.push(`excellent attacking output (${inGoals}G + ${inAssists}A)`)
    } else if (inOutput >= 6) {
      buyReasons.push(`solid returns (${inGoals}G + ${inAssists}A)`)
    }
    
    // Value metric
    const inValue = getValueMetric(inPoints, inPrice)
    const outValue = getValueMetric(outPoints, outPrice)
    if (inValue > outValue + 3) {
      buyReasons.push(`better value for money (${inValue} pts/£ vs ${outValue} pts/£)`)
    }
    
    // Price consideration
    if (inPrice < outPrice) {
      buyReasons.push(`💰 saves £${(outPrice - inPrice).toFixed(1)}m for future transfers`)
    } else if (inPrice > outPrice + 2) {
      buyReasons.push(`premium upgrade (costs £${(inPrice - outPrice).toFixed(1)}m more but worth it)`)
    } else if (inPrice > outPrice) {
      buyReasons.push(`costs £${(inPrice - outPrice).toFixed(1)}m more`)
    }
    
    reason += buyReasons.join('; ') + '. '
    
    // EXPECTED IMPACT
    reason += `📈 **Expected Impact:** `
    const pointsDiff = inPoints - outPoints
    const formDiff = inForm - outForm
    
    if (pointsDiff > 30 && formDiff > 2) {
      reason += `Significant upgrade - should deliver strong returns. `
    } else if (formDiff > 2) {
      reason += `Form upgrade should improve gameweek scores. `
    } else if (inNextDiff <= 2 && outNextDiff >= 4) {
      reason += `Fixture upgrade gives better points ceiling this week. `
    } else {
      reason += `Improves overall squad strength. `
    }
    
    return { index: idx + 1, reason }
  })
}
