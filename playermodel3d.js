// ======================================================
// player_model3d.js – Físicas PERRONAS tipo KART
// ======================================================

// ================= CONFIGURACIÓN ======================
const PLAYER_CONFIG = {
  // Kart
  MAX_SPEED: 0.80,
  MAX_SPEED_TURBO: 1.6,
  ACCELERATION: 0.003,
  BRAKE_DECELERATION: 0.04,
  ROLL_DECELERATION: 0.006,

  // Derrape
LATERAL_FRICTION: 0.85,
DRIFT_FRICTION: 0.93,
DRIFT_STEER_MULT: 0.6,
AUTO_DRIFT_THRESHOLD: 0.999,  // ✅ NUEVO - Umbral de giro para derrape automático (0-1)
AUTO_DRIFT_MIN_SPEED: 0.3,  // ✅ NUEVO - Velocidad mínima para auto-derrapar

  // Dirección
  STEER_ANGLE: 0.045,
  STEER_RESPONSE: 0.18,
  MIN_STEER_SPEED: 0.05,
  //TURBO COUNT :
  TURBO_COUNT:100000,
  TURBO_LOSS:0.3,


  // Salto
  JUMP_FORCE: 0.0,
  GRAVITY: 0.015,
  MAX_FALL_SPEED: 0.3,
  COYOTE_TIME: 0.2,
  
  // ✅ FÍSICAS PERRONAS
  BOUNCE_DAMPING: 1.4,        // Rebote al caer (0.0 = sin rebote, 1.0 = rebote total)
  MIN_BOUNCE_VELOCITY: 0.15,  // Velocidad mínima para rebotar
  ROTATION_SMOOTHING: 0.15,   // Suavizado de rotación (más bajo = más suave)
  TILT_SPEED_FACTOR: 0.3,     // Inclinación por velocidad en rampas
  LEAN_ANGLE_MAX: 0.3,        // Inclinación lateral máxima en curvas
  LEAN_SPEED: 0.12,           // Velocidad de inclinación lateral
  PITCH_SPEED: 0.2,           // Velocidad de cabeceo (adelante/atrás)
  MAX_PITCH: 0.9,             // Cabeceo máximo
  AIR_ROTATION_SPEED: 0.05    // Rotación adicional en el aire
};

// ================= CONFIGURACIÓN MODELO 3D ======================
const MODEL_CONFIG = {
  MODEL_NAME: 'coche',
  SCALE: 0.6,
  OFFSET: { x: 0, y: 0, z: 0 },
  BASE_ROTATION: { x: 1, y: 10, z: 0 },
  TILE: 51
};

// ================= INICIALIZACIÓN ======================
function initPlayer(playerObject, tileMap, independentObjects) {
  const modelObject = {
    type: 'model3d',
    modelName: MODEL_CONFIG.MODEL_NAME,
    x: playerObject.x,
    y: playerObject.y,
    z: playerObject.z,
    tile: MODEL_CONFIG.TILE,
    scale: MODEL_CONFIG.SCALE,
    rotation: { ...MODEL_CONFIG.BASE_ROTATION },
    turbo: false
  };

  return {
    object: modelObject,

    // Movimiento
    vx: 0,
    vy: 0,
    speed: 0,
    //turbo count
    turbo_count: PLAYER_CONFIG.TURBO_COUNT,
    turbo_temp:0,
    // Dirección
    angle: 0,
    steer: 0,
    isDrifting: false,
    autoDriftActive: false,
    // Vertical
    velocityZ: 0,
    isJumping: false,
    jumpsRemaining: 1,
    coyoteTimer: 0,
    wasGrounded: false,
    
    // ✅ FÍSICAS PERRONAS - Rotación
    pitch: 0,          // Cabeceo (adelante/atrás)
    roll: 0,           // Inclinación lateral
    targetPitch: 0,    // Cabeceo objetivo
    targetRoll: 0,     // Inclinación objetivo
    lastGroundHeight: 0,
    wasInAir: false,
    airTime: 0,

    // Referencias
    tileMap,
    independentObjects
  };
}

