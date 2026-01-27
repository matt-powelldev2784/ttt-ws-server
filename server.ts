import { WebSocketServer } from 'ws'
import { randomUUID } from 'node:crypto'
import { Player, Game, Board } from './types.js'
import { startGamePolling } from './gamePolling.js'

const port = Number(process.env.PORT) || 8081

const server = new WebSocketServer({
  port,
})

const connections = new Map<string, Player>()
const waitingPlayers = new Map<string, Player>()
const games = new Map<string, Game>()

const startGame = (playerX: Player, playerO: Player) => {
  const board: Board = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]

  const gameId = `game-${randomUUID()}`
  const game: Game = { id: gameId, playerX, playerO, board }

  // store the game
  games.set(gameId, game)

  // update connections with gameId
  connections.set(playerX.id, { ...playerX, gameId })
  connections.set(playerO.id, { ...playerO, gameId })
}

const addPlayerToWaitingList = (player: Player) => {
  waitingPlayers.set(player.id, player)

  if (waitingPlayers.size >= 2) {
    const players = Array.from(waitingPlayers.values()).slice(0, 2)
    const [player1, player2] = players
    startGame(player1, player2)

    // Remove players from waiting list
    waitingPlayers.delete(player1.id)
    waitingPlayers.delete(player2.id)
  }
}
// Start polling connections every 5 seconds
// For development/ debugging purposes
startGamePolling({ connections, waitingPlayers, games })

server.on('connection', (socket) => {
  /// Assign a unique ID to the player and store the connection
  const playerId = `player-${randomUUID()}`
  const player: Player = { id: playerId, socket, gameId: null }
  connections.set(playerId, player)

  socket.on('message', (message) => {
    const text = message.toString()

    if (text === 'START_GAME') {
      addPlayerToWaitingList(player)
    } else {
      throw new Error(`Unknown message: ${text}`)
    }
  })

  socket.on('close', () => {
    console.log(`Client disconnected: ${1}`)
    connections.delete(playerId)
    waitingPlayers.delete(playerId)
  })
})

console.log(`WebSocket server is running on ${port}`)
