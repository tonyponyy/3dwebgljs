# Glitter7engine v0.0.1 Alpha

Motor de renderizado 3D pseudo-3D basado en WebGL2 para crear juegos y experiencias estilo retro con sprites 2D en un mundo 3D.

## Tabla de Contenidos

- [Instalación](#instalación)
- [Inicio Rápido](#inicio-rápido)
- [Configuración](#configuración)
- [API Reference](#api-reference)
- [Tipos de Tiles](#tipos-de-tiles)
- [Modelos 3D](#modelos-3d)
- [Sistema de Rampas](#sistema-de-rampas)
- [Efectos Visuales](#efectos-visuales)
- [Ejemplos](#ejemplos)

---

## Instalación

```html
<canvas id="gameCanvas"></canvas>
<script src="glitter7engine.js"></script>
```

---

## Inicio Rápido

```javascript
const canvas = document.getElementById('gameCanvas');

const engine = new Glitter7engine(canvas, {
  tileSize: 16,
  renderScale: 1.0,
  map: {
    mapWidth: 20,
    mapHeight: 20,
    array: [/* tu mapa aquí */]
  },
  billboardTiles: [2, 3, 4],
  blockTiles: [5, 6, 7],
  camera: { x: 10, y: 10, z: 1, angle: 0 }
});

// Cargar spritesheet
await engine.loadSpritesheet('spritesheet.png');

// Loop de render
function gameLoop() {
  engine.render();
  requestAnimationFrame(gameLoop);
}
gameLoop();
```

---

## Configuración

### Constructor: `new Glitter7engine(canvas, config)`

```javascript
const config = {
  // === MAPA ===
  tileSize: 16,              // Tamaño de cada tile en píxeles
  renderScale: 1.0,          // Escala de renderizado (0.5 = mitad resolución)
  maxRenderDistance: 100,    // Distancia máxima de renderizado
  frustumMargin: 0.4,        // Margen del frustum culling
  
  map: {
    mapWidth: 20,            // Ancho del mapa en tiles
    mapHeight: 20,           // Alto del mapa en tiles
    array: []                // Array 1D con índices de tiles
  },
  
  // === TILES ===
  billboardTiles: [2, 3, 4], // IDs de tiles que se renderizan como billboards
  blockTiles: [5, 6, 7],     // IDs de tiles que se renderizan como bloques 3D
  waterTiles: [8],           // IDs de tiles animados como agua
  tileHeights: {             // Alturas personalizadas por tile
    5: 1.5,
    6: 2.0
  },
  heightMap: [],             // Array 1D con alturas (0 = nivel del suelo)
  
  // === BILLBOARDS ===
  rotatableBillboards: [2, 3], // Billboards con 4 sprites (N, E, S, W)
  billboardScales: {           // Escala personalizada por billboard
    2: 1.5,
    3: 0.8
  },
  billboardGroundTiles: {      // Tile de suelo bajo el billboard
    2: 1,
    3: 1
  },
  defaultBillboardGround: 0,   // Tile por defecto (0 = sin suelo)
  
  // === MODELOS 3D ===
  model3dTiles: [10, 11],      // IDs de tiles que usan modelos .obj
  model3dConfig: {
    10: {
      modelName: 'tree',       // Nombre del modelo cargado
      scale: 1.0,              // Escala uniforme
      rotation: { x: 0, y: 0, z: 0 }, // Rotación en radianes
      height: 0,               // Altura base (usa heightMap si es 0)
      offset: { x: 0, y: 0, z: 0 },   // Offset de posición
      groundTile: 1            // Tile de suelo (0 = sin suelo)
    }
  },
  
  // === AGUA ===
  waterSpeed: 0.05,            // Velocidad de flujo del agua
  waterWave: 0.01,             // Amplitud de las olas
  
  // === RAMPAS ===
  rampEnabled: true,           // Activar sistema de rampas automáticas
  
  // === CÁMARA ===
  camera: {
    x: 10,                     // Posición X
    y: 10,                     // Posición Y
    z: 1.5,                    // Altura de la cámara
    angle: 0                   // Ángulo de rotación (radianes)
  },
  
  // === ILUMINACIÓN ===
  light: {
    illumination: true,        // Activar iluminación
    ambientLight: 0.5,         // Luz ambiental (0.0 - 1.0)
    lightDiffuse: 0.7,         // Intensidad de luz difusa
    lightDir: [0.3, 0.7, 0.5]  // Dirección de la luz (vector normalizado)
  },
  
  // === FONDO ===
  background: {
    color1: [0.5, 0.7, 1.0],   // Color superior del cielo (RGB 0-1)
    color2: [0.8, 0.9, 1.0]    // Color inferior del cielo
  },
  
  // === SKYDOME ===
  skydome: {
    enabled: false,            // Activar cúpula celeste con textura
    radius: 100,               // Radio de la cúpula
    segments: 32,              // Calidad de la geometría
    rep_h: 1,                  // Repeticiones horizontales de textura
    rep_v: 1                   // Repeticiones verticales de textura
  },
  
  // === NIEBLA ===
  fog: {
    enabled: true,             // Activar niebla
    start: 30,                 // Distancia donde empieza
    end: 80,                   // Distancia de niebla completa
    color: [0.5, 0.7, 1.0]     // Color de la niebla (RGB)
  }
};
```

---

## API Reference

### Métodos de Carga

#### `loadSpritesheet(imageSource)`
Carga el spritesheet con todos los tiles.

```javascript
await engine.loadSpritesheet('textures/tiles.png');
```

**Parámetros:**
- `imageSource` (String): URL de la imagen

**Returns:** Promise

---

#### `loadSkydomeTexture(imageSource)`
Carga la textura panorámica para el skydome.

```javascript
await engine.loadSkydomeTexture('textures/sky.png');
```

---

#### `loadModel(name, objUrl)`
Carga un modelo 3D en formato .OBJ.

```javascript
await engine.loadModel('tree', 'models/tree.obj');
```

**Parámetros:**
- `name` (String): Nombre identificador del modelo
- `objUrl` (String): URL del archivo .obj

**Returns:** Promise

---

### Métodos de Renderizado

#### `render(independentObjects = [], renderSky = true)`
Renderiza un frame completo.

```javascript
engine.render([
  { x: 5, y: 5, z: 0, tile: 2, scale: 1.5 }
], true);
```

**Parámetros:**
- `independentObjects` (Array): Objetos que no están en el tilemap
  - `x, y, z` (Number): Posición
  - `tile` (Number): ID del tile
  - `scale` (Number, opcional): Escala del objeto
  - `orientation` (Number, opcional): Ángulo fijo en radianes
- `renderSky` (Boolean): Si debe renderizar el fondo

---

### Métodos de Configuración de Mapa

#### `setTileMap(tileMap)`
Actualiza el mapa de tiles.

```javascript
const newMap = [
  1, 1, 1, 1,
  1, 0, 2, 1,
  1, 5, 0, 1,
  1, 1, 1, 1
];
engine.setTileMap(newMap);
```

---

### Métodos de Iluminación

#### `toggleIllumination()`
Activa/desactiva la iluminación.

```javascript
const isEnabled = engine.toggleIllumination();
```

#### `setIllumination(value)`
```javascript
engine.setIllumination(true);
```

#### `setAmbientLight(value)`
Ajusta la luz ambiental (0.0 - 1.0).

```javascript
engine.setAmbientLight(0.6);
```

#### `setLightDiffuse(value)`
Ajusta la intensidad de luz difusa (0.0 - 1.0).

```javascript
engine.setLightDiffuse(0.8);
```

#### `setLightDirection(x, y, z)`
Establece la dirección de la luz (se normaliza automáticamente).

```javascript
engine.setLightDirection(1, 1, 0); // Luz desde arriba-derecha
```

---

### Métodos de Cielo y Atmósfera

#### `setSkyColors(color1, color2)`
Cambia los colores del degradado del cielo.

```javascript
engine.setSkyColors(
  [1.0, 0.5, 0.3],  // Naranja (arriba)
  [0.3, 0.1, 0.5]   // Púrpura (abajo)
);
```

#### `enableSkydome(enabled)`
Activa/desactiva el skydome.

```javascript
engine.enableSkydome(true);
```

#### `setSkydomeRadius(radius)`
Ajusta el radio de la cúpula celeste.

```javascript
engine.setSkydomeRadius(150);
```

---

### Métodos de Niebla

#### `toggleFog()`
Activa/desactiva la niebla.

```javascript
const isEnabled = engine.toggleFog();
```

#### `setFogEnabled(value)`
```javascript
engine.setFogEnabled(true);
```

#### `setFogStart(value)`
```javascript
engine.setFogStart(20);
```

#### `setFogEnd(value)`
```javascript
engine.setFogEnd(100);
```

#### `setFogColor(r, g, b)`
```javascript
engine.setFogColor(0.8, 0.8, 0.9);
```

#### `setFogRange(start, end)`
```javascript
engine.setFogRange(30, 80);
```

---

### Métodos de Agua

#### `setWaterTiles(tiles)`
Define qué tiles se animan como agua.

```javascript
engine.setWaterTiles([8, 9, 10]);
```

#### `setWaterAnimation(speed, wave)`
Configura la animación del agua.

```javascript
engine.setWaterAnimation(0.08, 0.02);
```

---

### Métodos de Utilidad

#### `resize(width, height)`
Ajusta el tamaño del canvas.

```javascript
engine.resize(1920, 1080);
```

#### `createModelInstance(modelName, x, y, z, options)`
Crea una instancia de modelo 3D para renderizar como objeto independiente.

```javascript
const treeInstance = engine.createModelInstance('tree', 15, 15, 0, {
  scale: 1.5,
  rotation: { x: 0, y: Math.PI / 4, z: 0 },
  tile: 10
});

engine.render([treeInstance]);
```

---

## Tipos de Tiles

### 1. Tiles de Suelo (Ground Tiles)
Tiles normales que se renderizan en el suelo usando raycasting.

```javascript
// Tile 1 es un tile de suelo normal
map.array[index] = 1;
```

### 2. Billboards
Sprites 2D que siempre miran a la cámara.

```javascript
billboardTiles: [2, 3, 4]
```

**Características:**
- Siempre perpendiculares a la cámara
- Soportan escala personalizada
- Pueden tener altura elevada (usando `heightMap`)

### 3. Billboards Rotatables
Billboards con 4 sprites direccionales (Norte, Este, Sur, Oeste).

```javascript
rotatableBillboards: [2, 3],
// El spritesheet debe tener 4 tiles consecutivos:
// tile+0 = vista Norte
// tile+1 = vista Este
// tile+2 = vista Sur
// tile+3 = vista Oeste
```

### 4. Bloques 3D (Blocks)
Cubos sólidos con textura.

```javascript
blockTiles: [5, 6, 7],
tileHeights: {
  5: 1.0,   // Altura estándar
  6: 2.0,   // Bloque doble
  7: 0.5    // Bloque medio
}
```

### 5. Tiles de Agua
Tiles animados con movimiento de flujo.

```javascript
waterTiles: [8, 9],
waterSpeed: 0.05,
waterWave: 0.01
```

### 6. Modelos 3D
Modelos .OBJ personalizados.

```javascript
model3dTiles: [10],
model3dConfig: {
  10: {
    modelName: 'tree',
    scale: 1.0
  }
}
```

---

## Modelos 3D

### Cargar Modelos

```javascript
// 1. Cargar el modelo .OBJ
await engine.loadModel('tree', 'models/tree.obj');
await engine.loadModel('rock', 'models/rock.obj');

// 2. Configurar en el config
model3dTiles: [10, 11],
model3dConfig: {
  10: {
    modelName: 'tree',
    scale: 1.2,
    rotation: { x: 0, y: Math.PI / 4, z: 0 },
    height: 0,              // Usa heightMap
    offset: { x: 0, y: 0.5, z: 0 },
    groundTile: 1           // Grass debajo
  },
  11: {
    modelName: 'rock',
    scale: 0.8,
    rotation: { x: 0, y: 0, z: 0 },
    height: 1,              // Altura fija de 1
    groundTile: 5           // Bloque de piedra debajo
  }
}
```

### Formato .OBJ Soportado

El motor soporta archivos .OBJ con:
- Vértices (`v`)
- Coordenadas de textura (`vt`)
- Normales (`vn`)
- Caras triangulares y cuadradas (`f`)

**Ejemplo básico:**
```obj
v 0.0 0.0 0.0
v 1.0 0.0 0.0
v 0.0 1.0 0.0
vt 0.0 0.0
vt 1.0 0.0
vt 0.0 1.0
vn 0.0 0.0 1.0
f 1/1/1 2/2/1 3/3/1
```

---

## Sistema de Rampas

El motor genera automáticamente rampas cuando hay diferencias de altura de **exactamente 1 unidad** entre tiles adyacentes.

### Tipos de Rampas

#### 1. Rampa Recta
Se genera cuando hay un lado alto y los demás iguales.

```
Heightmap:
1 1 1
1 2 1  →  Rampa ascendente hacia el norte
1 1 1
```

#### 2. Esquina Exterior (Convexa)
Se genera cuando hay dos lados altos adyacentes.

```
Heightmap:
2 2 1
2 1 1  →  Esquina exterior en el noroeste
1 1 1
```

#### 3. Esquina Interior (Cóncava)
Se genera cuando hay dos lados bajos adyacentes.

```
Heightmap:
1 1 2
1 2 2  →  Esquina interior en el noroeste
2 2 2
```

### Configuración

```javascript
rampEnabled: true,  // Activar/desactivar rampas

heightMap: [
  0, 0, 0, 0,
  0, 1, 1, 0,
  0, 1, 2, 0,
  0, 0, 0, 0
]
```

**Notas:**
- Las rampas solo funcionan con diferencias de altura de **1 unidad**
- Diferencias mayores (2+) se renderizan como bloques apilados
- Las rampas usan la textura del tile correspondiente

---

## Efectos Visuales

### Ambient Occlusion (AO)
Los bloques tienen AO automático:
- Caras laterales más oscuras
- Base más oscura que la cima
- Gradiente vertical suave

### Iluminación Dinámica
```javascript
light: {
  illumination: true,
  ambientLight: 0.5,    // Luz base (sombras no completamente negras)
  lightDiffuse: 0.7,    // Intensidad de luz direccional
  lightDir: [0.3, 0.7, 0.5]  // Vector de dirección
}
```

### Niebla con Altura
La niebla es más densa cerca del suelo y menos densa en altura.

```javascript
fog: {
  enabled: true,
  start: 30,
  end: 80,
  color: [0.7, 0.8, 0.9]
}
```

---

## Ejemplos

### Ejemplo 1: Mundo Simple

```javascript
const canvas = document.getElementById('canvas');
const engine = new Glitter7engine(canvas, {
  tileSize: 16,
  map: {
    mapWidth: 10,
    mapHeight: 10,
    array: [
      1,1,1,1,1,1,1,1,1,1,
      1,0,0,0,2,0,0,0,0,1,
      1,0,5,0,0,0,5,0,0,1,
      1,0,0,0,0,0,0,0,0,1,
      1,2,0,0,8,8,0,0,2,1,
      1,0,0,0,8,8,0,0,0,1,
      1,0,5,0,0,0,5,0,0,1,
      1,0,0,0,0,0,0,0,0,1,
      1,0,0,0,2,0,0,0,0,1,
      1,1,1,1,1,1,1,1,1,1
    ]
  },
  billboardTiles: [2],
  blockTiles: [5],
  waterTiles: [8],
  camera: { x: 5, y: 5, z: 1.5, angle: 0 }
});

await engine.loadSpritesheet('tiles.png');

function gameLoop() {
  // Mover cámara con teclado
  if (keys.w) engine.camera.y -= 0.1;
  if (keys.s) engine.camera.y += 0.1;
  if (keys.a) engine.camera.x -= 0.1;
  if (keys.d) engine.camera.x += 0.1;
  if (keys.q) engine.camera.angle -= 0.05;
  if (keys.e) engine.camera.angle += 0.05;
  
  engine.render();
  requestAnimationFrame(gameLoop);
}
gameLoop();
```

### Ejemplo 2: Terreno con Altura

```javascript
const engine = new Glitter7engine(canvas, {
  tileSize: 16,
  map: {
    mapWidth: 5,
    mapHeight: 5,
    array: [
      1,1,1,1,1,
      1,1,1,1,1,
      1,1,1,1,1,
      1,1,1,1,1,
      1,1,1,1,1
    ]
  },
  heightMap: [
    0,0,0,0,0,
    0,1,1,1,0,
    0,1,2,1,0,
    0,1,1,1,0,
    0,0,0,0,0
  ],
  rampEnabled: true,
  camera: { x: 2.5, y: 2.5, z: 3, angle: 0 }
});

await engine.loadSpritesheet('tiles.png');
engine.render();
```

### Ejemplo 3: Objetos Independientes

```javascript
const trees = [
  { x: 3, y: 3, z: 0, tile: 2, scale: 1.5 },
  { x: 7, y: 5, z: 0, tile: 2, scale: 1.2 },
  { x: 5, y: 8, z: 0, tile: 2, scale: 1.0, orientation: Math.PI / 2 }
];

function gameLoop() {
  engine.render(trees);
  requestAnimationFrame(gameLoop);
}
gameLoop();
```

### Ejemplo 4: Ciclo Día/Noche

```javascript
let time = 0;

function gameLoop() {
  time += 0.01;
  
  // Color del cielo
  const dayColor = [0.5, 0.7, 1.0];
  const nightColor = [0.05, 0.05, 0.2];
  const t = (Math.sin(time) + 1) / 2;
  
  const skyColor = dayColor.map((c, i) => 
    c * t + nightColor[i] * (1 - t)
  );
  
  engine.setSkyColors(skyColor, skyColor);
  
  // Luz direccional
  const sunAngle = time;
  engine.setLightDirection(
    Math.cos(sunAngle),
    Math.sin(sunAngle),
    0.5
  );
  
  engine.setAmbientLight(0.3 + t * 0.4);
  
  engine.render();
  requestAnimationFrame(gameLoop);
}
```

---

## Rendimiento

### Optimizaciones Implementadas

- **Instanced Rendering**: Bloques y billboards del mismo tipo se dibujan en una sola llamada
- **Frustum Culling**: Solo se renderizan objetos visibles
- **Distance Culling**: Objetos lejanos no se procesan
- **Batch Rendering**: Objetos del mismo tipo se agrupan automáticamente

### Consejos de Optimización

1. **Usar renderScale < 1.0** para dispositivos móviles
```javascript
renderScale: 0.75  // 75% de resolución
```

2. **Ajustar maxRenderDistance**
```javascript
maxRenderDistance: 50  // En lugar de 100
```

3. **Limitar segmentos del skydome**
```javascript
skydome: {
  segments: 16  // En lugar de 32
}
```

---

## Limitaciones Conocidas

- Solo soporta spritesheets horizontales (tiles en fila)
- Los modelos .OBJ no soportan materiales MTL (usa tiles del spritesheet)
- Las rampas solo funcionan con diferencias de altura de 1 unidad
- El skydome no rota con la cámara (solo traslación)
- No hay soporte para animaciones de sprites (excepto agua)

---

## Créditos

**Glitter7engine v0.0.1 Alpha**  
By TonyPonyy

Motor de renderizado 3D con WebGL2.

---

