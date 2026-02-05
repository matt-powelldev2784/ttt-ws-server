import { randomUUID } from 'node:crypto'
import { games, setupGame, updateGameState } from './gameState.js'
import { Board, GameState, Player } from './types.js'

export const connections = new Map<string, Player>()
export const waitingPlayers = new Map<string, Player>()

// add player to start game queue
export const addPlayerToStartGameQueue = (player: Player) => {
  waitingPlayers.set(player.id, player)

  // send WAITING_FOR_OPPONENT message to player
  setupGame({
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
      connectionLostTimestamp: null,
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
  playerX.symbol = 'X'
  playerO.symbol = 'O'

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
    playerX: playerX,
    playerO: playerO,
    connectionLostTimestamp: null,
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
    playerX: playerX,
    playerO: playerO,
    connectionLostTimestamp: null,
  }

  setupGame({
    socket: playerX.socket,
    payload: playerXPayload,
  })

  setupGame({
    socket: playerO.socket,
    payload: playerOPayload,
  })

  // Remove players from waiting list
  waitingPlayers.delete(playerX.id)
  waitingPlayers.delete(playerO.id)
}

// remove player from all state maps
export const removePlayer = (playerId: string) => {
  games.forEach((game, gameId) => {
    if (game.playerId === playerId || game.opponentId === playerId) {
      games.set(gameId, {
        ...game,
        error: 'CONNECTION_LOST',
        connectionLostTimestamp: Date.now(),
      })
      updateGameState({ gameId })
    }
  })

  waitingPlayers.delete(playerId)
  connections.delete(playerId)
}
