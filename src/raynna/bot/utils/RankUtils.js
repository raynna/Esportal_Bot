const symbols = {
    '🧡': '\uD83E\uDDA1', // Orange Heart
    '💛': '\uD83D\uDCB4', // Yellow Heart
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

const rankNames = [
    '\uD83E\uDD0DLegend',
    `\uD83D\uDC9CPro II`,
    `\uD83D\uDC9CPro I`,
    `\u2764\uFE0FElite II`,
    '\u2764\uFE0FElite I',
    '\uD83D\uDC99Master II',
    '\uD83D\uDC99Master I',
    '\uD83D\uDC9AVeteran II',
    '\uD83D\uDC9AVeteran I',
    '\uD83D\uDCB4Gold II',
    '\uD83D\uDCB4Gold I',
    '\uD83E\uDD0ESilver'];
const rankThresholds = {
    '\uD83E\uDD0DLegend': 2000,
    '\uD83D\uDC9CPro II': 1900,
    '\uD83D\uDC9CPro I': 1800,
    '\u2764\uFE0FElite II': 1700,
    '\u2764\uFE0FElite I': 1600,
    '\uD83D\uDC99Master II': 1500,
    '\uD83D\uDC99Master I': 1400,
    '\uD83D\uDC9AVeteran II': 1300,
    '\uD83D\uDC9AVeteran I': 1200,
    '\uD83D\uDCB4Gold II': 1100,
    '\uD83D\uDCB4Gold I': 1000,
    '\uD83E\uDD0ESilver': 0
};


function calculateRankAndPlacement(userData, gameType) {
    const {game_stats, leaderboard_position} = userData;

    const gameStats = game_stats[gameType];

    const {elo, rank_locked, matches_until_rank_unlocked} = gameStats;

    const rankLocked = rank_locked || false;
    const matchesUntilRankUnlocked = matches_until_rank_unlocked || 0;

    if (rankLocked) {
        const lockedRank = rankNames.find(r => elo >= rankThresholds[r]) || 'Unranked';
        return {
            rank: `Preliminary ${lockedRank}`,
            placement: `Matches Until Rank Unlocked: ${matchesUntilRankUnlocked}`
        };
    }

    const rank = rankNames.find(r => elo >= rankThresholds[r]) || 'Unranked';
    const placement = "Leaderboard placement: " + (gameType === 2 && leaderboard_position.toLocaleString() || 'N/A');
    return {rank, placement};
}

function calculateRank(elo) {
    return rankNames.find(r => elo >= rankThresholds[r]) || 'Unranked';
}

module.exports = {calculateRankAndPlacement, calculateRank};