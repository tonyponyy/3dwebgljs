// player.js - Lógica del jugador (movimiento, salto, física) con INERCIA y ANIMACIONES

const PLAYER_CONFIG = {
  // Movimiento
  MOVE_SPEED: 0.25,
  STRAFE_SPEED: 0.20,
  ROTATION_SPEED: 0.05,
  
  // Inercia
  ACCELERATION: 0.015,
  DECELERATION: 0.012,
  AIR_CONTROL: 0.3,
  
  // Rotación con inercia
  ROTATION_ACCELERATION: 0.003,
  ROTATION_DECELERATION: 0.15,
  MAX_ROTATION_SPEED: 0.08,
  
  // Salto
  JUMP_FORCE: 0.50,
  GRAVITY: 0.015,
  MAX_FALL_SPEED: 0.5,
  COYOTE_TIME: 0.2,
  
  // Fricción
  GROUND_FRICTION: 0.88,
  AIR_FRICTION: 0.98
};

// Configuración de animaciones
const ANIMATION_CONFIG = {
  TILES: {
    IDLE: 10,
    WALK: [11, 12, 13],
    JUMP: 14
  },
  WALK_SPEED: 0.15,  // Velocidad de animación de caminar (frames por frame del juego)
  MOVEMENT_THRESHOLD: 0.01  // Velocidad mínima para considerar que está caminando
};

/**
 * Inicializa el jugador
 */
function initPlayer(playerObject, tileMap, independentObjects) {
  return {
    object: playerObject,
    
    // Velocidades actuales
    vx: 0,
    vy: 0,
    velocityZ: 0,
    
    // Velocidades objetivo
    targetVx: 0,
    targetVy: 0,
    
    // Rotación con inercia
    angle: 0,
    rotationVelocity: 0,
    targetRotation: 0,
    
    // Salto
    isJumping: false,
    jumpsRemaining: 2,
    coyoteTimer: 0,
    wasGrounded: false,
    
    // Sistema de animación
    currentAnimation: 'IDLE',
    animationFrame: 0,
    animationTimer: 0,
    
    // Referencias
    tileMap: tileMap,
    independentObjects: independentObjects
  };
}

/**
 * Actualiza la animación del jugador
 */
function updatePlayerAnimation(player, grounded) {
  const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
  const isMoving = speed > ANIMATION_CONFIG.MOVEMENT_THRESHOLD;
  
  let newAnimation = 'IDLE';
  
  // Determinar qué animación usar
  if (!grounded) {
    newAnimation = 'JUMP';
  } else if (isMoving) {
    newAnimation = 'WALK';
  } else {
    newAnimation = 'IDLE';
  }
  
  // Si cambió la animación, resetear el frame
  if (newAnimation !== player.currentAnimation) {
    player.currentAnimation = newAnimation;
    player.animationFrame = 0;
    player.animationTimer = 0;
  }
  
  // Actualizar frame de animación de caminar
  if (player.currentAnimation === 'WALK') {
    player.animationTimer += ANIMATION_CONFIG.WALK_SPEED;
    
    if (player.animationTimer >= 1) {
      player.animationTimer = 0;
      player.animationFrame = (player.animationFrame + 1) % ANIMATION_CONFIG.TILES.WALK.length;
    }
  }
  
  // Aplicar el tile correspondiente
  let tileToApply;
  
  switch (player.currentAnimation) {
    case 'IDLE':
      tileToApply = ANIMATION_CONFIG.TILES.IDLE;
      break;
    case 'WALK':
      tileToApply = ANIMATION_CONFIG.TILES.WALK[player.animationFrame];
      break;
    case 'JUMP':
      tileToApply = ANIMATION_CONFIG.TILES.JUMP;
      break;
    default:
      tileToApply = ANIMATION_CONFIG.TILES.IDLE;
  }
  
  // Cambiar el tile del jugador (asumiendo que el jugador es independentObjects[0])
  if (player.independentObjects && player.independentObjects[0]) {
    player.independentObjects[0].tile = tileToApply;
  }
}

/**
 * Actualiza el jugador cada frame
 */
