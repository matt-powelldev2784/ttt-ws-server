import { WebSocket } from 'ws'
import { error } from 'node:console'

export type Player = {
  id: string
  socket: WebSocket
  gameId: string | null
  isAlive: boolean
  symbol: 'X' | 'O' | null
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
  | 'CONNECTION_LOST'

export type GameState = {
  type: 'GAME_STATE'
  status: Status
  gameId: string | null
  playerSymbol: 'X' | 'O' | null
  board: Board
  currentTurn: 'X' | 'O'
  result: 'X' | 'O' | 'DRAW' | null
  error?: string | null | undefined
  playerX?: Player | undefined
  playerO?: Player | undefined
  connectionLostTimestamp: number | null
  gameMessage: string | null
}

export type UpdateBoard = {
  type: 'UPDATE_BOARD'
  board: Board
  currentTurn: 'X' | 'O'
  error: string | null
  result: 'X' | 'O' | 'DRAW' | null
}
