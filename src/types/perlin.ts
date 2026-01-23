export type DomainWarpConfig = {
  // Whether to apply domain warping (coordinate distortion before sampling noise, creates natural coastlines/rivers)
  enabled: boolean;
  // How far to distort coordinates (higher = more dramatic warping)
  scale: number;
  // How often the warp pattern repeats (lower = larger distortion features)
  frequency: number;
  // Optional x/y shift when sampling the warp noise (creates independent warp patterns for x and y axes)
  offset?: { x: number; y: number };
};

export type NoiseConfig = {
  // Added to state.seed to create independent noise generators (e.g., +1000 for block types)
  seedOffset?: number;
  // Starting frequency for the first octave (lower = larger terrain features, higher = smaller details)
  baseFrequency: number;
  // Number of noise layers to stack (more octaves = more detail levels, but slower)
  octaves: number;
  // Starting amplitude for the first octave (default 1)
  amplitude?: number;
  // How much each octave's amplitude shrinks (e.g., 0.5 = each layer is half as strong)
  persistence?: number;
  // How much each octave's frequency grows (e.g., 2 = each layer has double the detail)
  lacunarity?: number;
  // Manual amplitude per octave (e.g., [0.7, 0.3]), overrides persistence calculation
  customWeights?: number[];
  // If true, maps output from [-1, 1] to [0, 1] range
  normalize?: boolean;
  // Optional coordinate distortion applied before fractal noise sampling
  domainWarp?: DomainWarpConfig;
};
