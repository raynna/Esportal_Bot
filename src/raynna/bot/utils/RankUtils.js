const hearts = {
    '🧡': '\uD83E\uDDA1',
    '💛': '\uD83D\uDCB4',
    '💚': '\uD83D\uDC9A',
    '💙': '\uD83D\uDC99',
    '❤️': '\u2764\uFE0F',
    '💜': '\uD83D\uDC9C',
    '🤍': '\uD83E\uDD0D',
    '🖤': '\uD83E\uDD0D'
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
    '\uD83E\uDD0DSilver'];
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
    '\uD83E\uDD0DSilver': 0
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