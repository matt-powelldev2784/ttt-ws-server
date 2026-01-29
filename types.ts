import { WebSocket } from 'ws'

export type Player = {
  id: string
  socket: WebSocket
  gameId: string | null
  isAlive: boolean
}

export type Cell = 'X' | 'O' | null
export type Board = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell]
export type Game = {
  id: string
  playerX: Player
  playerO: Player
  board: Board
}

type Status =
  | 'NOT_CONNECTED'
  | 'CONNECTED'
  | 'WAITING_FOR_OPPONENT'
  | 'IN_PROGRESS'
  | 'COMPLETED'

export type GameState = {
  type: 'GAME_STATE'
  status: Status
  gameId: string | null
  playerSymbol: 'X' | 'O' | null
  playerId: string | null
  opponentId: string | null
  board: Board
  currentTurn: 'X' | 'O'
  winner: 'X' | 'O' | 'DRAW' | null
}