// ================= UPDATE PRINCIPAL ======================
function updatePlayer(player, keys, deltaTime = 1 / 60) {
    update_turbo();

  const obj = player.object;
  const grounded = isGrounded(
    obj.x,
    obj.y,
    obj.z,
    player.tileMap,
    player.independentObjects
  );

  // ================= ACELERACIÓN ======================
  if ((keys['Spacebar'] ||  keys[' ']) && player.turbo_count > 0 ) {
    player.turbo = true;
    player.turbo_count -=PLAYER_CONFIG.TURBO_LOSS
  }else{
    player.turbo = false;
  }
  
  if (keys['ArrowUp'] || keys['w']) {
    if ( !player.turbo){
    player.speed += PLAYER_CONFIG.ACCELERATION;
    }else{
    player.speed += PLAYER_CONFIG.ACCELERATION*3;
    }
    
  } else if (keys['ArrowDown'] || keys['s']) {
    player.speed -= PLAYER_CONFIG.BRAKE_DECELERATION;
  } else {
    if (player.speed > 0) player.speed -= PLAYER_CONFIG.ROLL_DECELERATION;
    if (player.speed < 0) player.speed += PLAYER_CONFIG.ROLL_DECELERATION;
  }
  if (player.turbo){
  if (player.speed > PLAYER_CONFIG.MAX_SPEED_TURBO ){
        player.speed -= 0.009
    }
  }else{
   if (player.speed > PLAYER_CONFIG.MAX_SPEED ){
        player.speed -= 0.006
    }

  }
   if (player.speed < -0.2){
        player.speed = -0.2
    }

  // ================= DIRECCIÓN ======================
  // ================= DIRECCIÓN ======================
let steerInput = 0;
if (keys['ArrowLeft'] || keys['a']) steerInput += 1;
if (keys['ArrowRight'] || keys['d']) steerInput -= 1;

// ✅ DERRAPE AUTOMÁTICO - Se activa con giros pronunciados
const speedRatio = Math.abs(player.speed) / PLAYER_CONFIG.MAX_SPEED;
const isSteeringHard = Math.abs(steerInput) > 0 && speedRatio > PLAYER_CONFIG.AUTO_DRIFT_MIN_SPEED;

// Activar auto-drift si el giro es muy pronunciado
if (isSteeringHard && Math.abs(player.steer) > PLAYER_CONFIG.AUTO_DRIFT_THRESHOLD * PLAYER_CONFIG.STEER_ANGLE) {
  player.autoDriftActive = true;
  accion_derrape();
} else if (Math.abs(steerInput) < 0.5 || speedRatio < PLAYER_CONFIG.AUTO_DRIFT_MIN_SPEED * 0.8) {
  // Desactivar cuando se suelta el giro o se va muy lento
  player.autoDriftActive = false;
}

// Combinar drift manual (Shift) con drift automático
player.isDrifting = keys['Shift'] || player.autoDriftActive;

const steerStrength =
  Math.abs(player.speed) > PLAYER_CONFIG.MIN_STEER_SPEED
    ? steerInput * PLAYER_CONFIG.STEER_ANGLE
    : 0;

const steerMult = player.isDrifting
  ? PLAYER_CONFIG.DRIFT_STEER_MULT
  : 1;
const airControlFactor = grounded ? 1.0 : 0.3; // Solo 30% de control en el aire
player.steer +=
  (steerStrength * steerMult - player.steer) *
  PLAYER_CONFIG.STEER_RESPONSE * airControlFactor;

player.angle += player.steer * Math.sign(player.speed);

  // ================= VECTOR MOVIMIENTO ======================
  const forwardX = -Math.sin(player.angle);
  const forwardY = Math.cos(player.angle);

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
    obj.x,
    obj.y
  );

  if (resolved.blocked) {
    player.vx *= -0.6;
    player.vy *= -0.6;
    player.speed *= -0.4;
  } else {
    obj.x = resolved.x;
    obj.y = resolved.y;
  }

  // ================= ALTURA DEL TERRENO ======================
  const groundHeight = getTerrainHeight(
    obj.x,
    obj.y,
    player.tileMap,
    player.independentObjects
  );

  // ✅ CALCULAR PENDIENTE DEL TERRENO
  const slopeData = getTerrainSlope(
    obj.x,
    obj.y,
    player.tileMap,
    player.independentObjects
  );

  // ================= SALTO Y GRAVEDAD ======================
  if (grounded) {
    player.coyoteTimer = PLAYER_CONFIG.COYOTE_TIME;
    player.jumpsRemaining = 1;
    player.wasGrounded = true;
    
    // ✅ REBOTE AL ATERRIZAR
    if (player.wasInAir && Math.abs(player.velocityZ) > PLAYER_CONFIG.MIN_BOUNCE_VELOCITY) {
      const bounceForce = -player.velocityZ * PLAYER_CONFIG.BOUNCE_DAMPING;
      player.velocityZ = bounceForce;
      player.wasInAir = false;
       // ✅ PERDER VELOCIDAD AL CAER - Más impacto = más pérdida
  const impactForce = Math.abs(player.velocityZ);
  const speedLoss = Math.min(0.4, impactForce * 0.8); // Hasta 40% de pérdida
  player.speed *= (1 - speedLoss);
      
      // Pequeño impulso hacia arriba visual
      player.targetPitch = -0.2;
    //const framesInAir = Math.floor(player.airTime * 60); // Convertir tiempo a frames (60 FPS)
    accion_salto(player.airTime);

    } else {
      player.velocityZ = 0;
      player.wasInAir = false;
    }
    
    player.airTime = 0;
  } else {
    if (player.wasGrounded) {
      player.coyoteTimer -= deltaTime;
      player.wasGrounded = false;
    }
    player.wasInAir = true;
    player.airTime += deltaTime;
  }

  if ((keys[' '] || keys['Spacebar']) && !player.isJumping) {
    if (grounded || player.coyoteTimer > 0) {
      player.velocityZ = PLAYER_CONFIG.JUMP_FORCE;
      player.isJumping = true;
      player.coyoteTimer = 0;
      player.targetPitch = 0.15; // Cabeceo al saltar
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
  }

  // Ajuste de altura
  obj.z = (parseInt(obj.z) == 0) && ((obj.z - parseInt(obj.z)) < 0.9) 
    ? parseInt(obj.z) 
    : obj.z;

  obj.z += player.velocityZ;

  if (obj.z < groundHeight) {
    obj.z = groundHeight;
  }

  // ================= ✅ FÍSICAS PERRONAS - ROTACIÓN ======================
  
  // 1. CABECEO (PITCH) - Inclinación adelante/atrás
  if (grounded) {
    // En rampa: inclinar según pendiente
    const speedFactor = Math.abs(player.speed) / PLAYER_CONFIG.MAX_SPEED;
    player.targetPitch = slopeData.pitch * PLAYER_CONFIG.TILT_SPEED_FACTOR * speedFactor;
    
    // Aceleración/frenado: cabeceo adicional
    if (keys['ArrowUp'] || keys['w']) {
      player.targetPitch -= 0.08 * speedFactor;
    } else if (keys['ArrowDown'] || keys['s']) {
      player.targetPitch += 0.12 * speedFactor;
    }
  } else {
    // En el aire: cabeceo según velocidad vertical
    player.targetPitch = Math.max(-PLAYER_CONFIG.MAX_PITCH, 
                                   Math.min(PLAYER_CONFIG.MAX_PITCH, 
                                            -player.velocityZ * 0.8));
    
    // Rotación adicional en el aire si se mantiene presionada una tecla
    if (keys['ArrowUp'] || keys['w']) {
      player.targetPitch -= PLAYER_CONFIG.AIR_ROTATION_SPEED;
    } else if (keys['ArrowDown'] || keys['s']) {
      player.targetPitch += PLAYER_CONFIG.AIR_ROTATION_SPEED;
    }
  }
  
  // Suavizar cabeceo
  player.pitch += (player.targetPitch - player.pitch) * PLAYER_CONFIG.PITCH_SPEED;
  
  // 2. INCLINACIÓN LATERAL (ROLL) - En curvas
  if (grounded) {
    // Inclinación por curvas
    const turnSpeed = player.steer * Math.abs(player.speed);
    player.targetRoll = -turnSpeed * PLAYER_CONFIG.LEAN_ANGLE_MAX * 8;
    
    // Inclinación por pendiente lateral
    player.targetRoll += slopeData.roll * 0.5;
  } else {
    // En el aire: mantener inclinación pero reducida
    player.targetRoll *= 0.95;
  }
  
  // Limitar y suavizar roll
  player.targetRoll = Math.max(-PLAYER_CONFIG.LEAN_ANGLE_MAX, 
                                 Math.min(PLAYER_CONFIG.LEAN_ANGLE_MAX, 
                                          player.targetRoll));
  player.roll += (player.targetRoll - player.roll) * PLAYER_CONFIG.LEAN_SPEED;
  
  // 3. APLICAR ROTACIÓN AL MODELO 3D
  obj.rotation.x = player.pitch;  // Cabeceo
  obj.rotation.y = 12.6 + player.angle;  // Dirección
  obj.rotation.z = player.roll;  // Inclinación lateral

  // ================= ACTUALIZAR ARRAY ======================
  const ARRAY_PLAYER = 0;
  resolve_all(obj, ARRAY_PLAYER, coches);
}

