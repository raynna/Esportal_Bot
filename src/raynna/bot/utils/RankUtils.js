function calculateRankAndPlacement(userData, gameType) {
    const rankNames = ['Legend', 'Pro II', 'Pro I', 'Elite II', 'Elite I', 'Master II', 'Master I', 'Veteran II', 'Veteran I', 'Gold II', 'Gold I', 'Silver'];
    const rankThresholds = {
        Legend: 2000,
        'Pro II': 1900,
        'Pro I': 1800,
        'Elite II': 1700,
        'Elite I': 1600,
        'Master II': 1500,
        'Master I': 1400,
        'Veteran II': 1300,
        'Veteran I': 1200,
        'Gold II': 1100,
        'Gold I': 1000,
        Silver: 0
    };

    const elo = userData.game_stats[gameType].elo;
    const rankLocked = userData.game_stats[gameType].rank_locked || false;
    const matchesUntilRankUnlocked = userData.game_stats[gameType].matches_until_rank_unlocked || 0;

    if (rankLocked) {
        const lockedRank = rankNames.find(r => elo >= rankThresholds[r]) || 'Unranked';
        return {
            rank: `Preliminary ${lockedRank}`,
            placement: `Matches Until Rank Unlocked: ${matchesUntilRankUnlocked}`
        };
    }

    const rank = rankNames.find(r => elo >= rankThresholds[r]) || 'Unranked';
    const placement = "Placement: " + (gameType == 2 && userData.leaderboard_position || 'N/A');
    return { rank, placement };
}

module.exports = { calculateRankAndPlacement};