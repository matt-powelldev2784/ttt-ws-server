import { WebSocketServer, WebSocket } from 'ws'
import { randomUUID } from 'node:crypto'

const port = Number(process.env.PORT) || 8081

const server = new WebSocketServer({
  port,
})

type Cell = 'X' | 'O' | null
type Line = [Cell, Cell, Cell]
type Board = [Line, Line, Line]
type Game = { playerX: Player; playerO: Player; board: Board }

type Player = {
  id: string
  socket: WebSocket
}

const clients = new Map<string, Player>()
const games = new Map<string, Game>()

type PlayerMap = Map<string, Player>

const listConnections = () => {
  const players = [...clients.values()]
  console.log('player.length', players.length)
  players.map((player, i) => {
    console.log(`Connection:${i} = ${player.id}`)
  })
}

const listIntervalMs = Number(process.env.LIST_INTERVAL_MS) || 5000
setInterval(listConnections, listIntervalMs)

server.on('connection', (socket) => {
  console.log(`Client connected: ${1}`)

  /// Assign a unique ID to the player and store the connection
  const playerId = randomUUID()
  const player: Player = { id: playerId, socket }
  clients.set(playerId, player)

  socket.on('message', (message) => {
    console.log(`Received from ${1}`)
  })

  socket.on('close', () => {
    console.log(`Client disconnected: ${1}`)
  })
})

console.log(`WebSocket server is running on ${port}`)
