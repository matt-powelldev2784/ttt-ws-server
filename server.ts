import { WebSocketServer, WebSocket, RawData } from 'ws'
import { randomUUID } from 'node:crypto'
import { Player } from './types.js'
import { startGameLogging } from './gameLogging.js'
import {
  games,
  initialGameState,
  setupGame,
  updateBoard,
  updateGameState,
} from './gameState.js'
import {
  waitingPlayers,
  connections,
  addPlayerToStartGameQueue,
  removePlayer,
} from './playerState.js'

// server setup
const port = Number(process.env.PORT) || 8081
const server = new WebSocketServer({
  port,
})

// Start game logs in development mode only
if (process.env.NODE_ENV !== 'production') {
  startGameLogging({ connections, waitingPlayers, games })
}

// websocket connection handler
server.on('connection', (socket: WebSocket) => {
  /// Add player to connections map
  // NOTE - THE PLAYER IS PASSED AS A REFERENCE TO THE SOCKET EVENT HANDLERS
  const playerId = `player-${randomUUID()}`
  const player: Player = {
    id: playerId,
    socket,
    gameId: null,
    isAlive: true,
    symbol: null,
  }
  connections.set(playerId, player)

  // Handle pong responses to check connection is alive
  socket.on('pong', () => {
    player.isAlive = true
  })

  // send initial game state to client
  setupGame({
    socket,
    payload: initialGameState,
  })

  // Handle incoming messages from clients
  socket.on('message', (message) => {
    handleClientMessage(player, message)
  })

  // Handle socket close event
  socket.on('close', () => {
    removePlayer(playerId)
  })
})

// Heartbeat mechanism to cleanup lost connections
const THREE_SECONDS = 3000
const heartbeatIntervalMs = THREE_SECONDS
setInterval(() => {
  // remove players with dead connections
  connections.forEach((player, playerId) => {
    if (!player.isAlive) {
      player.socket.terminate()
      removePlayer(playerId)
      return
    }

    player.isAlive = false
    player.socket.ping()
  })

  games.forEach((game, gameId) => {
    if (game.error === 'CONNECTION_LOST') {
      const connectionLostDuration = game.connectionLostTimestamp
        ? Date.now() - game.connectionLostTimestamp
        : null

      if (connectionLostDuration == null) return

      // If connection has been lost for more than two minutes delete the game
      const TWO_MINUTES = 2 * 60 * 1000
      if (connectionLostDuration > TWO_MINUTES) {
        games.delete(gameId)
      }
    }
  })
}, heartbeatIntervalMs)

// Handle incoming messages from clients
const handleClientMessage = (player: Player, message: RawData) => {
  try {
    const { type } = JSON.parse(message.toString())

    if (!type) {
      console.log(`Invalid message format: ${message}`)
      return
    }

    if (type === 'START_GAME') {
      addPlayerToStartGameQueue(player)
      return
    }

    if (type === 'MAKE_MOVE') {
      const { gameId, index, symbol } = JSON.parse(message.toString()).payload
      updateBoard({ gameId, index, symbol })
      updateGameState({ gameId })
      return
    }
  } catch (error) {
    console.error('Error parsing message:', error)
  }
}
