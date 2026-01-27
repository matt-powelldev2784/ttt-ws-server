import { WebSocket } from 'ws'

export type Player = {
  id: string
  socket: WebSocket
  gameId: string | null
  isAlive: boolean
}

export type Cell = 'X' | 'O' | null
export type Line = [Cell, Cell, Cell]
export type Board = [Line, Line, Line]
export type Game = {
  id: string
  playerX: Player
  playerO: Player
  board: Board
}
