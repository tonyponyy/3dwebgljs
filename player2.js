// ======================================================
// player.js – Físicas tipo KART (Mario Kart / Arcade)
// ======================================================

// ================= CONFIGURACIÓN ======================
const PLAYER_CONFIG = {
  // Kart
  MAX_SPEED: 0.45,
  ACCELERATION: 0.018,
  BRAKE_DECELERATION: 0.04,
  ROLL_DECELERATION: 0.006,

  // Dirección
  STEER_ANGLE: 0.045,
  STEER_RESPONSE: 0.18,
  MIN_STEER_SPEED: 0.05,

  // Derrape
  LATERAL_FRICTION: 0.85,
  DRIFT_FRICTION: 0.93,
  DRIFT_STEER_MULT: 1.6,

  // Salto
  JUMP_FORCE: 0.35,
  GRAVITY: 0.015,
  MAX_FALL_SPEED: 0.5,
  COYOTE_TIME: 0.2
};

// ================= ANIMACIONES ======================
const ANIMATION_CONFIG = {
  TILES: {
    IDLE: 33,
    WALK: [33],
    JUMP: 34
  },
  WALK_SPEED: 0.15,
  MOVEMENT_THRESHOLD: 0.02
};

// ================= INICIALIZACIÓN ======================
function initPlayer(playerObject, tileMap, independentObjects) {
  return {
    object: playerObject,

    // Movimiento
    vx: 0,
    vy: 0,
    speed: 0,

    // Dirección
    angle: 0,
    steer: 0,
    isDrifting: false,

    // Vertical
    velocityZ: 0,
    isJumping: false,
    jumpsRemaining: 1,
    coyoteTimer: 0,
    wasGrounded: false,

    // Animación
    currentAnimation: 'IDLE',
    animationFrame: 0,
    animationTimer: 0,

    // Referencias
    tileMap,
    independentObjects
  };
}

// ================= ANIMACIÓN ======================
function updatePlayerAnimation(player, grounded) {
  const isMoving = Math.abs(player.speed) > ANIMATION_CONFIG.MOVEMENT_THRESHOLD;

  let newAnimation = 'IDLE';

  if (!grounded) newAnimation = 'JUMP';
  else if (isMoving) newAnimation = 'WALK';

  if (newAnimation !== player.currentAnimation) {
    player.currentAnimation = newAnimation;
    player.animationFrame = 0;
    player.animationTimer = 0;
  }

  if (player.currentAnimation === 'WALK') {
    player.animationTimer += ANIMATION_CONFIG.WALK_SPEED;
    if (player.animationTimer >= 1) {
      player.animationTimer = 0;
      player.animationFrame =
        (player.animationFrame + 1) % ANIMATION_CONFIG.TILES.WALK.length;
    }
  }

  let tile = ANIMATION_CONFIG.TILES.IDLE;
  if (player.currentAnimation === 'WALK')
    tile = ANIMATION_CONFIG.TILES.WALK[player.animationFrame];
  if (player.currentAnimation === 'JUMP')
    tile = ANIMATION_CONFIG.TILES.JUMP;

  if (player.independentObjects?.[0]) {
    player.independentObjects[0].tile = tile;
  }
}

