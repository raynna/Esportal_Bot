const symbols = {
    '🧡': '\uD83E\uDDA1', // Orange Heart
    '💛': '\uD83D\uDCB3', // Yellow Heart
    '💚': '\uD83D\uDC9A', // Green Heart
    '💙': '\uD83D\uDC99', // Blue Heart
    '❤️': '\u2764\uFE0F', // Red Heart
    '💜': '\uD83D\uDC9C', // Purple Heart
    '🤍': '\uD83E\uDD0D', // White Heart
    '🤎': '\uD83E\uDD0E',  // Brown Heart
    '🖤': '\u2665',       // Black Square
    '🟥': '\uD83D\uDFE5', // Red Square
    '🟧': '\uD83E\uDDE7', // Orange Square
    '🟨': '\uD83E\uDDE8', // Yellow Square
    '🟩': '\uD83E\uDDE9', // Green Square
    '🟦': '\uD83E\uDDE6', // Blue Square
    '🟪': '\uD83E\uDDEA', // Purple Square
    '⚫': '\u26AB',       // Black Circle
    '🔴': '\uD83D\uDD34', // Red Circle
    '🟠': '\uD83E\uDDE0', // Orange Circle
    '🟡': '\uD83E\uDDE1', // Yellow Circle
    '🟢': '\uD83E\uDDE2', // Green Circle
    '🔵': '\uD83D\uDD35', // Blue Circle
    '🟣': '\uD83E\uDDE3', // Purple Circle
    '⬛': '\u2B1B',       // Black Large Square
    '⬜': '\u2B1C',       // White Large Square
    '🔶': '\uD83D\uDD36', // Large Orange Diamond
    '🔷': '\uD83D\uDD37', // Large Blue Diamond
    '🔳': '\u25A1',       // White Square Containing Black Small Square
    '🔲': '\u25A0'        // Black Square Containing Black Small Square
};

const ranks = [
    {name: 'Legend', symbol: '🖤', secondarySymbol: '🤍', threshold: 2000},
    {name: 'Pro II', symbol: '💜', threshold: 1900},
    {name: 'Pro I', symbol: '💜', threshold: 1800},
    {name: 'Elite II', symbol: '❤️', threshold: 1700},
    {name: 'Elite I', symbol: '❤️', threshold: 1600},
    {name: 'Master II', symbol: '💙', threshold: 1500},
    {name: 'Master I', symbol: '💙', threshold: 1400},
    {name: 'Veteran II', symbol: '💚', threshold: 1300},
    {name: 'Veteran I', symbol: '💚', threshold: 1200},
    {name: 'Gold II', symbol: '💛', threshold: 1100},
    {name: 'Gold I', symbol: '💛', threshold: 1000},
    {name: 'Silver', symbol: '🤍', threshold: 0}
];


async function calculateRankAndPlacement(userData, gameType) {
    const {game_stats, leaderboard_position} = userData;

    const gameStats = game_stats[gameType];

    const {elo, rank_locked, matches_until_rank_unlocked} = gameStats;

    const rankLocked = rank_locked || false;
    const matchesUntilRankUnlocked = matches_until_rank_unlocked || 0;

    if (rankLocked) {
        const lockedRank = await calculateRank(elo);
        return {
            rank: `Preliminary ${lockedRank}`,
            placement: `Matches Until Rank Unlocked: ${matchesUntilRankUnlocked}`
        };
    }

    const rank = await calculateRank(elo);
    const placement = "Leaderboard placement: " + (gameType === 2 && leaderboard_position || 'N/A');
    return {rank, placement};
}

async function calculateRank(elo) {
    const foundRank = ranks.find(rank => elo >= rank.threshold);
    if (foundRank.secondarySymbol) {
        return foundRank ? foundRank.symbol + foundRank.name + foundRank.secondarySymbol : 'Unranked';
    }
    return foundRank ? foundRank.symbol + foundRank.name : 'Unranked';
}

module.exports = {calculateRankAndPlacement, calculateRank};