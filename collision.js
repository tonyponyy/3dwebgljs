// collision.js - Sistema de colisiones y detección de terreno

const COLLISION_CONFIG = {
  PLAYER_RADIUS: 0.3,
  STEP_HEIGHT: 0.5,  // Altura máxima que puede subir sin saltar
  GROUND_CHECK_DISTANCE: 0.1
};

/**
 * Obtiene la altura del terreno en una posición específica
 */
function getTerrainHeight(x, y, tileMap, independentObjects) {
  let maxHeight = 0;
  
  // Verificar tiles del mapa
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  
  if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_WIDTH) {
    const index = tileY * MAP_WIDTH + tileX;
    const tile = tileMap[index];
    
    if (tile !== 0) {
      // Si es un bloque, obtener su altura
      if (block_tiles.includes(tile)) {
        maxHeight = tile_heights[tile] || 0;
      }
    }
  }
  
  // Verificar objetos independientes (excepto el jugador)
  for (const obj of independentObjects) {
    if (!block_tiles.includes(obj.tile)) continue;
    
    const dx = x - obj.x;
    const dy = y - obj.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Si está dentro del bloque
    if (distance < 0.5) {
      const height = tile_heights[obj.tile] || 0;
      maxHeight = Math.max(maxHeight, height);
    }
  }
  
  return maxHeight;
}

/**
 * Verifica colisión circular con objetos
 */
function checkCollision(x, y, playerZ, radius, tileMap, independentObjects, skipPlayer = true) {
  const collisions = [];
  
  // Verificar tiles del mapa
  const minX = Math.floor(x - radius);
  const maxX = Math.ceil(x + radius);
  const minY = Math.floor(y - radius);
  const maxY = Math.ceil(y + radius);
  
  for (let tileY = minY; tileY <= maxY; tileY++) {
    for (let tileX = minX; tileX <= maxX; tileX++) {
      if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_WIDTH) continue;
      
      const index = tileY * MAP_WIDTH + tileX;
      const tile = tileMap[index];
      
      if (tile === 0) continue;
      
      if (!block_tiles.includes(tile)) continue;
      
      // Centro del tile
      const tileCenterX = tileX + 0.5;
      const tileCenterY = tileY + 0.5;
      
      // Obtener altura del bloque
      const blockHeight = tile_heights[tile] || 0;
      
      // Si el jugador está por encima del bloque, puede caminar sobre él
      if (playerZ >= blockHeight - COLLISION_CONFIG.STEP_HEIGHT) continue;
      
      // Colisión circular
      const dx = x - tileCenterX;
      const dy = y - tileCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < radius + 0.5) {
        collisions.push({
          x: tileCenterX,
          y: tileCenterY,
          distance,
          normal: { x: dx / distance, y: dy / distance }
        });
      }
    }
  }
  
  // Verificar objetos independientes
  for (let i = 0; i < independentObjects.length; i++) {
    if (skipPlayer && i === 0) continue; // Saltar el jugador
    
    const obj = independentObjects[i];
    if (!block_tiles.includes(obj.tile)) continue;
    
    const blockHeight = tile_heights[obj.tile] || 0;
    
    // Si el jugador está por encima del bloque, puede caminar sobre él
    if (playerZ >= blockHeight - COLLISION_CONFIG.STEP_HEIGHT) continue;
    
    const dx = x - obj.x;
    const dy = y - obj.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < radius + 0.5) {
      collisions.push({
        x: obj.x,
        y: obj.y,
        distance,
        normal: { x: dx / distance, y: dy / distance }
      });
    }
  }
  
  return collisions;
}

/**
 * Resuelve colisiones empujando al jugador fuera
 */
function resolveCollisions(x, y, z, radius, tileMap, independentObjects) {
  let newX = x;
  let newY = y;
  
  const collisions = checkCollision(x, y, z, radius, tileMap, independentObjects);
  
  for (const collision of collisions) {
    const overlap = (radius + 0.5) - collision.distance;
    if (overlap > 0) {
      newX += collision.normal.x * overlap;
      newY += collision.normal.y * overlap;
    }
  }
  
  return { x: newX, y: newY };
}

/**
 * Verifica si el jugador está en el suelo
 */
function isGrounded(x, y, z, tileMap, independentObjects) {
  const groundHeight = getTerrainHeight(x, y, tileMap, independentObjects);
  return Math.abs(z - groundHeight) < COLLISION_CONFIG.GROUND_CHECK_DISTANCE;
}
