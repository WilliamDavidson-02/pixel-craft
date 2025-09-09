import { Container, Sprite, Ticker } from 'pixi.js'
import { ASSETS } from './assets'
import { 
	getChunk,
	getChunkByGlobalPosition,
	getChunkByKey,
	getIsometricTilePositions,
	isoPosToWorldPos,
	TILE_HEIGHT,
	TILE_HEIGHT_HALF,
	TILE_WIDTH_HALF 
} from './tiles'
import { Animal } from '../types'
import { generatePerlinNoise } from '../lib/utils/perlinNoise'
import { isTileWater } from './water'

export const ANIMAL_WIDTH = 64
export const ANIMAL_HEIGHT = 64
const ANIMAL_FRAME_LENGTH = 3

const DEFAULT_ANIMAL_SPEED = 0.5
const WATER_SPEED_REDUCTION = 0.3
const ANIMAL_WATER_Y_POS_TOP = TILE_HEIGHT
const ANIMAL_WATER_Y_POS_BOTTOM = TILE_HEIGHT_HALF

const animationSpeed = 0.15
const MOVEMENT_CHANGE_INTERVAL = 3000 // Change direction every 3 seconds
const IDLE_CHANCE = 0.3 // 30% chance to be idle

let animals: Animal[] = []

const getRandomDirection = () => {
	const directions = [
		{ x: 0, y: -1 }, // up
		{ x: 0, y: 1 },  // down
		{ x: -1, y: 0 }, // left
		{ x: 1, y: 0 },  // right
		{ x: -1, y: -1 }, // up-left
		{ x: 1, y: -1 },  // up-right
		{ x: -1, y: 1 },  // down-left
		{ x: 1, y: 1 },   // down-right
		{ x: 0, y: 0 }    // idle
	]
	return directions[Math.floor(Math.random() * directions.length)]
}

const getAnimalAnimationKey = (direction: { x: number; y: number }, isInWater: boolean) => {
	let key = 'down-center' // default

	if (direction.x === 0 && direction.y === 0) {
		// idle - keep current key or default
		return key
	}

	// Determine animation key based on direction
	if (direction.y < 0 && direction.x === 0) key = 'up-center'
	else if (direction.y > 0 && direction.x === 0) key = 'down-center'
	else if (direction.x < 0 && direction.y === 0) key = 'left-left'
	else if (direction.x > 0 && direction.y === 0) key = 'right-right'
	else if (direction.y < 0 && direction.x < 0) key = 'up-left'
	else if (direction.y < 0 && direction.x > 0) key = 'up-right'
	else if (direction.y > 0 && direction.x < 0) key = 'down-left'
	else if (direction.y > 0 && direction.x > 0) key = 'down-right'

	if (isInWater) {
		key = 'water-' + key
	}

	return key
}

const getRandomWorldPosition = () => {
	// Generate a random position over a larger area around the player
	const offsetRange = 200 // Much larger area to spread out 200+ animals
	let attempts = 0
	const maxAttempts = 100 // More attempts
	
	while (attempts < maxAttempts) {
		const x = (Math.random() - 0.5) * offsetRange
		const y = (Math.random() - 0.5) * offsetRange
		
		const { xPosTile, yPosTile } = getIsometricTilePositions(y, x, TILE_WIDTH_HALF, TILE_HEIGHT_HALF)
		
		const position = {
			x: xPosTile - ANIMAL_WIDTH / 2,
			y: yPosTile + ANIMAL_HEIGHT / 2
		}
		
		// Check if this position is in water
		const worldPos = isoPosToWorldPos(position.x + ANIMAL_WIDTH/2, position.y)
		const noise = generatePerlinNoise(worldPos.x, worldPos.y)
		
		if (!isTileWater(noise)) {
			// Safe spawn position - not in water
			return position
		}
		
		attempts++
	}
	
	// If still no safe position, try positions in a grid pattern around center
	const gridSize = 10
	for (let gx = -gridSize; gx <= gridSize; gx += 2) {
		for (let gy = -gridSize; gy <= gridSize; gy += 2) {
			const { xPosTile, yPosTile } = getIsometricTilePositions(gy * 32, gx * 32, TILE_WIDTH_HALF, TILE_HEIGHT_HALF)
			const position = {
				x: xPosTile - ANIMAL_WIDTH / 2,
				y: yPosTile + ANIMAL_HEIGHT / 2
			}
			
			const worldPos = isoPosToWorldPos(position.x + ANIMAL_WIDTH/2, position.y)
			const noise = generatePerlinNoise(worldPos.x, worldPos.y)
			
			if (!isTileWater(noise)) {
				return position
			}
		}
	}
	
	// Final fallback to center
	return {
		x: 0 - ANIMAL_WIDTH / 2,
		y: 0 + ANIMAL_HEIGHT / 2
	}
}

const isAnimalInWater = (animal: Animal) => {
	let isWater: Record<string, any> = {}

	const topLineYPos = animal.isInWater
		? animal.sprite.y - ANIMAL_WATER_Y_POS_TOP
		: animal.sprite.y - ANIMAL_WATER_Y_POS_BOTTOM

	const positions = {
		'top-left': isoPosToWorldPos(animal.sprite.x, topLineYPos),
		'top-right': isoPosToWorldPos(animal.sprite.x + animal.sprite.width, topLineYPos),
		'bottom-left': isoPosToWorldPos(animal.sprite.x, animal.sprite.y),
		'bottom-right': isoPosToWorldPos(animal.sprite.x + animal.sprite.width, animal.sprite.y)
	}

	for (const [key, pos] of Object.entries(positions)) {
		const noise = generatePerlinNoise(pos.x, pos.y)
		const [line] = key.split('-')
		isWater[line] = isTileWater(noise)
	}

	return isWater
}

