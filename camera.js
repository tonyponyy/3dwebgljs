// camera.js - Cámara que sigue al jugador

const CAMERA_CONFIG = {
  DISTANCE: 5.0,      // Distancia detrás del jugador
  HEIGHT: 3.0,        // Altura sobre el jugador
  SMOOTHNESS: 0.25,   // Suavidad del seguimiento (0-1, menor = más suave)
  LOOK_AHEAD: 1.0     // Cuánto mira hacia adelante
};

/**
 * Actualiza la cámara para seguir al jugador
 */
function updatePlayerCamera(camera, player) {
  const pos = getPlayerPosition(player);
  if (pos.angle === 0){
    pos.angle= 0.3
  }
  v =(Math.abs(player.vy)+Math.abs(player.vx))*10;
  // Calcular posición objetivo detrás del jugador
  const targetX = pos.x + Math.sin(pos.angle) * CAMERA_CONFIG.DISTANCE+player.vx;
  const targetY = pos.y - Math.cos(pos.angle) * CAMERA_CONFIG.DISTANCE+player.vy;
  const targetZ = pos.z + CAMERA_CONFIG.HEIGHT;
  
  // Suavizar movimiento de la cámara (interpolación)
  camera.x += (targetX - camera.x) * CAMERA_CONFIG.SMOOTHNESS;
  camera.y += (targetY - camera.y) * CAMERA_CONFIG.SMOOTHNESS;
  camera.z += (targetZ - camera.z) * (CAMERA_CONFIG.SMOOTHNESS*3);
  
  // La cámara mira en la dirección del jugador
  camera.angle = pos.angle;
}

/**
 * Configuración alternativa: Cámara orbital (tercera persona clásica)
 * Descomenta esta función y úsala en lugar de updatePlayerCamera si prefieres
 * una cámara que puedas rotar independientemente con el mouse
 */
/*
function updateOrbitalCamera(camera, player, mouseX, mouseY) {
  const pos = getPlayerPosition(player);
  
  // Ángulo de la cámara basado en el mouse
  const cameraAngle = pos.angle + mouseX * 0.01;
  const cameraElevation = Math.max(0.1, Math.min(1.5, mouseY * 0.01));
  
  const targetX = pos.x + Math.sin(cameraAngle) * CAMERA_CONFIG.DISTANCE;
  const targetY = pos.y - Math.cos(cameraAngle) * CAMERA_CONFIG.DISTANCE;
  const targetZ = pos.z + CAMERA_CONFIG.HEIGHT + cameraElevation;
  
  camera.x += (targetX - camera.x) * CAMERA_CONFIG.SMOOTHNESS;
  camera.y += (targetY - camera.y) * CAMERA_CONFIG.SMOOTHNESS;
  camera.z += (targetZ - camera.z) * CAMERA_CONFIG.SMOOTHNESS;
  camera.angle = cameraAngle;
}
*/
