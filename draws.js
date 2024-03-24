function createKnockoutDraw(players) {
    // Ensure the number of players is positive and not zero
    if (players.length < 1) {
        throw new Error('Number of players must be positive for a knockout draw.');
    }

    // If the number of players is odd, add a "bye" player
    if (players.length % 2 !== 0) {
        players.push('Bye');
    }

    // Randomize the order of players
    const shuffledPlayers = shuffleArray(players);

    // Create rounds
    const rounds = [];
    console.log(shuffledPlayers, "shuffledPlayers")
    let currentRound = shuffledPlayers.slice();
    // console.log(currentRound, "currentRound")
    // while (currentRound.length > 1) {
    const nextRound = [];
    for (let i = 0; i < currentRound.length; i += 2) {
        const match = [currentRound[i], currentRound[i + 1]];
        nextRound.push(match);
    }
    // rounds.push(nextRound);
    // currentRound = nextRound;
    // console.log(currentRound, "currentRound")

    // }

    return nextRound;
}

// Check if a number is a power of 2
function isPowerOfTwo(num) {
    return (num & (num - 1)) === 0 && num !== 0;
}

// Shuffle an array using the Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Example usage with 7 players
const players = ['Player1', 'Player2', 'Player3'];
// 'Player4', 'Player5', 'Player6', 'Player7'
try {
    const knockoutDraw = createKnockoutDraw(players);
    console.log(knockoutDraw);
} catch (error) {
    console.error(error.message);
}