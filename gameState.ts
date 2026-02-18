import { WebSocket } from 'ws'
import { GameState } from './types.js'

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

// update server state when player makes a move
type UpdateServerStateInput = {
  gameId: string
  index: number
  symbol: 'X' | 'O'
}

export const updateServerState = ({
  gameId,
  index,
  symbol,
}: UpdateServerStateInput) => {
  const game = games.get(gameId)

  // check if game exists
  if (!game) return

  // Check if it's the player's turn
  if (game!.currentTurn !== symbol) return

  // Check if the cell is already occupied
  if (game.board[index] !== null) return

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

// update the client state after server state has been updated
type UpdateClientStateInput = {
  gameId: string
}

export const updateClientState = ({ gameId }: UpdateClientStateInput) => {
  const game = games.get(gameId)

  if (!game) return
  if (!game.playerX || !game.playerO) return

  const gameBoard = game.board
  const currentTurn = game.currentTurn
  const playerXSocket = game.playerX.socket
  const playerOSocket = game.playerO.socket
  const updateGameState: GameState = {
    ...game,
    type: 'UPDATE_BOARD',
    board: gameBoard,
    currentTurn: currentTurn,
    error: game.error || null,
    result: game.result || null,
    gameMessage: null,
  }

  const playerXPayload: GameState = {
    ...updateGameState,
    playerSymbol: 'X',
    gameMessage:
      updateGameState.currentTurn === 'X'
        ? "It's your turn!"
        : "Waiting for opponent's move...",
  }

  const playerOPayload: GameState = {
    ...updateGameState,
    playerSymbol: 'O',
    gameMessage:
      updateGameState.currentTurn === 'O'
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

// function to check game result
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

// set server and client state when game is completed
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
    ...updatedGameState,
    type: 'SET_RESULT',
    status: 'COMPLETED',
    error: game.error || null,
    board: game.board,
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

// set server game state to connection lost when player disconnects
// update client status to connection lost if the game is not already completed
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
