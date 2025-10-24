import { Container, type ContainerChild, Sprite, Ticker } from 'pixi.js'
import { ASSETS, AUDIO } from './assets'
import {
	getChunk,
	getChunkByGlobalPosition,
	getChunkByKey,
	getIsoCollisionSides,
	getIsometricTilePositions,
	getVisibleChunkKeys,
	getVisibleChunks,
	isoPosToWorldPos,
	TILE_HEIGHT,
	TILE_HEIGHT_HALF,
	TILE_WIDTH_HALF
} from './tiles'
import { type Chunk } from '../types/tiles'
import { getVegetationFromGround, hasVegetationCollisions } from './vegetation'
import { generatePerlinNoise } from '../lib/utils/perlinNoise'
import { isTileWater } from './water'

export const PLAYER_WIDTH = 32
export const PLAYER_HEIGHT = 64
const PLAYER_FRAME_LENGTH = 3

const DEFAULT_SPEED = 1
export let PLAYER_SPEED = DEFAULT_SPEED
const WATER_SPEED_REDUCTION = 0.6
// Diffrent water position if comming in or out from top or bottom of lakes since top you see the side of the ground but not on the bottom of lakes there for we move the player diffrently
const PLAYER_WATER_Y_POS_TOP = TILE_HEIGHT
const PLAYER_WATER_Y_POS_BOTTOM = TILE_HEIGHT_HALF
let playerIsInWater = false
const PLAYER_VOLUM = 0.4

const allowedKeys = ['w', 'a', 's', 'd'] as const
type AllowedKeys = (typeof allowedKeys)[number]
const playerMovementKeys = new Set<string>([])

let animationTimer = 0
let currentFrame = 0
let animationKey = 'down-center'
const animationSpeed = 0.1

let playerChunkKey = ''

const getVerticleDirection = (verticle: string) => {
	return verticle === 'w' ? 'up' : 'down'
}

const getHorizontalDirection = (horizontal: string) => {
	return horizontal === 'a' ? 'left' : 'right'
}

const getPlayerAnimationKey = (keys: Set<string>) => {
	// When player is created there is no keys that are active there for the early check
	if (keys.size === 0 && playerIsInWater) {
		return 'water-' + animationKey
	}

	// We only want to use the first and second key that is active if a users has three keys active we ignore it
	if (keys.size > 2 || keys.size === 0) return animationKey

	const verticalKeys = ['w', 's']
	const horizontalKeys = ['a', 'd']

	let vertical = ''
	let horizontal = ''

	for (const key of keys) {
		if (verticalKeys.includes(key)) {
			vertical = getVerticleDirection(key)
		} else if (horizontalKeys.includes(key)) {
			horizontal = getHorizontalDirection(key)
		}
	}

	let key = ''

	// Handle 1 key
	if (keys.size === 1) {
		if (vertical) key = `${vertical}-center`
		if (horizontal) key = `${horizontal}-${horizontal}`
	}

	// In the format of the spritesheet naming the verticle direction always comes first
	if (vertical && horizontal) {
		key = `${vertical}-${horizontal}`
	}

	if (playerIsInWater) {
		key = 'water-' + key
	}

	return key
}

const centerPlayerToCenterTile = () => {
	const xPos = window.innerWidth / 2
	const yPos = window.innerHeight / 2
	const { x, y } = isoPosToWorldPos(xPos, yPos)

	const { yPosTile, xPosTile } = getIsometricTilePositions(y, x, TILE_WIDTH_HALF, TILE_HEIGHT_HALF)

	return {
		x: xPosTile - PLAYER_WIDTH / 2,
		y: yPosTile + PLAYER_HEIGHT / 2
	}
}

export const createPlayer = (world: Container) => {
	const { x, y } = centerPlayerToCenterTile()

	const player = new Sprite()
	player.anchor.set(0, 1) // Left Bottom
	player.label = 'player'
	player.x = x
	player.y = y
	player.width = PLAYER_WIDTH
	player.height = PLAYER_HEIGHT

	handlePlayerInWater(player, world)
	animationKey = getPlayerAnimationKey(playerMovementKeys)

	if (ASSETS.PLAYER) {
		player.texture = ASSETS.PLAYER.animations[animationKey][currentFrame]
	}

	return player
}

const isAllowedKey = (key: string): key is AllowedKeys => {
	return allowedKeys.includes(key as AllowedKeys)
}

export const registerPlayerMovement = (key: string) => {
	if (isAllowedKey(key) && !playerMovementKeys.has(key)) {
		const opposites = { w: 's', s: 'w', a: 'd', d: 'a' }

		// If we have to directions on the same axis it will mess with the animation key
		if (playerMovementKeys.has(opposites[key])) {
			removePlayerMovement(opposites[key])
		}

		playerMovementKeys.add(key)
	}
}