const handleAnimalInWater = (animal: Animal) => {
	// Animals should not enter water - they avoid it
	animal.isInWater = false
	animal.speed = DEFAULT_ANIMAL_SPEED
}

const putAnimalInChunk = (animal: Animal) => {
	const { row, col } = getChunkByGlobalPosition(animal.sprite.x, animal.sprite.y)
	
	const newChunk = getChunk(row, col)
	const oldChunk = getChunkByKey(animal.chunkKey)
	if (!newChunk || !newChunk.surface) return
	const newKey = newChunk.surface.label

	if (newKey === oldChunk?.surface?.label) return

	if (oldChunk?.surface) {
		oldChunk.surface.removeChild(animal.sprite)
	}

	newChunk.surface?.addChild(animal.sprite)
	animal.chunkKey = newKey
}

export const createAnimal = (world: Container): Animal => {
	const { x, y } = getRandomWorldPosition()
	
	const sprite = new Sprite()
	sprite.anchor.set(0, 1) // Left Bottom
	sprite.label = 'animal'
	sprite.x = x
	sprite.y = y
	sprite.width = ANIMAL_WIDTH
	sprite.height = ANIMAL_HEIGHT

	const animal: Animal = {
		sprite,
		animationTimer: 0,
		currentFrame: 0,
		animationKey: 'down-center',
		isMoving: false,
		movementDirection: { x: 0, y: 0 },
		speed: DEFAULT_ANIMAL_SPEED,
		chunkKey: '',
		isInWater: false
	}

	// Set initial movement direction
	animal.movementDirection = getRandomDirection()
	animal.isMoving = Math.random() > IDLE_CHANCE
	animal.animationKey = getAnimalAnimationKey(animal.movementDirection, animal.isInWater)

	// Use animal sprites, fallback to player sprites for testing
	if (ASSETS.ANIMALS) {
		sprite.texture = ASSETS.ANIMALS.animations[animal.animationKey][animal.currentFrame]
		console.log('Using animal sprites for animal')
	} else if (ASSETS.PLAYER) {
		sprite.texture = ASSETS.PLAYER.animations[animal.animationKey][animal.currentFrame]
		console.log('Fallback to player sprites for animal')
	} else {
		console.log('No sprites available for animals')
	}

	handleAnimalInWater(animal)
	putAnimalInChunk(animal)

	// Add random interval for changing direction
	setInterval(() => {
		animal.movementDirection = getRandomDirection()
		animal.isMoving = Math.random() > IDLE_CHANCE
		animal.animationKey = getAnimalAnimationKey(animal.movementDirection, animal.isInWater)
	}, MOVEMENT_CHANGE_INTERVAL + Math.random() * 2000) // Add some randomness

	return animal
}

const handleAnimalAnimation = (animal: Animal, ticker: Ticker) => {
	if (animal.animationTimer >= animationSpeed && animal.isMoving) {
		animal.animationTimer = 0
		animal.currentFrame = (animal.currentFrame + 1) % ANIMAL_FRAME_LENGTH
		animal.animationKey = getAnimalAnimationKey(animal.movementDirection, animal.isInWater)
		
		// Use animal sprites
		if (ASSETS.ANIMALS) {
			animal.sprite.texture = ASSETS.ANIMALS.animations[animal.animationKey][animal.currentFrame]
		}
	} else if (!animal.isMoving) {
		// Reset to idle frame
		animal.currentFrame = 0
		if (ASSETS.ANIMALS) {
			animal.sprite.texture = ASSETS.ANIMALS.animations[animal.animationKey][animal.currentFrame]
		}
	}
}

const checkWaterCollision = (animal: Animal, newX: number, newY: number) => {
	// Check if the new position would be in water
	const positions = {
		'center': isoPosToWorldPos(newX + animal.sprite.width/2, newY),
		'left': isoPosToWorldPos(newX, newY),
		'right': isoPosToWorldPos(newX + animal.sprite.width, newY)
	}

	for (const pos of Object.values(positions)) {
		const noise = generatePerlinNoise(pos.x, pos.y)
		if (isTileWater(noise)) {
			return true // Would enter water
		}
	}
	return false // Safe to move
}

export const updateAnimal = (animal: Animal, ticker: Ticker) => {
	putAnimalInChunk(animal)
	handleAnimalInWater(animal)

	if (animal.isMoving) {
		const distance = ticker.deltaTime * animal.speed

		// Calculate new position
		const newX = animal.sprite.x + animal.movementDirection.x * distance * 2
		const newY = animal.sprite.y + animal.movementDirection.y * distance

		// Check if new position would be in water
		if (!checkWaterCollision(animal, newX, newY)) {
			// Safe to move - no water collision
			animal.sprite.x = newX
			animal.sprite.y = newY
		} else {
			// Would hit water - change direction
			animal.movementDirection = getRandomDirection()
			animal.animationKey = getAnimalAnimationKey(animal.movementDirection, animal.isInWater)
		}
	}

	// Set z-index for proper layering
	animal.sprite.zIndex = animal.sprite.y

	animal.animationTimer += ticker.deltaTime / 60
	handleAnimalAnimation(animal, ticker)
}

export const spawnAnimals = (world: Container, count: number = 200) => {
	console.log(`Attempting to spawn ${count} animals`)
	for (let i = 0; i < count; i++) {
		const animal = createAnimal(world)
		animals.push(animal)
		console.log(`Animal ${i} spawned at:`, { x: animal.sprite.x, y: animal.sprite.y, chunkKey: animal.chunkKey })
	}
	console.log(`Total animals spawned: ${animals.length}`)
}

export const updateAllAnimals = (ticker: Ticker) => {
	animals.forEach(animal => updateAnimal(animal, ticker))
}

export const getAnimals = () => animals