// ================= ✅ CALCULAR PENDIENTE DEL TERRENO ======================
function getTerrainSlope(x, y, tileMap, independentObjects) {
  const step = 0.9; // Distancia para samplear
  
  // Obtener alturas en 4 puntos alrededor
  const hCenter = getTerrainHeight(x, y, tileMap, independentObjects);
  const hFront = getTerrainHeight(x - Math.sin(0) * step, y + Math.cos(0) * step, tileMap, independentObjects);
  const hBack = getTerrainHeight(x + Math.sin(0) * step, y - Math.cos(0) * step, tileMap, independentObjects);
  const hLeft = getTerrainHeight(x - step, y, tileMap, independentObjects);
  const hRight = getTerrainHeight(x + step, y, tileMap, independentObjects);
  
  // Calcular pendientes
  const pitchSlope = (hFront - hBack) / (step * 2);
  const rollSlope = (hRight - hLeft) / (step * 2);
  
  return {
    pitch: Math.atan(pitchSlope),  // Inclinación adelante/atrás
    roll: Math.atan(rollSlope)     // Inclinación lateral
  };
}

// ================= HELPERS ======================
function resolve_all(obj, n_array, independentObjects) {
  independentObjects[n_array].x = obj.x;
  independentObjects[n_array].y = obj.y;
  independentObjects[n_array].z = obj.z;
  independentObjects[n_array].rotation = obj.rotation;
}

