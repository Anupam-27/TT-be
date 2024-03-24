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
        const player1 = currentRound[i] === 'Bye' ? 'Bye' : `${currentRound[i].fullname}-${currentRound[i].id}`
        const player2 = currentRound[i + 1] === 'Bye' ? 'Bye' : `${currentRound[i + 1].fullname}-${currentRound[i + 1].id}`
        const match = `${player1}/${player2}`;
        nextRound.push(match);
    }
    // rounds.push(nextRound);
    // currentRound = nextRound;
    // console.log(currentRound, "currentRound")

    // }

    return nextRound;
}

function shuffleArray(array) {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

module.exports = {
    createKnockoutDraw
}