// player.js - Lógica del jugador (movimiento, salto, física) con INERCIA

const PLAYER_CONFIG = {
  // Movimiento
  MOVE_SPEED: 0.15,
  STRAFE_SPEED: 0.12,
  ROTATION_SPEED: 0.05,
  
  // Inercia
  ACCELERATION: 0.008,        // Qué tan rápido acelera
  DECELERATION: 0.012,        // Qué tan rápido frena (más alto = frena más rápido)
  AIR_CONTROL: 0.3,           // Control en el aire (0-1, menor = menos control)
  
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
  GROUND_FRICTION: 0.88,      // Fricción en el suelo (menor = más deslizante)
  AIR_FRICTION: 0.98          // Fricción en el aire (casi sin fricción)
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
    
    // Velocidades objetivo (donde quiere ir el jugador)
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
    
    // Referencias
    tileMap: tileMap,
    independentObjects: independentObjects
  };
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
    // Acelerando
    player.rotationVelocity += Math.sign(targetRotationVelocity) * PLAYER_CONFIG.ROTATION_ACCELERATION;
    player.rotationVelocity = Math.max(-PLAYER_CONFIG.MAX_ROTATION_SPEED, 
                                       Math.min(PLAYER_CONFIG.MAX_ROTATION_SPEED, player.rotationVelocity));
  } else {
    // Frenando
    player.rotationVelocity *= (1 - PLAYER_CONFIG.ROTATION_DECELERATION);
    if (Math.abs(player.rotationVelocity) < 0.001) player.rotationVelocity = 0;
  }
  
  player.angle += player.rotationVelocity;
  
  // ========================================
  // MOVIMIENTO CON INERCIA
  // ========================================
  
  // Calcular velocidad objetivo basada en input
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
  
  // Movimiento lateral (strafe) - opcional
  if (keys['a'] || keys['A']) {
    targetVx -= Math.cos(player.angle) * PLAYER_CONFIG.STRAFE_SPEED;
    targetVy -= Math.sin(player.angle) * PLAYER_CONFIG.STRAFE_SPEED;
  }
  if (keys['d'] || keys['D']) {
    targetVx += Math.cos(player.angle) * PLAYER_CONFIG.STRAFE_SPEED;
    targetVy += Math.sin(player.angle) * PLAYER_CONFIG.STRAFE_SPEED;
  }
  
  // Control en el aire vs suelo
  const controlFactor = grounded ? 1.0 : PLAYER_CONFIG.AIR_CONTROL;
  const acceleration = PLAYER_CONFIG.ACCELERATION * controlFactor;
  const deceleration = PLAYER_CONFIG.DECELERATION * controlFactor;
  
  // Interpolar hacia velocidad objetivo (aceleración)
  if (targetVx !== 0 || targetVy !== 0) {
    const dx = targetVx - player.vx;
    const dy = targetVy - player.vy;
    
    player.vx += dx * acceleration;
    player.vy += dy * acceleration;
  } else {
    // Desaceleración cuando no hay input
    player.vx *= (1 - deceleration);
    player.vy *= (1 - deceleration);
    
    // Detener completamente si la velocidad es muy baja
    if (Math.abs(player.vx) < 0.001) player.vx = 0;
    if (Math.abs(player.vy) < 0.001) player.vy = 0;
  }
  
  // Aplicar fricción (más fuerte en el suelo)
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
  
  // Si hay colisión, frenar la velocidad en esa dirección
  if (resolved.x === obj.x) {
    player.vx *= 0.5; // Frenar en X si colisionamos
  }
  if (resolved.y === obj.y) {
    player.vy *= 0.5; // Frenar en Y si colisionamos
  }
  
  obj.x = resolved.x;
  obj.y = resolved.y;
  
  // ========================================
  // FÍSICA VERTICAL (GRAVEDAD Y SALTO)
  // ========================================
  
  const groundHeight = getTerrainHeight(obj.x, obj.y, player.tileMap, player.independentObjects);
  
  // Sistema de coyote time
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
  
  // Determinar si podemos saltar
  const canCoyoteJump = player.coyoteTimer > 0 && player.jumpsRemaining === 2;
  const canDoubleJump = player.jumpsRemaining > 0;
  
  // Salto con doble salto y coyote time
  if ((keys[' '] || keys['Spacebar']) && !player.isJumping) {
    if (grounded || canCoyoteJump || canDoubleJump) {
      player.velocityZ = PLAYER_CONFIG.JUMP_FORCE;
      player.isJumping = true;
      player.jumpsRemaining--;
      player.coyoteTimer = 0;
    }
  }
  
  // Liberar flag de salto cuando se suelta la tecla
  if (!keys[' '] && !keys['Spacebar']) {
    player.isJumping = false;
  }
  
  // Aplicar gravedad
  if (!grounded || player.velocityZ > 0) {
    player.velocityZ -= PLAYER_CONFIG.GRAVITY;
    player.velocityZ = Math.max(player.velocityZ, -PLAYER_CONFIG.MAX_FALL_SPEED);
  } else {
    player.velocityZ = 0;
  }
  
  // Actualizar posición vertical
  obj.z += player.velocityZ;
  
  // Mantener sobre el suelo
  if (obj.z < groundHeight) {
    obj.z = groundHeight;
    player.velocityZ = 0;
  }
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
 * Obtiene la velocidad actual del jugador (útil para efectos visuales)
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
 * Aplica un impulso al jugador (útil para knockback, explosiones, etc)
 */
function applyImpulse(player, vx, vy, vz) {
  player.vx += vx;
  player.vy += vy;
  player.velocityZ += vz;
}

/**
 * Presets de configuración para diferentes sensaciones de movimiento
 */
const MOVEMENT_PRESETS = {
  // Movimiento realista con inercia notable
  REALISTIC: {
    ACCELERATION: 2,
    DECELERATION: 0.012,
    GROUND_FRICTION: 0.88,
    AIR_FRICTION: 0.98,
    AIR_CONTROL: 0.3
  },
  
  // Movimiento arcade (más responsivo)
  ARCADE: {
    ACCELERATION: 0.02,
    DECELERATION: 0.08,
    GROUND_FRICTION: 0.75,
    AIR_FRICTION: 0.95,
    AIR_CONTROL: 0.6
  },
  
  // Movimiento en hielo (muy deslizante)
  ICY: {
    ACCELERATION: 0.005,
    DECELERATION: 0.005,
    GROUND_FRICTION: 0.98,
    AIR_FRICTION: 0.99,
    AIR_CONTROL: 0.2
  },
  
  // Movimiento preciso (poco deslizamiento)
  PRECISE: {
    ACCELERATION: 5,
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