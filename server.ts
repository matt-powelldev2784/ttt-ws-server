import { WebSocketServer } from 'ws'
import { randomUUID } from 'node:crypto'
import { Player, Game, Board } from './types.js'
import { startGamePolling } from './gamePolling.js'

// server setup
const port = Number(process.env.PORT) || 8081
const server = new WebSocketServer({
  port,
})
console.info(`WebSocket server is running on ${port}`)

// state
const connections = new Map<string, Player>()
const waitingPlayers = new Map<string, Player>()
const games = new Map<string, Game>()

// Start game polling for development and debugging purposes only
startGamePolling({ connections, waitingPlayers, games })

// websocket connection handler
server.on('connection', (socket) => {
  /// Add player to connections map
  const playerId = `player-${randomUUID()}`
  const player: Player = { id: playerId, socket, gameId: null, isAlive: true }
  connections.set(playerId, player)

  // Handle incoming messages from clients
  socket.on('message', (message) => {
    const request = JSON.parse(message.toString())

    if (request.type === 'START_GAME') {
      addPlayerToWaitingList(player)
    } else {
      throw new Error(`Unknown request type: ${request}`)
    }
  })

  // Handle socket close event
  socket.on('close', () => {
    console.log(`Client disconnected: ${playerId}`)
    removePlayer(playerId)
  })
})

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

const removePlayer = (playerId: string) => {
  connections.delete(playerId)
  waitingPlayers.delete(playerId)
  games.forEach((game, gameId) => {
    if (game.playerX.id === playerId || game.playerO.id === playerId) {
      games.delete(gameId)
    }
  })
}