function updatePlayer(player, keys, deltaTime = 1/60) {
  const obj = player.object;
  const grounded = isGrounded(obj.x, obj.y, obj.z, player.tileMap, player.independentObjects);
  
  // ========================================
  // ROTACIÓN CON INERCIA
  // ========================================
  let targetRotationVelocity = 0;
  
  if (keys['ArrowLeft']) {
    targetRotationVelocity = PLAYER_CONFIG.MAX_ROTATION_SPEED;
  }
  if (keys['ArrowRight']) {
    targetRotationVelocity = -PLAYER_CONFIG.MAX_ROTATION_SPEED;
  }
  
  // Interpolar velocidad de rotación
  if (targetRotationVelocity !== 0) {
    player.rotationVelocity += Math.sign(targetRotationVelocity) * PLAYER_CONFIG.ROTATION_ACCELERATION;
    player.rotationVelocity = Math.max(-PLAYER_CONFIG.MAX_ROTATION_SPEED, 
                                       Math.min(PLAYER_CONFIG.MAX_ROTATION_SPEED, player.rotationVelocity));
  } else {
    player.rotationVelocity *= (1 - PLAYER_CONFIG.ROTATION_DECELERATION);
    if (Math.abs(player.rotationVelocity) < 0.001) player.rotationVelocity = 0;
  }
  
  player.angle += player.rotationVelocity;
  
  // ========================================
  // MOVIMIENTO CON INERCIA
  // ========================================
  
  let targetVx = 0;
  let targetVy = 0;
  
  if (keys['ArrowUp'] || keys['w'] || keys['W']) {
    targetVx -= Math.sin(player.angle) * PLAYER_CONFIG.MOVE_SPEED;
    targetVy += Math.cos(player.angle) * PLAYER_CONFIG.MOVE_SPEED;
  }
  if (keys['ArrowDown'] || keys['s'] || keys['S']) {
    targetVx += Math.sin(player.angle) * PLAYER_CONFIG.MOVE_SPEED;
    targetVy -= Math.cos(player.angle) * PLAYER_CONFIG.MOVE_SPEED;
  }
  
  if (keys['a'] || keys['A']) {
    targetVx -= Math.cos(player.angle) * PLAYER_CONFIG.STRAFE_SPEED;
    targetVy -= Math.sin(player.angle) * PLAYER_CONFIG.STRAFE_SPEED;
  }
  if (keys['d'] || keys['D']) {
    targetVx += Math.cos(player.angle) * PLAYER_CONFIG.STRAFE_SPEED;
    targetVy += Math.sin(player.angle) * PLAYER_CONFIG.STRAFE_SPEED;
  }
  
  const controlFactor = grounded ? 1.0 : PLAYER_CONFIG.AIR_CONTROL;
  const acceleration = PLAYER_CONFIG.ACCELERATION * controlFactor;
  const deceleration = PLAYER_CONFIG.DECELERATION * controlFactor;
  
  if (targetVx !== 0 || targetVy !== 0) {
    const dx = targetVx - player.vx;
    const dy = targetVy - player.vy;
    
    player.vx += dx * acceleration;
    player.vy += dy * acceleration;
  } else {
    player.vx *= (1 - deceleration);
    player.vy *= (1 - deceleration);
    
    if (Math.abs(player.vx) < 0.001) player.vx = 0;
    if (Math.abs(player.vy) < 0.001) player.vy = 0;
  }
  
  const friction = grounded ? PLAYER_CONFIG.GROUND_FRICTION : PLAYER_CONFIG.AIR_FRICTION;
  player.vx *= friction;
  player.vy *= friction;
  
  // ========================================
  // COLISIONES Y MOVIMIENTO
  // ========================================
  
  const newX = obj.x + player.vx;
  const newY = obj.y + player.vy;
  
  const resolved = resolveCollisions(
    newX,
    newY,
    obj.z,
    COLLISION_CONFIG.PLAYER_RADIUS,
    player.tileMap,
    player.independentObjects
  );
  
  if (resolved.x === obj.x) {
    player.vx *= 0.5;
  }
  if (resolved.y === obj.y) {
    player.vy *= 0.5;
  }
  
  obj.x = resolved.x;
  obj.y = resolved.y;
  
  // ========================================
  // FÍSICA VERTICAL (GRAVEDAD Y SALTO)
  // ========================================
  
  const groundHeight = getTerrainHeight(obj.x, obj.y, player.tileMap, player.independentObjects);
  
  if (grounded) {
    player.coyoteTimer = PLAYER_CONFIG.COYOTE_TIME;
    player.jumpsRemaining = 2;
    player.wasGrounded = true;
  } else {
    if (player.wasGrounded) {
      player.coyoteTimer -= deltaTime;
      player.wasGrounded = false;
    }
  }
  
  const canCoyoteJump = player.coyoteTimer > 0 && player.jumpsRemaining === 2;
  const canDoubleJump = player.jumpsRemaining > 0;
  
  if ((keys[' '] || keys['Spacebar']) && !player.isJumping) {
    if (grounded || canCoyoteJump || canDoubleJump) {
      player.velocityZ = PLAYER_CONFIG.JUMP_FORCE;
      player.isJumping = true;
      player.jumpsRemaining--;
      player.coyoteTimer = 0;
    }
  }
  
  if (!keys[' '] && !keys['Spacebar']) {
    player.isJumping = false;
  }
  
  if (!grounded || player.velocityZ > 0) {
    player.velocityZ -= PLAYER_CONFIG.GRAVITY;
    player.velocityZ = Math.max(player.velocityZ, -PLAYER_CONFIG.MAX_FALL_SPEED);
  } else {
    player.velocityZ = 0;
  }
  
  obj.z += player.velocityZ;
  
  if (obj.z < groundHeight) {
    obj.z = groundHeight;
    player.velocityZ = 0;
  }
  
  // ========================================
  // ACTUALIZAR ANIMACIÓN
  // ========================================
  updatePlayerAnimation(player, grounded);
}