function getPlayerPosition(player) {
  return {
    x: player.object.x,
    y: player.object.y,
    z: player.object.z,
    angle: player.angle,
    pitch: player.pitch,
    roll: player.roll
  };
}

function getPlayerVelocity(player) {
  return {
    speed: player.speed,
    vx: player.vx,
    vy: player.vy,
    vz: player.velocityZ,
    drifting: player.isDrifting,
    airborne: player.wasInAir
  };
}

function applyImpulse(player, vx, vy, vz) {
  player.vx += vx;
  player.vy += vy;
  player.velocityZ += vz;
}

// ================= EFECTOS ADICIONALES ======================
function resetPlayerRotation(player) {
  player.pitch = 0;
  player.roll = 0;
  player.targetPitch = 0;
  player.targetRoll = 0;
}

function setPlayerAirControl(enabled) {
  if (enabled) {
    PLAYER_CONFIG.AIR_ROTATION_SPEED = 0.05;
  } else {
    PLAYER_CONFIG.AIR_ROTATION_SPEED = 0;
  }
}

// ================= CONFIGURACIÓN DEL MODELO ======================
function setPlayerModel(modelName, scale, tile) {
  MODEL_CONFIG.MODEL_NAME = modelName;
  MODEL_CONFIG.SCALE = scale;
  MODEL_CONFIG.TILE = tile;
}

function setPlayerModelOffset(x, y, z) {
  MODEL_CONFIG.OFFSET = { x, y, z };
}

function setPlayerModelRotation(x, y, z) {
  MODEL_CONFIG.BASE_ROTATION = { x, y, z };
}

// ================= TUNNING FÍSICAS ======================
function setPhysicsConfig(config) {
  Object.assign(PLAYER_CONFIG, config);
}

function getPhysicsConfig() {
  return { ...PLAYER_CONFIG };
}

function accion_derrape(){
    console.log("derrape")
    player.turbo_temp +=10
}

function accion_salto(tiempo){
    let frames = Math.floor(tiempo * 60);
    let boost_turbo = parseInt(frames/3)
    console.log("ha estado en el aire un total de "+frames+" frames!, boost turbo +"+boost_turbo+"%")
    player.turbo_temp += boost_turbo
}

function update_turbo(){
    if (player.turbo_temp > 0){
        player.turbo_temp--
        player.turbo_count++
        
    }
}