// ================= UPDATE PRINCIPAL ======================
function updatePlayer(player, keys, deltaTime = 1 / 60) {
  const obj = player.object;
  const grounded = isGrounded(
    obj.x,
    obj.y,
    obj.z,
    player.tileMap,
    player.independentObjects
  );

  // ================= ACELERACIÓN ======================
  if (keys['ArrowUp'] || keys['w']) {
    player.speed += PLAYER_CONFIG.ACCELERATION;
  } else if (keys['ArrowDown'] || keys['s']) {
    player.speed -= PLAYER_CONFIG.BRAKE_DECELERATION;
  } else {
    if (player.speed > 0) player.speed -= PLAYER_CONFIG.ROLL_DECELERATION;
    if (player.speed < 0) player.speed += PLAYER_CONFIG.ROLL_DECELERATION;
  }

  player.speed = Math.max(
    -PLAYER_CONFIG.MAX_SPEED * 0.4,
    Math.min(PLAYER_CONFIG.MAX_SPEED, player.speed)
  );

  // ================= DIRECCIÓN ======================
  let steerInput = 0;
  if (keys['ArrowLeft']) steerInput += 1;
  if (keys['ArrowRight']) steerInput -= 1;

  player.isDrifting = keys['Shift'];

  const steerStrength =
    Math.abs(player.speed) > PLAYER_CONFIG.MIN_STEER_SPEED
      ? steerInput * PLAYER_CONFIG.STEER_ANGLE
      : 0;

  const steerMult = player.isDrifting
    ? PLAYER_CONFIG.DRIFT_STEER_MULT
    : 1;

  player.steer +=
    (steerStrength * steerMult - player.steer) *
    PLAYER_CONFIG.STEER_RESPONSE;

  player.angle += player.steer * Math.sign(player.speed);
   obj.orientation = player.angle + Math.PI;  

  // ================= VECTOR MOVIMIENTO ======================
  const forwardX = -Math.sin(player.angle);
  const forwardY =  Math.cos(player.angle);

  player.vx = forwardX * player.speed;
  player.vy = forwardY * player.speed;

  const friction = player.isDrifting
    ? PLAYER_CONFIG.DRIFT_FRICTION
    : PLAYER_CONFIG.LATERAL_FRICTION;

  player.vx *= friction;
  player.vy *= friction;

  // ================= COLISIONES ======================
  const newX = obj.x + player.vx;
  const newY = obj.y + player.vy;

const resolved = resolveCollisions(
  newX,
  newY,
  obj.z,
  COLLISION_CONFIG.PLAYER_RADIUS,
  player.tileMap,
  player.independentObjects,
  obj.x,  // ← Posición anterior X
  obj.y   // ← Posición anterior Y
);

if (resolved.blocked) {
  // ===== REBOTE TIPO KART =====
  player.vx *= -0.6;
  player.vy *= -0.6;
  player.speed *= -0.4;
} else {
  obj.x = resolved.x;
  obj.y = resolved.y;
}
  // ================= SALTO ======================
  const groundHeight = getTerrainHeight(
    obj.x,
    obj.y,
    player.tileMap,
    player.independentObjects
  );

  if (grounded) {
    player.coyoteTimer = PLAYER_CONFIG.COYOTE_TIME;
    player.jumpsRemaining = 1;
    player.wasGrounded = true;
  } else if (player.wasGrounded) {
    player.coyoteTimer -= deltaTime;
    player.wasGrounded = false;
  }

  if ((keys[' '] || keys['Spacebar']) && !player.isJumping) {
    if (grounded || player.coyoteTimer > 0) {
      player.velocityZ = PLAYER_CONFIG.JUMP_FORCE;
      player.isJumping = true;
      player.coyoteTimer = 0;
    }
  }

  if (!keys[' '] && !keys['Spacebar']) {
    player.isJumping = false;
  }

  if (!grounded || player.velocityZ > 0) {
    player.velocityZ -= PLAYER_CONFIG.GRAVITY;
    player.velocityZ = Math.max(
      player.velocityZ,
      -PLAYER_CONFIG.MAX_FALL_SPEED
    );
  } else {
    player.velocityZ = 0;
  }

  if (obj.z > 0 && !grounded){
    obj.z -=0.01
  }
  obj.z = (parseInt(obj.z) == 0) && ((obj.z - parseInt(obj.z) ) < 0.9 )? parseInt(obj.z) : obj.z ;

  obj.z += player.velocityZ;

  if (obj.z < groundHeight) {
    obj.z = groundHeight;
    player.velocityZ = 0;
  }


  // ================= ANIMACIÓN ======================
  updatePlayerAnimation(player, grounded);
}

// ================= HELPERS ======================
function getPlayerPosition(player) {
  return {
    x: player.object.x,
    y: player.object.y,
    z: player.object.z,
    angle: player.angle
  };
}

function getPlayerVelocity(player) {
  return {
    speed: player.speed,
    vx: player.vx,
    vy: player.vy,
    vz: player.velocityZ,
    drifting: player.isDrifting
  };
}

function applyImpulse(player, vx, vy, vz) {
  player.vx += vx;
  player.vy += vy;
  player.velocityZ += vz;
}
