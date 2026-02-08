import { WebSocket } from 'ws'
import { GameState, UpdateBoard } from './types.js'

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
  gameMessage: null,
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
      error: 'Cell already occupied',
    })
    return
  }

  // Update the board
  const newBoard = game.board
  newBoard[index] = symbol

  const updatedGameState: GameState = {
    ...game,
    status: 'IN_PROGRESS',
    board: newBoard,
    currentTurn: symbol === 'X' ? 'O' : 'X',
    error: null,
  }

  games.set(gameId, updatedGameState)
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
  const playerXSocket = game?.playerX.socket
  const playerOSocket = game?.playerO.socket
  const updateGameState: UpdateBoard = {
    type: 'UPDATE_BOARD',
    board: gameBoard,
    currentTurn: currentTurn,
    error: game.error || null,
    result: game.result || null,
    gameMessage: null,
  }

  const playerXPayload: UpdateBoard = {
    ...updateGameState,
    gameMessage:
      game.currentTurn === 'X'
        ? "It's your turn!"
        : "Waiting for opponent's move...",
  }

  const playerOPayload: UpdateBoard = {
    ...updateGameState,
    gameMessage:
      game.currentTurn === 'O'
        ? "It's your turn!"
        : "Waiting for opponent's move...",
  }

  if (playerXSocket.readyState === WebSocket.OPEN) {
    playerXSocket.send(JSON.stringify(playerXPayload))
  }

  if (playerOSocket.readyState === WebSocket.OPEN) {
    playerOSocket.send(JSON.stringify(playerOPayload))
  }
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

  const isWinner = winningCombinations.some((combination) =>
    combination.every((index) => board[index] === symbol),
  )
  if (isWinner) {
    return symbol
  }

  if (board.every((cell) => cell !== null)) {
    return 'DRAW'
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
    status: 'COMPLETED',
    result,
    gameMessage:
      result === 'DRAW' ? 'Game ended in a draw!' : `Player ${result} wins!`,
  }
  games.set(gameId, updatedGameState)

  // send message to client
  const payload = {
    type: 'SET_RESULT',
    status: 'COMPLETED',
    error: game.error || null,
    result: result,
    gameMessage:
      result === 'DRAW' ? 'Game ended in a draw!' : `Player ${result} wins!`,
  }

  if (game.playerX?.socket.readyState === WebSocket.OPEN) {
    game.playerX.socket.send(JSON.stringify(payload))
  }

  if (game.playerO?.socket.readyState === WebSocket.OPEN) {
    game.playerO.socket.send(JSON.stringify(payload))
  }
}

export const setLostConnection = (gameId: string) => {
  const game = games.get(gameId)

  if (!game) return

  const updatedGameState: GameState = {
    ...game,
    status: game.status === 'COMPLETED' ? game.status : 'CONNECTION_LOST',
  }

  games.set(gameId, updatedGameState)

  if (game.playerX?.socket.readyState === WebSocket.OPEN) {
    game.playerX.socket.send(JSON.stringify(updatedGameState))
  }

  if (game.playerO?.socket.readyState === WebSocket.OPEN) {
    game.playerO.socket.send(JSON.stringify(updatedGameState))
  }
}
