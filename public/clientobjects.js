/**
 * Player object used in game code
 */

class Game {
    constructor() {
        this.deck = []
        this.discard =['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'L', 'L', 'L', 'L', 'L', 'L']
        this.shuffle()
    }

    shuffle() {
        let count = this.discard.length
        for (let card = 0; card < count; card++) {
            this.deck = this.deck.concat(this.discard.splice(Math.floor(Math.random() * this.discard.length),1))
        }
    }
}

game = new Game()

console.log(game.deck)
