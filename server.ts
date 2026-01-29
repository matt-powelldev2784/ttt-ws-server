import { WebSocketServer, WebSocket } from 'ws'
import { randomUUID } from 'node:crypto'
import { Player, Game, Board, GameState } from './types.js'
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
const games = new Map<string, GameState>()

// Start game polling for development and debugging purposes only
if (process.env.NODE_ENV !== 'production') {
  startGamePolling({ connections, waitingPlayers, games })
}

// websocket connection handler
server.on('connection', (socket: WebSocket) => {
  /// Add player to connections map
  // NOTE - THE PLAYER IS PASSED AS A REFERENCE TO THE SOCKET EVENT HANDLERS
  const playerId = `player-${randomUUID()}`
  const player: Player = { id: playerId, socket, gameId: null, isAlive: true }
  connections.set(playerId, player)

  // Handle pong responses to check connection is alive
  socket.on('pong', () => {
    player.isAlive = true
  })

  // send initial CONNECTED message to player
  const payload: GameState = {
    type: 'GAME_STATE',
    status: 'CONNECTED',
    gameId: null,
    playerSymbol: null,
    playerId: player.id,
    opponentId: null,
    board: [null, null, null, null, null, null, null, null, null],
    currentTurn: 'X',
    winner: null,
  }
  updateGameState({
    socket,
    payload,
  })

  // Handle incoming messages from clients
  socket.on('message', (message) => {
    try {
      const request = JSON.parse(message.toString())
      if (request.type === 'START_GAME') {
        addPlayerToStartGameQueue(player)
      } else {
        console.log(`Unknown request type: ${request}`)
      }
    } catch (error) {
      console.error('Error parsing message:', error)
      return
    }
  })

  // Handle socket close event
  socket.on('close', () => {
    removePlayer(playerId)
  })
})

// send to client function
type SendToClientInput = {
  socket: WebSocket
  payload: GameState
}
const updateGameState = ({ socket, payload }: SendToClientInput) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload))
  }

  if (!payload.gameId) return

  games.set(payload.gameId, payload)
}

// Heartbeat mechanism to detect dead connections
const heartbeatIntervalMs = 30000
setInterval(() => {
  connections.forEach((player, playerId) => {
    if (!player.isAlive) {
      player.socket.terminate()
      removePlayer(playerId)
      return
    }

    player.isAlive = false
    player.socket.ping()
  })
}, heartbeatIntervalMs)

// add player to start game queue
const addPlayerToStartGameQueue = (player: Player) => {
  waitingPlayers.set(player.id, player)

  // send WAITING_FOR_OPPONENT message to player
  updateGameState({
    socket: player.socket,
    payload: {
      type: 'GAME_STATE',
      status: 'WAITING_FOR_OPPONENT',
      gameId: null,
      playerId: player.id,
      opponentId: null,
      playerSymbol: null,
      board: [null, null, null, null, null, null, null, null, null],
      currentTurn: 'X',
      winner: null,
    },
  })

  // If there are at least two players waiting, start a new game
  if (waitingPlayers.size >= 2) {
    startGame()
  }
}

// start a new game
const startGame = () => {
  if (waitingPlayers.size < 2) {
    return
  }

  const players = Array.from(waitingPlayers.values()).slice(0, 2)
  const [playerX, playerO] = players

  const board: Board = [null, null, null, null, null, null, null, null, null]

  // send IN_PROGRESS message to both players
  const gameId = `game-${randomUUID()}`
  const playerXPayload: GameState = {
    type: 'GAME_STATE',
    status: 'IN_PROGRESS',
    gameId,
    playerSymbol: 'X',
    playerId: playerX.id,
    opponentId: playerO.id,
    board,
    currentTurn: 'X',
    winner: null,
  }

  const playerOPayload: GameState = {
    type: 'GAME_STATE',
    status: 'IN_PROGRESS',
    gameId,
    playerSymbol: 'O',
    playerId: playerO.id,
    opponentId: playerX.id,
    board,
    currentTurn: 'X',
    winner: null,
  }

  updateGameState({
    socket: playerX.socket,
    payload: playerXPayload,
  })

  updateGameState({
    socket: playerO.socket,
    payload: playerOPayload,
  })

  // Remove players from waiting list
  waitingPlayers.delete(playerX.id)
  waitingPlayers.delete(playerO.id)
}

// remove player from all state maps
const removePlayer = (playerId: string) => {
  games.forEach((game, gameId) => {
    if (game.playerId === playerId || game.opponentId === playerId) {
      games.delete(gameId)
    }
  })

  waitingPlayers.delete(playerId)
  connections.delete(playerId)
}

const addMoveToBoard = (game: Game, index: number, symbol: 'X' | 'O') => {
  if (game.board[index] === null) {
    game.board[index] = symbol
  }
}
