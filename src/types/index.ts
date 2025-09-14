export type PerlinNoise = {
	map: number[][]
	width: number
	height: number
}

export type Animal = {
	sprite: import('pixi.js').Sprite
	animationTimer: number
	currentFrame: number
	animationKey: string
	isMoving: boolean
	movementDirection: { x: number; y: number }
	speed: number
	chunkKey: string
	isInWater: boolean
	health: number
	isDead: boolean
}
