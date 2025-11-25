// player.js - Lógica del jugador (movimiento, salto, física)

const PLAYER_CONFIG = {
  MOVE_SPEED: 0.15,
  STRAFE_SPEED: 0.12,
  JUMP_FORCE: 0.50,
  GRAVITY: 0.015,
  MAX_FALL_SPEED: 0.5,
  ROTATION_SPEED: 0.05,
  COYOTE_TIME: 0.2  // Tiempo extra para saltar después de caer (en segundos)
};

/**
 * Inicializa el jugador
 */
function initPlayer(playerObject, tileMap, independentObjects) {
  return {
    object: playerObject,
    vx: 0,              // Velocidad horizontal X
    vy: 0,              // Velocidad horizontal Y
    velocityZ: 0,
    isJumping: false,
    jumpsRemaining: 2,  // Número de saltos disponibles (doble salto)
    coyoteTimer: 0,     // Temporizador para coyote time
    wasGrounded: false, // Para detectar cuando dejamos el suelo
    angle: 0,           // Ángulo independiente del jugador
    tileMap: tileMap,
    independentObjects: independentObjects
  };
}

/**
 * Actualiza el jugador cada frame
 */
function updatePlayer(player, keys, deltaTime = 1/60) {
  const obj = player.object;
  
  // Rotación del jugador
  if (keys['ArrowLeft']) {
    player.angle += PLAYER_CONFIG.ROTATION_SPEED;
  }
  if (keys['ArrowRight']) {
    player.angle -= PLAYER_CONFIG.ROTATION_SPEED;
  }
  
  // Movimiento
  let moveX = 0;
  let moveY = 0;
  
  if (keys['ArrowUp'] || keys['w'] || keys['W']) {
    moveX -= Math.sin(player.angle) * PLAYER_CONFIG.MOVE_SPEED;
    moveY += Math.cos(player.angle) * PLAYER_CONFIG.MOVE_SPEED;
  }
  if (keys['ArrowDown'] || keys['s'] || keys['S']) {
    moveX += Math.sin(player.angle) * PLAYER_CONFIG.MOVE_SPEED;
    moveY -= Math.cos(player.angle) * PLAYER_CONFIG.MOVE_SPEED;
  }
  
  // Actualizar velocidades horizontales
  player.vx = moveX;
  player.vy = moveY;
  
  // Aplicar movimiento con colisiones
  const newX = obj.x + moveX;
  const newY = obj.y + moveY;
  
  const resolved = resolveCollisions(
    newX,
    newY,
    obj.z,
    COLLISION_CONFIG.PLAYER_RADIUS,
    player.tileMap,
    player.independentObjects
  );
  
  obj.x = resolved.x;
  obj.y = resolved.y;
  
  // Física vertical (gravedad y salto)
  const groundHeight = getTerrainHeight(obj.x, obj.y, player.tileMap, player.independentObjects);
  const grounded = isGrounded(obj.x, obj.y, obj.z, player.tileMap, player.independentObjects);
  
  // Sistema de coyote time
  if (grounded) {
    player.coyoteTimer = PLAYER_CONFIG.COYOTE_TIME;
    player.jumpsRemaining = 2; // Restaurar saltos cuando tocamos el suelo
    player.wasGrounded = true;
  } else {
    // Reducir el temporizador solo si acabamos de dejar el suelo
    if (player.wasGrounded) {
      player.coyoteTimer -= deltaTime;
      player.wasGrounded = false;
    }
  }
  
  // Determinar si podemos saltar (grounded, coyote time, o doble salto)
  const canCoyoteJump = player.coyoteTimer > 0 && player.jumpsRemaining === 2;
  const canDoubleJump = player.jumpsRemaining > 0;
  
  // Salto con doble salto y coyote time
  if ((keys[' '] || keys['Spacebar']) && !player.isJumping) {
    if (grounded || canCoyoteJump || canDoubleJump) {
      player.velocityZ = PLAYER_CONFIG.JUMP_FORCE;
      player.isJumping = true;
      player.jumpsRemaining--;
      player.coyoteTimer = 0; // Cancelar coyote time al saltar
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