export const removePlayerMovement = (key: string) => {
	if (isAllowedKey(key) && playerMovementKeys.has(key)) {
		playerMovementKeys.delete(key)
	}
}

export const isPlayerMoving = () => {
	return playerMovementKeys.size !== 0
}

export const isPlayerStopping = () => {
	return playerMovementKeys.size === 0 && currentFrame !== 0
}

const handlePlayerAnimation = (player: Sprite) => {
	if (animationTimer >= animationSpeed && playerMovementKeys.size > 0) {
		animationTimer = 0
		currentFrame = (currentFrame + 1) % PLAYER_FRAME_LENGTH
		animationKey = getPlayerAnimationKey(playerMovementKeys)
		if (ASSETS.PLAYER) {
			player.texture = ASSETS.PLAYER.animations[animationKey][currentFrame]
		}

		const isStepFrame = currentFrame === 1 || currentFrame === 3

		if (isStepFrame && !playerIsInWater && AUDIO.WALK) {
			const sound = AUDIO.WALK[Math.floor(Math.random() * AUDIO.WALK.length)]
			sound.currentTime = 0
			sound.volume = PLAYER_VOLUM
			sound.play()
		} else if (currentFrame === 1 && playerIsInWater && AUDIO.SWIM) {
			const sound = AUDIO.SWIM[Math.floor(Math.random() * AUDIO.SWIM.length)]
			if (sound.paused) {
				sound.currentTime = 0
				sound.volume = PLAYER_VOLUM
				sound.play()
			}
		}
	}
}

export const setPlayerAnimation = (
	player: Sprite,
	key: string | null = animationKey,
	frame: number | null = currentFrame
) => {
	animationTimer = 0
	currentFrame = frame ?? currentFrame
	animationKey = key ?? animationKey
	if (ASSETS.PLAYER) {
		player.texture = ASSETS.PLAYER.animations[animationKey][currentFrame]
	}
}

const getAllActivePlayerTiles = (chunk: Chunk, player: Sprite) => {
	const ground = chunk.ground?.children ?? []
	const tiles: ContainerChild[] = []

	// We only want to check if the bottom of the player is in a tile since there is where the feet are
	for (const tile of ground) {
		const cx = tile.x + TILE_WIDTH_HALF
		const cy = tile.y + TILE_HEIGHT_HALF

		// The anchor is set to bottom left of the player there for we dont have to add ane width or height
		const dx = Math.abs(player.x - cx) / TILE_WIDTH_HALF
		const dy = Math.abs(player.y - cy) / TILE_HEIGHT_HALF

		const isInIsometricTile = dx + dy <= 1

		if (isInIsometricTile) {
			tiles.push(tile)
		}
	}

	return tiles
}

const isPlayerBehindItem = (item: ContainerChild, groundTile: ContainerChild, player: Sprite) => {
	// To place an item i.e vegetation on a tile but still allow the assets to display above the tile we set the anchor at bottom center
	const itemLeft = item.x - item.width / 2
	const itemRight = item.x + item.width / 2
	const itemTop = item.y - item.height

	const playerRight = player.x + player.width
	const playerTop = player.y - player.height

	const isRight = player.x < itemRight && player.x > itemLeft
	const isLeft = playerRight > itemLeft && playerRight < itemRight
	const isTop = player.y > itemTop && player.y < item.y
	const isBottom = playerTop < item.y && playerTop > itemTop
	const isAboveGroundTile = player.y < groundTile.y + TILE_HEIGHT_HALF

	return isAboveGroundTile && (isRight || isLeft) && (isTop || isBottom)
}

export const putPlayerInChunk = (player: Sprite) => {
	const { row, col } = getChunkByGlobalPosition(player.x, player.y)

	const newChunk = getChunk(row, col)
	const oldChunk = getChunkByKey(playerChunkKey)
	if (!newChunk || !newChunk.surface) return
	const newKey = newChunk.surface.label

	if (newKey === oldChunk?.surface?.label) return

	if (oldChunk?.surface) {
		oldChunk.surface.removeChild(player)
	}

	newChunk.surface?.addChild(player)
	playerChunkKey = newKey
}