/**
 * Obtiene la posición del jugador
 */
function getPlayerPosition(player) {
  return {
    x: player.object.x,
    y: player.object.y,
    z: player.object.z,
    angle: player.angle
  };
}

/**
 * Obtiene la velocidad actual del jugador
 */
function getPlayerVelocity(player) {
  const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
  return {
    vx: player.vx,
    vy: player.vy,
    vz: player.velocityZ,
    speed: speed,
    isMoving: speed > 0.01
  };
}

/**
 * Aplica un impulso al jugador
 */
function applyImpulse(player, vx, vy, vz) {
  player.vx += vx;
  player.vy += vy;
  player.velocityZ += vz;
}

/**
 * Obtiene el estado actual de animación (útil para debugging)
 */
function getPlayerAnimationState(player) {
  return {
    animation: player.currentAnimation,
    frame: player.animationFrame,
    currentTile: player.independentObjects[0]?.tile || 'N/A'
  };
}

/**
 * Presets de configuración para diferentes sensaciones de movimiento
 */
const MOVEMENT_PRESETS = {
  REALISTIC: {
    ACCELERATION: 0.4,
    DECELERATION: 0.012,
    GROUND_FRICTION: 0.88,
    AIR_FRICTION: 0.98,
    AIR_CONTROL: 0.3
  },
  
  ARCADE: {
    ACCELERATION: 0.02,
    DECELERATION: 0.08,
    GROUND_FRICTION: 0.75,
    AIR_FRICTION: 0.95,
    AIR_CONTROL: 0.6
  },
  
  ICY: {
    ACCELERATION: 0.005,
    DECELERATION: 0.005,
    GROUND_FRICTION: 0.98,
    AIR_FRICTION: 0.99,
    AIR_CONTROL: 0.2
  },
  
  PRECISE: {
    ACCELERATION: 0.05,
    DECELERATION: 0.2,
    GROUND_FRICTION: 0.5,
    AIR_FRICTION: 0.9,
    AIR_CONTROL: 0.8
  }
};

/**
 * Aplica un preset de movimiento
 */
function applyMovementPreset(presetName) {
  const preset = MOVEMENT_PRESETS[presetName];
  if (preset) {
    Object.assign(PLAYER_CONFIG, preset);
  }
}