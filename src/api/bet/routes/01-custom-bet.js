
module.exports = {
    routes: [
      { // Path defined with an URL parameter
        method: 'GET',
        path: '/bets/hall-of-fame', 
        handler: 'bet.findHallOfFame',
      }
    ]
  }