const handlePlayerBounds = (player: Sprite) => {
	let allowedDirection = [...allowedKeys]
	const { row, col } = getChunkByGlobalPosition(player.x, player.y)
	const keys = getVisibleChunkKeys(row, col)
	const chunks = getVisibleChunks(keys)

	const activeChunk = chunks.get(`${col}_${row}`)! // There will always be this chunk since this is the keys are based on
	const currentTiles = getAllActivePlayerTiles(activeChunk, player)

	// Including the chunks around the chunk that player is, since an surface item can have a part o fit covering in to a differnt chunk
	for (const [_, chunk] of chunks) {
		if (!chunk.ground) continue

		// Moving backwords since the actual first index is the furthest away visualy
		const ground = chunk.ground.children
		for (let i = ground.length - 1; i >= 0; i--) {
			const tile = ground[i]
			const currentVegetation = getVegetationFromGround(chunk, tile.label)
			const hasCollisions = currentVegetation
				? hasVegetationCollisions(currentVegetation as Sprite)
				: false

			if (!hasCollisions) continue

			if (currentVegetation && isPlayerBehindItem(currentVegetation, tile, player)) {
				currentVegetation.alpha = 0.4
			} else if (currentVegetation) {
				currentVegetation.alpha = 1
			}

			if (currentVegetation && currentTiles.includes(tile)) {
				const collidedSides = getIsoCollisionSides(tile, player)

				if (collidedSides['top-left']) {
					allowedDirection = ['w', 'a']
					break
				}
				if (collidedSides['top-right']) {
					allowedDirection = ['w', 'd']
					break
				}
				if (collidedSides['bottom-left']) {
					allowedDirection = ['s', 'a']
					break
				}
				if (collidedSides['bottom-right']) {
					allowedDirection = ['s', 'd']
					break
				}
				if (collidedSides['top']) {
					allowedDirection = ['w', 'a', 'd']
					break
				}
				if (collidedSides['bottom']) {
					allowedDirection = ['s', 'a', 'd']
					break
				}
			}
		}
	}

	return allowedDirection
}

export const movePlayerTo = (x: number, y: number, world: Container, player: Sprite) => {
	const xDiff = world.x - x
	const yDiff = world.y - y

	world.y += yDiff
	world.x += xDiff

	player.y -= yDiff
	player.x -= xDiff
}

/**
 * When in water top line hits before bottom meaning nort collision move player
 * When in water and bottom line hits before meaning soulth collision move player
 * When on ground and bottom line hits before meaing north entring water move player
 * When on ground and top line hits first meaning soulth entering water move player
 */

const isPlayerInWater = (player: Sprite) => {
	let isWater: Record<string, any> = {}

	const topLineYPos = playerIsInWater
		? player.y - PLAYER_WATER_Y_POS_TOP
		: player.y - PLAYER_WATER_Y_POS_BOTTOM

	const positions = {
		'top-left': isoPosToWorldPos(player.x, topLineYPos),
		'top-right': isoPosToWorldPos(player.x + player.width, topLineYPos),
		'bottom-left': isoPosToWorldPos(player.x, player.y),
		'bottom-right': isoPosToWorldPos(player.x + player.width, player.y)
	}

	for (const [key, pos] of Object.entries(positions)) {
		const noise = generatePerlinNoise(pos.x, pos.y)

		const [line] = key.split('-')
		isWater[line] = isTileWater(noise)
	}

	return isWater
}

export const handlePlayerInWater = (player: Sprite, world: Container) => {
	const { top, bottom } = isPlayerInWater(player)

	if (top && !playerIsInWater) {
		playerIsInWater = true
		PLAYER_SPEED = WATER_SPEED_REDUCTION
		movePlayerTo(world.x, world.y - PLAYER_WATER_Y_POS_BOTTOM, world, player)
	} else if (!bottom && playerIsInWater) {
		playerIsInWater = false
		PLAYER_SPEED = DEFAULT_SPEED
		movePlayerTo(world.x, world.y + PLAYER_WATER_Y_POS_BOTTOM, world, player)
	} else if (bottom && !playerIsInWater) {
		playerIsInWater = true
		PLAYER_SPEED = WATER_SPEED_REDUCTION
		movePlayerTo(world.x, world.y + PLAYER_WATER_Y_POS_TOP, world, player)
	} else if (!top && playerIsInWater) {
		playerIsInWater = false
		PLAYER_SPEED = DEFAULT_SPEED
		movePlayerTo(world.x, world.y - PLAYER_WATER_Y_POS_TOP, world, player)
	}
}

export const movePlayerPosition = (player: Sprite, world: Container, ticker: Ticker) => {
	// We invert the momvent on the player to keep in in the center

	// Put player in the correct chunk so zIndex will work on surface items
	putPlayerInChunk(player)
	const allowedDirection = handlePlayerBounds(player)
	const distance = ticker.deltaTime * PLAYER_SPEED

	if (playerMovementKeys.has('w') && allowedDirection.includes('w')) {
		world.y += distance
		player.y -= distance
	}

	if (playerMovementKeys.has('a') && allowedDirection.includes('a')) {
		world.x += distance * 2
		player.x -= distance * 2
	}

	if (playerMovementKeys.has('s') && allowedDirection.includes('s')) {
		world.y -= distance
		player.y += distance
	}

	if (playerMovementKeys.has('d') && allowedDirection.includes('d')) {
		world.x -= distance * 2
		player.x += distance * 2
	}

	handlePlayerInWater(player, world)

	// To always be behind or infront of the right tree we have to adjust the zIndex depending on y axis
	player.zIndex = player.y

	animationTimer += ticker.deltaTime / 60
	handlePlayerAnimation(player)
}
