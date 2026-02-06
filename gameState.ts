import { WebSocket } from 'ws'
import { Board, GameState } from './types.js'

export const games = new Map<string, GameState>()

export const initialGameState: GameState = {
  type: 'GAME_STATE',
  status: 'CONNECTED',
  gameId: null,
  playerSymbol: null,
  board: [null, null, null, null, null, null, null, null, null],
  currentTurn: 'X',
  result: null,
  error: null,
  connectionLostTimestamp: null,
}

// setup game for individual player
type setGameStateInput = {
  socket: WebSocket
  payload: GameState
}
export const setupGame = ({ socket, payload }: setGameStateInput) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload))
  }

  if (!payload.gameId) return

  games.set(payload.gameId, payload)
}

// update game state and send to both players
type UpdateGameStateInput = {
  gameId: string
}
export const updateGameState = ({ gameId }: UpdateGameStateInput) => {
  const game = games.get(gameId)

  if (!game) return
  if (!game.playerX || !game.playerO) return

  const gameBoard = game?.board
  const currentTurn = game?.currentTurn
  const playerXSocket = game?.playerX.socket as WebSocket
  const playerOSocket = game?.playerO.socket as WebSocket
  const payload = {
    type: 'GAME_MOVE',
    board: gameBoard,
    currentTurn: currentTurn,
    error: game.error || null,
    result: game.result || null,
  }

  if (playerXSocket.readyState === WebSocket.OPEN) {
    playerXSocket.send(JSON.stringify(payload))
  }

  if (playerOSocket.readyState === WebSocket.OPEN) {
    playerOSocket.send(JSON.stringify(payload))
  }
}

// update game board based on player move
type UpdateBoardInput = {
  gameId: string
  index: number
  symbol: 'X' | 'O'
}

export const updateBoard = ({ gameId, index, symbol }: UpdateBoardInput) => {
  const game = games.get(gameId)

  // check if game exists
  if (!game) {
    games.set(gameId, {
      ...initialGameState,
      error: 'Game not found',
    })
    return
  }

  // Check if it's the player's turn
  if (game!.currentTurn !== symbol) {
    games.set(gameId, {
      ...game!,
      error: 'Not your turn',
    })
    return
  }

  // Check if the cell is already occupied
  if (game.board[index] !== null) {
    games.set(gameId, {
      ...game!,
      error: 'Cell already occupied by your symbol',
    })
    return
  }

  // Update the board
  const newBoard = game.board
  newBoard[index] = symbol

  const updatedGameState: GameState = {
    ...game,
    board: newBoard,
    currentTurn: symbol === 'X' ? 'O' : 'X',
    error: null,
  }

  games.set(gameId, updatedGameState)
}

const winningCombinations: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

type CheckResultInput = {
  gameId: string
  symbol: 'X' | 'O'
}

export const checkResult = ({ gameId, symbol }: CheckResultInput) => {
  const board = games.get(gameId)?.board

  if (!board) return null

  if (board.every((cell) => cell !== null)) {
    return 'DRAW'
  }

  const isWinner = winningCombinations.some((combination) =>
    combination.every((index) => board[index] === symbol),
  )
  if (isWinner) {
    return symbol
  }

  return null
}

type SetGameResultInput = {
  gameId: string
  result: 'X' | 'O' | 'DRAW'
}

export const setGameResult = ({ gameId, result }: SetGameResultInput) => {
  const game = games.get(gameId)

  if (!game) return

  // update server state
  const updatedGameState: GameState = {
    ...game,
    result,
  }
  games.set(gameId, updatedGameState)

  // send message to client
  const payload = {
    type: 'SET_RESULT',
    error: game.error || null,
    result: result,
  }

  if (game.playerX?.socket.readyState === WebSocket.OPEN) {
    game.playerX.socket.send(JSON.stringify(payload))
  }

  if (game.playerO?.socket.readyState === WebSocket.OPEN) {
    game.playerO.socket.send(JSON.stringify(payload))
  }
}
