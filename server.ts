import { WebSocketServer, WebSocket } from 'ws'
import { randomUUID } from 'node:crypto'
import { Player, Game, Board, MessagePayload } from './types.js'
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
  const payload: MessagePayload = {
    type: 'GAME_STATE',
    status: 'CONNECTED',
    gameId: null,
    playerSymbol: 'X',
    board: [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
    currentTurn: 'X',
    winner: null,
  }
  sendToClient({
    socket,
    payload,
  })

  // Handle incoming messages from clients
  socket.on('message', (message: WebSocket.RawData) => {
    const request = JSON.parse(message.toString())

    if (request.type === 'START_GAME') {
      addPlayerToStartGameQueue(player)
    } else {
      console.log(`Unknown request type: ${request}`)
    }
  })

  // Handle socket close event
  socket.on('close', () => {
    removePlayer(playerId)
  })
})

// send to client function
const sendToClient = ({ socket, payload }: SendToClientInput) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload))
  }
}

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

const addPlayerToStartGameQueue = (player: Player) => {
  waitingPlayers.set(player.id, player)

  // send WAITING_FOR_OPPONENT message to player
  sendToClient({
    socket: player.socket,
    payload: {
      type: 'GAME_STATE',
      status: 'WAITING_FOR_OPPONENT',
      gameId: null,
      playerSymbol: 'X',
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      currentTurn: 'X',
      winner: null,
    },
  })

  // If there are at least two players waiting, start a new game
  if (waitingPlayers.size >= 2) {
    startGame()
  }
}

const startGame = () => {
  const players = Array.from(waitingPlayers.values()).slice(0, 2)
  const [playerX, playerO] = players

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
  playerX.gameId = gameId
  playerO.gameId = gameId

  // send IN_PROGRESS message to both players
  const playerXPayload: MessagePayload = {
    type: 'GAME_STATE',
    status: 'IN_PROGRESS',
    gameId,
    playerSymbol: 'X',
    board,
    currentTurn: 'X',
    winner: null,
  }

  const playerOPayload: MessagePayload = {
    type: 'GAME_STATE',
    status: 'IN_PROGRESS',
    gameId,
    playerSymbol: 'O',
    board,
    currentTurn: 'X',
    winner: null,
  }

  sendToClient({
    socket: playerX.socket,
    payload: playerXPayload,
  })

  sendToClient({
    socket: playerO.socket,
    payload: playerOPayload,
  })

  // Remove players from waiting list
  waitingPlayers.delete(playerX.id)
  waitingPlayers.delete(playerO.id)
}

type SendToClientInput = {
  socket: WebSocket
  payload: MessagePayload
}

const removePlayer = (playerId: string) => {
  games.forEach((game, gameId) => {
    if (game.playerX.id === playerId || game.playerO.id === playerId) {
      games.delete(gameId)
    }
  })

  waitingPlayers.delete(playerId)
  connections.delete(playerId)
}
