//   ▄████  ▄▄    ▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄  ██████ ██████ ▄▄  ▄▄  ▄▄▄▄ ▄▄ ▄▄  ▄▄ ▄▄▄▄▄
//  ██  ▄▄▄ ██    ██   ██     ██   ██▄▄  ██▄█▄   ▄██▀ ██▄▄   ███▄██ ██ ▄▄ ██ ███▄██ ██▄▄  V.0.0.1 alpha
//   ▀███▀  ██▄▄▄ ██   ██     ██   ██▄▄▄ ██ ██  ██▀   ██▄▄▄▄ ██ ▀██ ▀███▀ ██ ██ ▀██ ██▄▄▄  By TonyPonyy

//constantes
const BILLBOARD_MINIM_SIZE = 0.01;
const FOG_ENABLED_DEFAULT = true;
const FOG_START_DEFAULT = 30;
const FOG_END_DEFAULT = 80;
const CANVAS_POWER_PREFERENCE_DEFAULT = "high-performance";
const CANVAS_ANTIALIAS_DEFAULT = true;
const SKYDOME_HORIZONTAL_REP_DEFAULT = "1";
const SKYDOME_VERTICAL_REP_DEFAULT = "1";
const SKYDOME_RADIUS_DEFAULT = 100;
const SKYDOME_SEGMENTS_DEFAULT = 32;
const SKYDOME_ENABLED_DEFAULT = false;
const MAX_RENDER_DISTANCE_DEFAULT = 100;
const FRUSTUM_MARGIN_DEFAULT = 0.4;
const DEFAULT_BILLBOARD_GROUND_DEFAULT = 0;
const WATER_TILES_DEFAULT = [];
const WATER_SPEED_DEFAULT = 0.05;
const WATER_WAVE_DEFAULT = 0.01;

class Glitter7engine {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    //creamos la camara
    this.camera = { x: 0, y: 0, z: 0, angle: 0 };

    // Configuración
    this.MAX_RENDER_DISTANCE =
      config.maxRenderDistance || MAX_RENDER_DISTANCE_DEFAULT;
    this.FRUSTUM_MARGIN = this.transformNumber(config.frustumMargin || 0.4);
    this.TILE_SIZE = this.transformNumber(config.tileSize);
    this.MAP_WIDTH = config.map.mapWidth;
    this.MAP_HEIGHT = config.map.mapHeight;
    this.RENDER_SCALE = this.transformNumber(config.renderScale || 1.0);

    // Tiles
    this.billboard_tiles = config.billboardTiles || [];
    this.block_tiles = config.blockTiles || [];
    this.billboard_tiles_set = new Set(this.billboard_tiles);
    this.block_tiles_set = new Set(this.block_tiles);
    this.tile_heights = config.tileHeights || {};
    this.heightMap = config.heightMap || null;
    this.DEFAULT_BILLBOARD_GROUND =
      config.defaultBillboardGround || DEFAULT_BILLBOARD_GROUND_DEFAULT;
    this.billboard_ground_tiles = config.billboardGroundTiles || {};
    //aguas
    this.water_tiles = config.waterTiles || WATER_TILES_DEFAULT;
    this.water_tiles_set = new Set(this.water_tiles);
    this.WATER_SPEED = config.waterSpeed || WATER_SPEED_DEFAULT;
    this.WATER_WAVE = config.waterWave || WATER_WAVE_DEFAULT;
    this.time = 0; // Para animaciones
    // Billboards rotables y escalas
    this.rotatable_billboards = config.rotatableBillboards || [];
    this.rotatable_billboards_set = new Set(this.rotatable_billboards);
    this.billboard_scales = config.billboardScales || {}; // {tile: scale}

    //modelos 3d
    // NUEVO: Configuración de modelos 3D
    this.model3d_tiles = config.model3dTiles || [];
    this.model3d_tiles_set = new Set(this.model3d_tiles);
    this.model3d_config = config.model3dConfig || {}; // {tile: {modelName, scale, rotation, height}}

    // Tipos de rampas posibles
    this.RAMP_ENABLED =
      config.rampEnabled !== undefined ? config.rampEnabled : true;
    this.RAMP_TYPES = {
      STRAIGHT: "straight", // Rampa recta (1 lado alto, 1 bajo)
      INNER_CORNER: "inner", // Esquina interior (2 lados altos adyacentes)
      OUTER_CORNER: "outer", // Esquina exterior (2 lados bajos adyacentes)
      NONE: "none",
    };

    // Iluminación
    if (config.light != null) {
      this.ILLUMINATION =
        config.light.illumination !== undefined
          ? config.light.illumination
          : true;
      this.AMBIENT_LIGHT = config.light.ambientLight || 0.5;
      this.LIGHT_DIFFUSE = config.light.lightDiffuse || 0.7;
      this.lightDir = config.light.lightDir || [0.3, 0.7, 0.5];
    } else {
      (this.ILLUMINATION = true), (this.AMBIENT_LIGHT = 0.5);
      this.LIGHT_DIFFUSE = 0.7;
      this.lightDir = [0.3, 0.7, 0.5];
    }

    if (config.camera) {
      this.camera.x = config.camera.x || 0;
      this.camera.y = config.camera.y || 0;
      this.camera.z = config.camera.z || 0;
      this.angle = config.camera.angle || 0;
    }

    // Colores del cielo
    if (config.background != null) {
      this.color1 = this.normalizeColor(config.background.color1) || [
        0.5, 0.7, 1.0,
      ];
      this.color2 =
        this.normalizeColor(config.background.color2) || this.color1;
    } else {
      this.color1 = [0.5, 0.7, 1.0];
      this.color2 = this.color1;
    }

    // Skydome
    if (config.skydome) {
      this.SKYDOME_ENABLED =
        config.skydome.enabled !== undefined
          ? config.skydome.enabled
          : SKYDOME_ENABLED_DEFAULT;
      this.SKYDOME_RADIUS = config.skydome.radius || SKYDOME_RADIUS_DEFAULT;
      this.SKYDOME_SEGMENTS =
        config.skydome.segments || SKYDOME_SEGMENTS_DEFAULT;
      this.skydomeTexture = null;
      this.skydome_rep_h = this.transformNumber(
        config.skydome.rep_h || SKYDOME_HORIZONTAL_REP_DEFAULT
      );
      this.skydome_vert_ajust = this.transformNumber(
        config.skydome.rep_v || SKYDOME_VERTICAL_REP_DEFAULT
      );
    } else {
      this.SKYDOME_ENABLED = SKYDOME_ENABLED_DEFAULT;
      this.SKYDOME_RADIUS = SKYDOME_RADIUS_DEFAULT;
      this.SKYDOME_SEGMENTS = SKYDOME_SEGMENTS_DEFAULT;
      this.skydomeTexture = null;
      this.skydome_rep_h = this.transformNumber(SKYDOME_HORIZONTAL_REP_DEFAULT);
      this.skydome_vert_ajust = this.transformNumber(
        SKYDOME_VERTICAL_REP_DEFAULT
      );
    }
    // Niebla
    if (config.fog) {
      this.FOG_ENABLED =
        config.fog.enabled !== undefined
          ? config.fog.enabled
          : FOG_ENABLED_DEFAULT;
      this.FOG_START = config.fog.start || FOG_START_DEFAULT; // Distancia donde empieza la niebla
      this.FOG_END = config.fog.end || FOG_END_DEFAULT; // Distancia donde es niebla completa
      this.FOG_COLOR = config.fog.color || this.color1; // Color de la niebla
    } else {
      this.FOG_ENABLED = FOG_ENABLED_DEFAULT;
      this.FOG_START = FOG_START_DEFAULT; // Distancia donde empieza la niebla
      this.FOG_END = FOG_END_DEFAULT; // Distancia donde es niebla completa
      this.FOG_COLOR = this.color1; // Color de la niebla
    }
    //this.billboardInstanceData = null; // Se inicializa dinámicamente según necesidad
    //this.maxBillboardInstances = 20; // Aumentar si tienes más billboards
    //modelo 3d
    this.models3D = new Map(); // Caché de modelos cargados
    this.modelBuffers = new Map(); // Buffers WebGL por modelo
    // WebGL Context
    let contextOptions = this.canvas.getContext("webgl2", {
      alpha: CANVAS_ANTIALIAS_DEFAULT,
      depth: true,
      stencil: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: CANVAS_POWER_PREFERENCE_DEFAULT, //''default',low-power,'high-performance',
      failIfMajorPerformanceCaveat: false, // <-- para que en chrome pueda usar la gpu
    });

    this.gl = this.canvas.getContext("webgl2", contextOptions);

    if (!this.gl) {
      // Fallback a WebGL1
      console.warn("WebGL2 no disponible, intentando WebGL1...");
      this.gl =
        this.canvas.getContext("webgl", contextOptions) ||
        this.canvas.getContext("experimental-webgl", contextOptions);
    }

    if (!this.gl) {
      throw new Error("WebGL no está disponible en este navegador");
    }

    // Verificar extensiones necesarias para WebGL1
    if (!this.gl.getExtension) {
      console.warn("Contexto WebGL limitado");
    }

    console.log("WebGL Version:", this.gl.getParameter(this.gl.VERSION));
    console.log("WebGL Vendor:", this.gl.getParameter(this.gl.VENDOR));
    console.log("WebGL Renderer:", this.gl.getParameter(this.gl.RENDERER));

    // Estado interno
    this.tile_items_size = 6;
    this.cachedCosA = 0;
    this.cachedSinA = 0;
    this.cameraAngleCache = 0;
    this.objectCount = 0;
    this.tempObjects = new Array(this.MAP_WIDTH * this.MAP_HEIGHT + 1000);

    // Inicializar
    this.initTextures();
    this.initShaders();
    this.initBuffers();
    this.initBillboardInstancing(); // ← AÑADIR ESTA LÍNEA
    this.initUniforms();
    this.setTileMap(config.map.array);
  }

  initTextures() {
    this.spriteTexture = this.gl.createTexture();
    this.tileMapTexture = this.gl.createTexture();

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tileMapTexture);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE
    );
    // Textura del skydome
    this.skydomeTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.skydomeTexture);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.REPEAT
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.REPEAT
    );
  }

  initShaders() {
    // Crear shaders
    this.program = this.createProgram(this.getGroundVS(), this.getGroundFS());
    this.billboardProgram = this.createProgram(
      this.getBillboardVS(),
      this.getBillboardFS()
    );
    this.blockProgram = this.createProgram(
      this.getBlockVS(),
      this.getBlockFS()
    );
    this.skyProgram = this.createProgram(this.getSkyVS(), this.getSkyFS());
    this.skydomeProgram = this.createProgram(
      this.getSkydomeVS(),
      this.getSkydomeFS()
    );
    this.modelProgram = this.createProgram(
      this.getModelVS(),
      this.getModelFS()
    ); // ✅ NUEVO
  }

  // ✅ NUEVO: Vertex Shader para Modelos 3D
  getModelVS() {
    return `#version 300 es
  in vec3 a_position;
  in vec2 a_texCoord;
  in vec3 a_normal;
  
  uniform vec4 u_camera;
  uniform vec2 u_resolution;
  uniform vec3 u_modelPos;      // Posición del modelo
  uniform float u_modelScale;   // Escala uniforme
  uniform vec3 u_modelRotation; // Rotación en radianes (x, y, z)
  
  out vec2 v_texCoord;
  out float v_depth;
  out vec3 v_normal;
  out vec3 v_worldPos;
  
mat4 rotationMatrix(vec3 rotation) {
    float cx = cos(rotation.x);
    float sx = sin(rotation.x);
    float cy = cos(rotation.y);
    float sy = sin(rotation.y);
    float cz = cos(rotation.z);
    float sz = sin(rotation.z);
    
    mat4 rx = mat4(
      1.0, 0.0, 0.0, 0.0,
      0.0, cx, -sx, 0.0,
      0.0, sx, cx, 0.0,
      0.0, 0.0, 0.0, 1.0
    );
    
    mat4 ry = mat4(
      cy, 0.0, sy, 0.0,
      0.0, 1.0, 0.0, 0.0,
      -sy, 0.0, cy, 0.0,
      0.0, 0.0, 0.0, 1.0
    );
    
    mat4 rz = mat4(
      cz, -sz, 0.0, 0.0,
      sz, cz, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0
    );
    
    // Orden corregido: Y -> X -> Z para rotación más predecible
    return ry * rx * rz;
  }
  
  void main() {
    // Aplicar rotación y escala
    mat4 rotMat = rotationMatrix(u_modelRotation);
    vec3 rotatedPos = (rotMat * vec4(a_position, 1.0)).xyz;
    vec3 scaledPos = rotatedPos * u_modelScale;
    
    // Posición en el mundo
    vec3 worldPos = scaledPos + u_modelPos;
    v_worldPos = worldPos;
    
    // Proyección de cámara
    float dx = worldPos.x - u_camera.x;
    float dy = worldPos.z - u_camera.y;
    
    float angle = u_camera.w;
    float cosA = cos(-angle);
    float sinA = sin(-angle);
    
    float rotX = dx * cosA - dy * sinA;
    float rotY = dx * sinA + dy * cosA;
    
    if (rotY < 0.5) {
      gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
      v_texCoord = a_texCoord;
      v_depth = -1.0;
      v_normal = (rotMat * vec4(a_normal, 0.0)).xyz;
      return;
    }
    
    float horizon = 0.3;
    float screenX = 0.5 + rotX / rotY;
    float screenY = 1.0 - (horizon + (u_camera.z - worldPos.y) / rotY);
    
    gl_Position = vec4(
      screenX * 2.0 - 1.0,
      screenY * 2.0 - 1.0,
      rotY / ${this.MAX_RENDER_DISTANCE}.0,
      1.0
    );
    
    v_texCoord = a_texCoord;
    v_depth = rotY;
    v_normal = (rotMat * vec4(a_normal, 0.0)).xyz;
  }`;
  }

  // ✅ NUEVO: Fragment Shader para Modelos 3D (igual que blocks)
  getModelFS() {
    return `#version 300 es
  precision highp float;
  in vec2 v_texCoord;
  in float v_depth;
  in vec3 v_normal;
  in vec3 v_worldPos;
  out vec4 outColor;
  
  uniform sampler2D u_spritesheet;
  uniform int u_spriteIndex;
  uniform float u_spriteCount;
  uniform vec3 u_lightDir;
  uniform bool u_illumination;
  uniform float u_ambient;
  uniform float u_diffuse;
  uniform bool u_fogEnabled;
  uniform float u_fogStart;
  uniform float u_fogEnd;
  uniform vec3 u_fogColor;
  uniform vec4 u_camera;
  
  float calculateAO() {
    vec3 localPos = fract(v_worldPos);
    float heightFactor = smoothstep(0.0, 0.4, localPos.y);
    float ao = mix(0.8, 1.0, heightFactor);
    
    if (abs(v_normal.y) < 0.3) {
      ao *= 0.93;
    }
    else if (v_normal.y > 0.9) {
      ao = 1.0;
    }
    
    return ao;
  }
  
void main() {
  if (v_depth < 0.0) discard;
  
  float spriteWidth = 1.0 / u_spriteCount;
  vec2 uv = v_texCoord;
  uv.y = 1.0 - uv.y;
  // DEBUG: Visualizar las coordenadas UV
   //outColor = vec4(uv.x, uv.y, 0.0, 1.0);
   //return;
  
  uv.x = uv.x * spriteWidth;
  uv.x += float(u_spriteIndex - 1) * spriteWidth;
  
  vec4 color = texture(u_spritesheet, uv);
  if (color.a < 0.1) discard;

    // DEBUG: Visualizar las coordenadas UV
   //outColor = vec4(uv.x, uv.y, 0.0, 1.0);
   //return;
  
  vec3 finalColor = color.rgb;
  
  float ao = calculateAO();
  finalColor *= ao;
  
  if (u_illumination) {
    float diffuseLight = max(dot(normalize(v_normal), u_lightDir), 0.0);
    float lighting = u_ambient + diffuseLight * u_diffuse;
    finalColor *= lighting;
  }
  
  if (u_fogEnabled) {
    float heightFactor = 1.0 - clamp(u_camera.z / 10.0, 0.0, 1.0);
    float enhancedFogEnd = u_fogEnd * (1.0 + heightFactor * 0.5);
    float fogFactor = clamp((enhancedFogEnd - v_depth) / (enhancedFogEnd - u_fogStart), 0.0, 1.0);
    finalColor = mix(u_fogColor, finalColor, fogFactor);
  }
  
  outColor = vec4(finalColor, color.a);
}`;
  }

  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error("Shader error:", this.gl.getShaderInfoLog(shader));
      throw new Error(this.gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  createProgram(vsSource, fsSource) {
    const vs = this.createShader(this.gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vs);
    this.gl.attachShader(program, fs);
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error("Program error:", this.gl.getProgramInfoLog(program));
      throw new Error(this.gl.getProgramInfoLog(program));
    }
    return program;
  }

  // Métodos para obtener el código de los shaders
  getSkyVS() {
    return `#version 300 es
    in vec2 a_position;
    out vec2 v_texCoord;
    void main() {
      v_texCoord = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }`;
  }

  getSkyFS() {
    return `#version 300 es
    precision highp float;
    in vec2 v_texCoord;
    out vec4 outColor;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    void main() {
      float t = v_texCoord.y;
      outColor = vec4(mix(u_color1, u_color2, t), 1.0);
    }`;
  }
  getSkydomeVS() {
    return `#version 300 es
  in vec3 a_position;
  uniform mat4 u_viewMatrix;
  uniform mat4 u_projMatrix;
  out vec3 v_position;
  
  void main() {
    v_position = a_position;
    vec4 worldPos = vec4(a_position, 1.0);
    vec4 viewPos = u_viewMatrix * worldPos;
    gl_Position = u_projMatrix * viewPos;
  }`;
  }

  getSkydomeFS() {
    return `#version 300 es
  precision highp float;
  in vec3 v_position;
  out vec4 outColor;
  uniform sampler2D u_skydomeTexture;
  
  void main() {
    // Calcular UV en el fragment shader para mejor interpolación
    vec3 norm = normalize(v_position);
    
    float u = atan(norm.z, norm.x) / (2.0 * 3.14159265359) + 0.5;
    //float v = asin(clamp(norm.y, -0.999, 0.999)) / 3.14159265359 + 0.5;
    float v = (asin(clamp(norm.y, -0.999, 0.999)) / 3.14159265359 + 0.5);
    v = v * ${this.skydome_vert_ajust} + 0.15; // mueve y estira — AJUSTABLE

    //v = v * 0.6 - 0.4; // Ocupa el 60% inferior
    vec2 texCoord = vec2(u*${this.skydome_rep_h}, v);
    outColor = texture(u_skydomeTexture, texCoord);
  }`;
  }

  getGroundVS() {
    return `#version 300 es
    in vec2 a_position;
    out vec2 v_texCoord;
    void main() {
      v_texCoord = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }`;
  }

  getGroundFS() {
    const waterChecks =
      this.water_tiles.length > 0
        ? this.water_tiles.map((tile) => `tileIndex == ${tile}u`).join(" || ")
        : "false";

    return `#version 300 es
  precision highp float;
  precision highp usampler2D;
  in vec2 v_texCoord;
  out vec4 outColor;
  uniform sampler2D u_spritesheet;
  uniform usampler2D u_tileMapTexture;
  uniform vec4 u_camera;
  uniform float u_spriteCount;
  uniform bool u_fogEnabled;
  uniform float u_fogStart;
  uniform float u_fogEnd;
  uniform vec3 u_fogColor;
  uniform float u_time;
  
  void main() {
    float angle = u_camera.w;
    float cosA = cos(angle);
    float sinA = sin(angle);
    
    float horizon = 0.3;
    float screenY = 1.0 - v_texCoord.y;
    float perspective = u_camera.z / (screenY - horizon);
    
    if (perspective < 0.0 || perspective > ${this.MAX_RENDER_DISTANCE}.0) {
      discard;
    }
    
    float dx = (v_texCoord.x - 0.5);
    float worldX = u_camera.x + (cosA * dx - sinA * 1.0) * perspective;
    float worldY = u_camera.y + (sinA * dx + cosA * 1.0) * perspective;
    
    int tileX = int(floor(worldX));
    int tileY = int(floor(worldY));
    
    if(tileX < 0 || tileY < 0 || tileX >= ${this.MAP_WIDTH} || tileY >= ${this.MAP_HEIGHT}) {
      discard;
    }
    
    vec2 tileTexCoord = vec2(float(tileX) + 0.5, float(tileY) + 0.5) / vec2(${this.MAP_WIDTH}.0, ${this.MAP_HEIGHT}.0);
    uint tileIndex = texture(u_tileMapTexture, tileTexCoord).r;

    if(tileIndex == 0u) {
      discard;
    }
    
    float tx = fract(worldX);
    float ty = fract(worldY);
    
    bool isWater = ${waterChecks};
    
    if (isWater) {
      tx += u_time * ${this.WATER_SPEED};
      ty += sin(u_time * 2.0 + worldX * 3.0) * ${this.WATER_WAVE};
      tx = fract(tx);
      ty = fract(ty);
    }
    
    // SOLUCIÓN: Añadir padding en UVs para evitar bleeding
    float padding = 0.5 / 512.0; // Ajusta según resolución de tu spritesheet
    tx = mix(padding, 1.0 - padding, tx);
    ty = mix(padding, 1.0 - padding, ty);
    
    float spriteWidth = 1.0 / u_spriteCount;
    vec2 texCoord = vec2(tx * spriteWidth, ty);
    texCoord.x += float(tileIndex - 1u) * spriteWidth;
    
    vec4 baseColor = texture(u_spritesheet, texCoord);
    
    if (u_fogEnabled) {
      float distance = perspective;
      float heightFactor = 1.0 - clamp(u_camera.z / 10.0, 0.0, 1.0);
      float enhancedFogEnd = u_fogEnd * (1.0 + heightFactor * 0.5);
      
      float fogFactor = clamp((enhancedFogEnd - distance) / (enhancedFogEnd - u_fogStart), 0.0, 1.0);
      outColor = vec4(mix(u_fogColor, baseColor.rgb, fogFactor), baseColor.a);
    } else {
      outColor = baseColor;
    }
  }`;
  }

  getBillboardVS() {
    return `#version 300 es
  in vec2 a_offset;
  in vec4 a_instanceData;
  
  out vec2 v_texCoord;
  out float v_distance;
  flat out float v_clipTest; // NUEVO
  
  uniform vec4 u_camera;
  
  void main() {
    vec2 screenPos = a_instanceData.xy;
    float size = a_instanceData.z;
    float scale = a_instanceData.w;
    
    // Clip test temprano
    v_clipTest = step(0.0, screenPos.x) * step(screenPos.x, 1.0) 
               * step(0.0, screenPos.y) * step(screenPos.y, 1.0);
    
    vec2 pos = screenPos + vec2(a_offset.x, a_offset.y + 1.0) * size * scale;
    gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
    v_texCoord = (a_offset + 1.0) * 0.5;
    v_distance = 1.0 / size;
  }`;
  }

  getBillboardFS() {
    return `#version 300 es
  precision highp float;
  in vec2 v_texCoord;
  in float v_distance;
  out vec4 outColor;
  uniform sampler2D u_spritesheet;
  uniform int u_spriteIndex;
  uniform float u_spriteCount;
  uniform bool u_fogEnabled;
  uniform float u_fogStart;
  uniform float u_fogEnd;
  uniform vec3 u_fogColor;
  
  void main() {
    vec2 uv = v_texCoord;
    uv.y = 1.0 - uv.y;
    uv.x /= u_spriteCount;
    uv.x += float(u_spriteIndex - 1) / u_spriteCount;
    uv = clamp(uv, 0.0, 1.0);

    vec4 color = texture(u_spritesheet, uv);
    if (color.a < 0.1) discard;
    
    if (u_fogEnabled) {
      float fogFactor = clamp((u_fogEnd - v_distance) / (u_fogEnd - u_fogStart), 0.0, 1.0);
      outColor = vec4(mix(u_fogColor, color.rgb, fogFactor), color.a);
    } else {
      outColor = color;
    }
  }`;
  }

  getBlockVS() {
    return `#version 300 es
  in vec3 a_position;
  in vec2 a_texCoord;
  in vec3 a_normal;
  in vec4 a_instanceData;
  
  uniform vec4 u_camera;
  uniform vec2 u_resolution;
  
  out vec2 v_texCoord;
  out float v_depth;
  out float v_height;
  out vec3 v_normal;
  out vec3 v_worldPos; // ← NUEVO para AO
  
  void main() {
    vec3 instancePos = a_instanceData.xyz;
    float height = a_instanceData.w;
    
    vec3 scaledPos = a_position;
    scaledPos.y *= height;
    
    vec3 worldPos = scaledPos + instancePos;
    v_worldPos = worldPos; // ← NUEVO
    
    float dx = worldPos.x - u_camera.x;
    float dy = worldPos.z - u_camera.y;
    
    float angle = u_camera.w;
    float cosA = cos(-angle);
    float sinA = sin(-angle);
    
    float rotX = dx * cosA - dy * sinA;
    float rotY = dx * sinA + dy * cosA;
    
    if (rotY < 0.5) {
      gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
      v_texCoord = a_texCoord;
      v_depth = -1.0;
      v_height = height;
      v_normal = a_normal;
      return;
    }
    
    float horizon = 0.3;
    float screenX = 0.5 + rotX / rotY;
    float screenY = 1.0 - (horizon + (u_camera.z - worldPos.y) / rotY);
    
    gl_Position = vec4(
      screenX * 2.0 - 1.0,
      screenY * 2.0 - 1.0,
      rotY / ${this.MAX_RENDER_DISTANCE}.0,
      1.0
    );
    
    float isVertical = 1.0 - abs(a_normal.y);
    v_texCoord = vec2(a_texCoord.x, a_texCoord.y * mix(1.0, height, isVertical));
    v_depth = rotY;
    v_height = height;
    v_normal = a_normal;
  }`;
  }

  getBlockFS() {
    return `#version 300 es
  precision highp float;
  in vec2 v_texCoord;
  in float v_depth;
  in float v_height;
  in vec3 v_normal;
  in vec3 v_worldPos;
  in vec3 v_blockCenter;
  out vec4 outColor;
  
  uniform sampler2D u_spritesheet;
  uniform int u_spriteIndex;
  uniform float u_spriteCount;
  uniform vec3 u_lightDir;
  uniform bool u_illumination;
  uniform float u_ambient;
  uniform float u_diffuse;
  uniform bool u_fogEnabled;
  uniform float u_fogStart;
  uniform float u_fogEnd;
  uniform vec3 u_fogColor;
  uniform vec4 u_camera;
  
  float calculateAO() {
    vec3 localPos = fract(v_worldPos);
    float heightFactor = smoothstep(0.0, 0.4, localPos.y);
    float ao = mix(0.8, 1.0, heightFactor);
    
    if (abs(v_normal.y) < 0.3) {
      ao *= 0.93;
    }
    else if (v_normal.y > 0.9) {
      ao = 1.0;
    }
    
    return ao;
  }
  
  void main() {
    if (v_depth < 0.0) discard;
    
    float spriteWidth = 1.0 / u_spriteCount;
    vec2 uv = vec2(v_texCoord.x * spriteWidth, fract(v_texCoord.y));
    
    // ✅ AÑADIR ESTA LÍNEA - Invertir coordenada Y
    uv.y = 1.0 - uv.y;
    
    uv.x += float(u_spriteIndex - 1) * spriteWidth;
    
    vec4 color = texture(u_spritesheet, uv);
    if (color.a < 0.1) discard;
    
    vec3 finalColor = color.rgb;
    float ao = calculateAO();
    finalColor *= ao;
    
    if (u_illumination) {
      float diffuseLight = max(dot(v_normal, u_lightDir), 0.0);
      float lighting = u_ambient + diffuseLight * u_diffuse;
      finalColor *= lighting;
    }
    
    if (u_fogEnabled) {
      float heightFactor = 1.0 - clamp(u_camera.z / 10.0, 0.0, 1.0);
      float enhancedFogEnd = u_fogEnd * (1.0 + heightFactor * 0.5);
      
      float fogFactor = clamp((enhancedFogEnd - v_depth) / (enhancedFogEnd - u_fogStart), 0.0, 1.0);
      finalColor = mix(u_fogColor, finalColor, fogFactor);
    }
    
    outColor = vec4(finalColor, color.a);
  }`;
  }

  initBuffers() {
    // Buffer para el quad del suelo y cielo
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      this.gl.STATIC_DRAW
    );

    // Buffer para billboards
    this.billboardBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.billboardBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      this.gl.STATIC_DRAW
    );

    // Buffer para cubos
    this.cubeBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.getCubeVertices(),
      this.gl.STATIC_DRAW
    );

    // Buffer para instancias
    this.instanceBuffer = this.gl.createBuffer();

    // Buffer para cielo
    this.skyBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skyBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      this.gl.STATIC_DRAW
    );
    // buffer skydome
    this.skydomeBuffer = this.gl.createBuffer();
    this.skydomeIndexBuffer = this.gl.createBuffer();
    this.createSkydomeGeometry();
  }

  initBillboardInstancing() {
    this.billboardInstanceBuffer = this.gl.createBuffer();
    this.maxBillboardInstances = 1000; // Ajustable según tu escena
  }

  getCubeVertices() {
    return new Float32Array([
      // Cara frontal (Z+) - Normal: (0, 0, 1)
      -0.5, 0.0, 0.5, 0, 0, 0, 0, 1, 0.5, 0.0, 0.5, 1, 0, 0, 0, 1, 0.5, 1.0,
      0.5, 1, 1, 0, 0, 1, -0.5, 0.0, 0.5, 0, 0, 0, 0, 1, 0.5, 1.0, 0.5, 1, 1, 0,
      0, 1, -0.5, 1.0, 0.5, 0, 1, 0, 0, 1,

      // Cara trasera (Z-) - Normal: (0, 0, -1)
      0.5, 0.0, -0.5, 1, 0, 0, 0, -1, -0.5, 0.0, -0.5, 0, 0, 0, 0, -1, -0.5,
      1.0, -0.5, 0, 1, 0, 0, -1, 0.5, 0.0, -0.5, 1, 0, 0, 0, -1, -0.5, 1.0,
      -0.5, 0, 1, 0, 0, -1, 0.5, 1.0, -0.5, 1, 1, 0, 0, -1,

      // Cara izquierda (X-) - Normal: (-1, 0, 0)
      -0.5, 0.0, -0.5, 0, 0, -1, 0, 0, -0.5, 0.0, 0.5, 1, 0, -1, 0, 0, -0.5,
      1.0, 0.5, 1, 1, -1, 0, 0, -0.5, 0.0, -0.5, 0, 0, -1, 0, 0, -0.5, 1.0, 0.5,
      1, 1, -1, 0, 0, -0.5, 1.0, -0.5, 0, 1, -1, 0, 0,

      // Cara derecha (X+) - Normal: (1, 0, 0)
      0.5, 0.0, 0.5, 0, 0, 1, 0, 0, 0.5, 0.0, -0.5, 1, 0, 1, 0, 0, 0.5, 1.0,
      -0.5, 1, 1, 1, 0, 0, 0.5, 0.0, 0.5, 0, 0, 1, 0, 0, 0.5, 1.0, -0.5, 1, 1,
      1, 0, 0, 0.5, 1.0, 0.5, 0, 1, 1, 0, 0,

      // Cara superior (Y+) - Normal: (0, 1, 0)
      -0.5, 1.0, 0.5, 0, 0, 0, 1, 0, 0.5, 1.0, 0.5, 1, 0, 0, 1, 0, 0.5, 1.0,
      -0.5, 1, 1, 0, 1, 0, -0.5, 1.0, 0.5, 0, 0, 0, 1, 0, 0.5, 1.0, -0.5, 1, 1,
      0, 1, 0, -0.5, 1.0, -0.5, 0, 1, 0, 1, 0,

      // Cara inferior (Y-) - Normal: (0, -1, 0)
      -0.5, 0.0, -0.5, 0, 0, 0, -1, 0, 0.5, 0.0, -0.5, 1, 0, 0, -1, 0, 0.5, 0.0,
      0.5, 1, 1, 0, -1, 0, -0.5, 0.0, -0.5, 0, 0, 0, -1, 0, 0.5, 0.0, 0.5, 1, 1,
      0, -1, 0, -0.5, 0.0, 0.5, 0, 1, 0, -1, 0,
    ]);
  }
  createSkydomeGeometry() {
    const vertices = [];
    const indices = [];
    const radius = this.SKYDOME_RADIUS;
    const segments = this.SKYDOME_SEGMENTS;
    const rings = Math.floor(segments / 2);

    // Generar vértices (evitando los polos exactos)
    for (let ring = 0; ring <= rings; ring++) {
      const phi = (ring / rings) * Math.PI * 0.95; // 0.95 para evitar singularidad en polos
      const y = radius * Math.cos(phi);
      const ringRadius = radius * Math.sin(phi);

      for (let seg = 0; seg <= segments; seg++) {
        const theta = (seg / segments) * Math.PI * 2;
        const x = ringRadius * Math.cos(theta);
        const z = ringRadius * Math.sin(theta);

        vertices.push(x, y, z);
      }
    }

    // Generar índices
    for (let ring = 0; ring < rings; ring++) {
      for (let seg = 0; seg < segments; seg++) {
        const current = ring * (segments + 1) + seg;
        const next = current + segments + 1;

        indices.push(current, next, current + 1);
        indices.push(current + 1, next, next + 1);
      }
    }

    this.skydomeVertexCount = indices.length;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skydomeBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(vertices),
      this.gl.STATIC_DRAW
    );

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.skydomeIndexBuffer);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      this.gl.STATIC_DRAW
    );
  }

  initUniforms() {
    this.uniformLocations = {
      skydome: {
        viewMatrix: this.gl.getUniformLocation(
          this.skydomeProgram,
          "u_viewMatrix"
        ),
        projMatrix: this.gl.getUniformLocation(
          this.skydomeProgram,
          "u_projMatrix"
        ),
        skydomeTexture: this.gl.getUniformLocation(
          this.skydomeProgram,
          "u_skydomeTexture"
        ),
      },
      ground: {
        time: this.gl.getUniformLocation(this.program, "u_time"),
        spriteCount: this.gl.getUniformLocation(this.program, "u_spriteCount"),
        camera: this.gl.getUniformLocation(this.program, "u_camera"),
        tileMapTexture: this.gl.getUniformLocation(
          this.program,
          "u_tileMapTexture"
        ),
        spritesheet: this.gl.getUniformLocation(this.program, "u_spritesheet"),
        fogEnabled: this.gl.getUniformLocation(this.program, "u_fogEnabled"),
        fogStart: this.gl.getUniformLocation(this.program, "u_fogStart"),
        fogEnd: this.gl.getUniformLocation(this.program, "u_fogEnd"),
        fogColor: this.gl.getUniformLocation(this.program, "u_fogColor"),
      },
      billboard: {
        spriteIndex: this.gl.getUniformLocation(
          this.billboardProgram,
          "u_spriteIndex"
        ),
        spriteCount: this.gl.getUniformLocation(
          this.billboardProgram,
          "u_spriteCount"
        ),
        spritesheet: this.gl.getUniformLocation(
          this.billboardProgram,
          "u_spritesheet"
        ),
        fogEnabled: this.gl.getUniformLocation(
          this.billboardProgram,
          "u_fogEnabled"
        ),
        fogStart: this.gl.getUniformLocation(
          this.billboardProgram,
          "u_fogStart"
        ),
        fogEnd: this.gl.getUniformLocation(this.billboardProgram, "u_fogEnd"),
        fogColor: this.gl.getUniformLocation(
          this.billboardProgram,
          "u_fogColor"
        ),
        // ← ELIMINAR: screenPos, size, scale, distance (ya no se usan)
      },

      block: {
        camera: this.gl.getUniformLocation(this.blockProgram, "u_camera"),
        resolution: this.gl.getUniformLocation(
          this.blockProgram,
          "u_resolution"
        ),
        spriteIndex: this.gl.getUniformLocation(
          this.blockProgram,
          "u_spriteIndex"
        ),
        spriteCount: this.gl.getUniformLocation(
          this.blockProgram,
          "u_spriteCount"
        ),
        spritesheet: this.gl.getUniformLocation(
          this.blockProgram,
          "u_spritesheet"
        ),
        lightDir: this.gl.getUniformLocation(this.blockProgram, "u_lightDir"),
        illumination: this.gl.getUniformLocation(
          this.blockProgram,
          "u_illumination"
        ),
        ambient: this.gl.getUniformLocation(this.blockProgram, "u_ambient"),
        diffuse: this.gl.getUniformLocation(this.blockProgram, "u_diffuse"),
        fogEnabled: this.gl.getUniformLocation(
          this.blockProgram,
          "u_fogEnabled"
        ),
        fogStart: this.gl.getUniformLocation(this.blockProgram, "u_fogStart"),
        fogEnd: this.gl.getUniformLocation(this.blockProgram, "u_fogEnd"),
        fogColor: this.gl.getUniformLocation(this.blockProgram, "u_fogColor"),
      },
      sky: {
        color1: this.gl.getUniformLocation(this.skyProgram, "u_color1"),
        color2: this.gl.getUniformLocation(this.skyProgram, "u_color2"),
      },
      model: {
        camera: this.gl.getUniformLocation(this.modelProgram, "u_camera"),
        resolution: this.gl.getUniformLocation(
          this.modelProgram,
          "u_resolution"
        ),
        modelPos: this.gl.getUniformLocation(this.modelProgram, "u_modelPos"),
        modelScale: this.gl.getUniformLocation(
          this.modelProgram,
          "u_modelScale"
        ),
        modelRotation: this.gl.getUniformLocation(
          this.modelProgram,
          "u_modelRotation"
        ),
        spriteIndex: this.gl.getUniformLocation(
          this.modelProgram,
          "u_spriteIndex"
        ),
        spriteCount: this.gl.getUniformLocation(
          this.modelProgram,
          "u_spriteCount"
        ),
        spritesheet: this.gl.getUniformLocation(
          this.modelProgram,
          "u_spritesheet"
        ),
        lightDir: this.gl.getUniformLocation(this.modelProgram, "u_lightDir"),
        illumination: this.gl.getUniformLocation(
          this.modelProgram,
          "u_illumination"
        ),
        ambient: this.gl.getUniformLocation(this.modelProgram, "u_ambient"),
        diffuse: this.gl.getUniformLocation(this.modelProgram, "u_diffuse"),
        fogEnabled: this.gl.getUniformLocation(
          this.modelProgram,
          "u_fogEnabled"
        ),
        fogStart: this.gl.getUniformLocation(this.modelProgram, "u_fogStart"),
        fogEnd: this.gl.getUniformLocation(this.modelProgram, "u_fogEnd"),
        fogColor: this.gl.getUniformLocation(this.modelProgram, "u_fogColor"),
      },
    };

    this.attribLocations = {
      skydome: {
        position: this.gl.getAttribLocation(this.skydomeProgram, "a_position"),
      },

      ground: {
        position: this.gl.getAttribLocation(this.program, "a_position"),
      },
      billboard: {
        offset: this.gl.getAttribLocation(this.billboardProgram, "a_offset"),
        instanceData: this.gl.getAttribLocation(
          this.billboardProgram,
          "a_instanceData"
        ), // ← AÑADIR
      },
      block: {
        position: this.gl.getAttribLocation(this.blockProgram, "a_position"),
        texCoord: this.gl.getAttribLocation(this.blockProgram, "a_texCoord"),
        normal: this.gl.getAttribLocation(this.blockProgram, "a_normal"),
        instanceData: this.gl.getAttribLocation(
          this.blockProgram,
          "a_instanceData"
        ),
      },
      sky: {
        position: this.gl.getAttribLocation(this.skyProgram, "a_position"),
      },
      model: {
        position: this.gl.getAttribLocation(this.modelProgram, "a_position"),
        texCoord: this.gl.getAttribLocation(this.modelProgram, "a_texCoord"),
        normal: this.gl.getAttribLocation(this.modelProgram, "a_normal"),
      },
    };
  }

  // Cargar imagen del spritesheet
  loadSpritesheet(imageSource) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        this.tile_items_size = Math.floor(image.width / this.TILE_SIZE);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteTexture);
        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          image
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MIN_FILTER,
          this.gl.NEAREST
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MAG_FILTER,
          this.gl.NEAREST
        );

        //this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR); // Mejor calidad
        //this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR); // Suaviza al acercar

        // this.gl.generateMipmap(this.gl.TEXTURE_2D); // Genera mipmaps para distancias

        resolve();
      };

      image.onerror = () => reject(new Error("Error al cargar spritesheet"));
      image.src = imageSource;
    });
  }
  loadSkydomeTexture(imageSource) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.skydomeTexture);
        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          image
        );
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        resolve();
      };

      image.onerror = () =>
        reject(new Error("Error al cargar textura del skydome"));
      image.src = imageSource;
    });
  }

  // Actualizar el tilemap
  setTileMap(tileMap) {
    this.tileMap = tileMap;
    this.updateTileMapTexture();
  }

  updateTileMapTexture() {
    if (!this.tileMap) return;

    const data = new Uint8Array(this.MAP_WIDTH * this.MAP_HEIGHT);
    for (let i = 0; i < this.tileMap.length; i++) {
      const tile = this.tileMap[i];
      const heightMapValue = this.heightMap ? this.heightMap[i] || 0.0 : 0.0;

      // Si es un billboard, poner el tile de suelo correspondiente
      if (this.isBillboard(tile)) {
        // Si hay altura, no renderizar suelo (se renderiza como bloque)
        if (heightMapValue > 0) {
          data[i] = 0; // Transparente
        } else {
          data[i] =
            this.billboard_ground_tiles[tile] || this.DEFAULT_BILLBOARD_GROUND;
        }
      }
      // ✅ AÑADIR: Manejo de modelos 3D
      else if (this.isModel3D(tile)) {
        // Los modelos 3D usan groundTile de su configuración
        const config = this.getModel3DConfig(tile);
        data[i] = config.groundTile || 0;
      } else if (this.isBlock(tile)) {
        // Los bloques no se renderizan en el suelo
        data[i] = 0;
      } else {
        // Tile de suelo normal
        // Si tiene altura en heightMap, no renderizar en suelo (se convierte en bloque)
        if (heightMapValue > 0) {
          data[i] = 0;
        } else {
          data[i] = tile;
        }
      }
    }

    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tileMapTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.R8UI,
      this.MAP_WIDTH,
      this.MAP_HEIGHT,
      0,
      this.gl.RED_INTEGER,
      this.gl.UNSIGNED_BYTE,
      data
    );
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
  }

  // Frustum culling
  updateTrigCache(camera) {
    if (this.cameraAngleCache !== camera.angle) {
      this.cameraAngleCache = camera.angle;
      this.cachedCosA = Math.cos(-camera.angle);
      this.cachedSinA = Math.sin(-camera.angle);
    }
  }

  // Proyección
  projectToScreen(worldX, worldY, camera) {
    const dx = worldX - camera.x;
    const dy = worldY - camera.y;

    const rotX = dx * this.cachedCosA - dy * this.cachedSinA;
    const rotY = dx * this.cachedSinA + dy * this.cachedCosA;

    const horizon = 0.3;
    const invRotY = 1.0 / (rotY - 0.001);
    const perspective = camera.z * invRotY;

    const screenX = 0.5 + rotX * invRotY;
    const screenY = 1.0 - (horizon + perspective);

    return {
      visible:
        rotY > -3 &&
        screenX >= -3 &&
        screenX <= 1 &&
        screenY >= -3 &&
        screenY <= 1,
      x: screenX,
      y: screenY,
      size: invRotY,
    };
  }

  projectToScreenWithHeight(worldX, worldY, height, camera) {
    const dx = worldX - camera.x;
    const dy = worldY - camera.y;

    const rotX = dx * this.cachedCosA - dy * this.cachedSinA;
    const rotY = dx * this.cachedSinA + dy * this.cachedCosA;

    const horizon = 0.3;
    const invRotY = 1.0 / (rotY - 0.001);
    const perspective = (camera.z - height) * invRotY;

    const screenX = 0.5 + rotX * invRotY;
    const screenY = 1.0 - (horizon + perspective);

    return {
      visible:
        rotY > 0.01 &&
        screenX >= 0 &&
        screenX <= 1 &&
        screenY >= -3 &&
        screenY <= 1,
      x: screenX,
      y: screenY,
      size: invRotY,
    };
  }

  isBillboard(n) {
    return this.billboard_tiles_set.has(n);
  }

  isBlock(n) {
    return this.block_tiles_set.has(n);
  }
  isRotatableBillboard(n) {
    return this.rotatable_billboards_set.has(n);
  }

  isModel3D(n) {
    return this.model3d_tiles_set.has(n);
  }

  getModel3DConfig(tile) {
    return (
      this.model3d_config[tile] || {
        modelName: "default",
        scale: 1.0,
        rotation: { x: 0, y: 0, z: 0 },
        height: 0,
        offset: { x: 0, y: 0, z: 0 }, // ← NUEVO: offset para centrar
        groundTile: 0, // ← NUEVO: tile de suelo (0 = sin suelo)
      }
    );
  }

  getRotatedBillboardSprite(
    baseTile,
    cameraAngle,
    billboardX,
    billboardY,
    fixedOrientation = null
  ) {
    let relativeAngle;
    let needsMapping = false;

    if (fixedOrientation !== null) {
      // Usar la orientación fija del billboard
      // El billboard "mira" en la dirección fixedOrientation
      // Calculamos el ángulo relativo a la cámara
      relativeAngle = fixedOrientation - cameraAngle;
    } else {
      // El billboard siempre mira hacia la cámara (comportamiento automático)
      // Calculamos desde dónde viene la cámara respecto al billboard
      const dx = this.lastCamera.x - billboardX;
      const dy = this.lastCamera.y - billboardY;
      const angleFromBillboardToCamera = Math.atan2(dy, dx);
      relativeAngle = angleFromBillboardToCamera;
      needsMapping = true; // Solo los billboards automáticos necesitan el mapeo invertido
    }

    // Normalizar el ángulo relativo (0 a 2π)
    while (relativeAngle < 0) relativeAngle += Math.PI * 2;
    while (relativeAngle >= Math.PI * 2) relativeAngle -= Math.PI * 2;

    // Dividir en 4 cuadrantes (cada uno de 90 grados = π/2)
    const quadrant =
      Math.floor((relativeAngle + Math.PI / 4) / (Math.PI / 2)) % 4;

    let spriteOffset;
    if (needsMapping) {
      // Para billboards automáticos (del tilemap), invertir izquierda/derecha
      // Asumiendo que tus sprites están ordenados: frente, derecha, atrás, izquierda
      const spriteMap = [0, 3, 2, 1];
      spriteOffset = spriteMap[quadrant];
    } else {
      // Para billboards con orientación fija, usar directamente el cuadrante
      spriteOffset = quadrant;
    }

    // Retornar el tile base + offset del sprite correcto
    return baseTile + spriteOffset;
  }

  collectRenderableObjects(camera, independentObjects = []) {
    this.objectCount = 0;
    const camX = camera.x;
    const camY = camera.y;
    const maxDistSq = this.MAX_RENDER_DISTANCE * this.MAX_RENDER_DISTANCE;

    const maxDist = this.MAX_RENDER_DISTANCE;
    const minX = Math.max(0, Math.floor(camX - maxDist));
    const maxX = Math.min(this.MAP_WIDTH - 1, Math.ceil(camX + maxDist));
    const minY = Math.max(0, Math.floor(camY - maxDist));
    const maxY = Math.min(this.MAP_HEIGHT - 1, Math.ceil(camY + maxDist));

    const billboardCache = new Map();

    if (this.tileMap) {
      for (let mapY = minY; mapY <= maxY; mapY++) {
        for (let mapX = minX; mapX <= maxX; mapX++) {
          const i = mapY * this.MAP_WIDTH + mapX;
          const tile = this.tileMap[i];
          if (tile === 0) continue;

          const worldX = mapX + 0.5;
          const worldY = mapY + 0.5;
          const dx = worldX - camX;
          const dy = worldY - camY;
          const distSq = dx * dx + dy * dy;

          if (distSq > maxDistSq) continue;

          const rotY = dx * this.cachedSinA + dy * this.cachedCosA;
          if (rotY < 0.1) continue;

          const rotX = dx * this.cachedCosA - dy * this.cachedSinA;
          const screenX = 0.5 + rotX / rotY;
          if (
            screenX < -this.FRUSTUM_MARGIN ||
            screenX > 1.0 + this.FRUSTUM_MARGIN
          )
            continue;

          const heightMapValue = this.heightMap
            ? this.heightMap[i] || 0.0
            : 0.0;

          // Procesar modelos 3D
          if (this.isModel3D(tile)) {
            const config = this.getModel3DConfig(tile);
            const modelHeight =
              config.height !== undefined ? config.height : heightMapValue;
            const offset = config.offset || { x: 0, y: 0, z: 0 };
            const groundTile = config.groundTile || 0;

            if (groundTile !== 0 && modelHeight > 0) {
              // Verificar si necesita rampa en el TOPE de la columna
              if (this.RAMP_ENABLED) {
                const rampInfo = this.getRampType(mapX, mapY, modelHeight);

                if (rampInfo.type !== this.RAMP_TYPES.NONE) {
                  const neighbors = this.getNeighborHeights(mapX, mapY);
                  const baseHeight = Math.min(
                    neighbors.north,
                    neighbors.east,
                    neighbors.south,
                    neighbors.west
                  );

                  if (modelHeight - baseHeight === 1) {
                    // Crear bloques base (desde 0 hasta baseHeight)
                    if (baseHeight > 0) {
                      this.tempObjects[this.objectCount++] = {
                        type: "block",
                        x: worldX,
                        y: 0.0,
                        z: worldY,
                        tile: groundTile,
                        dist: distSq,
                        customHeight: baseHeight,
                      };
                    }

                    // Crear rampa en el tope
                    this.tempObjects[this.objectCount++] = {
                      type: "ramp",
                      x: worldX,
                      y: baseHeight,
                      z: worldY,
                      tile: groundTile,
                      dist: distSq,
                      rampInfo: rampInfo,
                      baseHeight: baseHeight,
                      targetHeight: modelHeight,
                    };

                    // Añadir el modelo DESPUÉS de la rampa
                    this.tempObjects[this.objectCount++] = {
                      type: "model3d",
                      modelName: config.modelName,
                      x: worldX + offset.x,
                      y: modelHeight + offset.y,
                      z: worldY + offset.z,
                      tile: tile,
                      scale: config.scale || 1.0,
                      rotation: config.rotation || { x: 0, y: 0, z: 0 },
                      dist: distSq,
                    };

                    continue;
                  }
                }
              }

              // Si no es rampa, crear bloque completo desde 0 hasta modelHeight
              this.tempObjects[this.objectCount++] = {
                type: "block",
                x: worldX,
                y: 0.0,
                z: worldY,
                tile: groundTile,
                dist: distSq,
                customHeight: modelHeight,
              };

              // Añadir el modelo EN LA ALTURA CORRECTA
              this.tempObjects[this.objectCount++] = {
                type: "model3d",
                modelName: config.modelName,
                x: worldX + offset.x,
                y: modelHeight + offset.y,
                z: worldY + offset.z,
                tile: tile,
                scale: config.scale || 1.0,
                rotation: config.rotation || { x: 0, y: 0, z: 0 },
                dist: distSq,
              };
            } else {
              // Si NO hay altura, modelo al nivel del suelo
              this.tempObjects[this.objectCount++] = {
                type: "model3d",
                modelName: config.modelName,
                x: worldX + offset.x,
                y: offset.y,
                z: worldY + offset.z,
                tile: tile,
                scale: config.scale || 1.0,
                rotation: config.rotation || { x: 0, y: 0, z: 0 },
                dist: distSq,
              };
            }

            continue;
          }

          // Procesar billboards
          if (this.isBillboard(tile)) {
            const groundElevation = heightMapValue;
            const groundTile =
              this.billboard_ground_tiles[tile] ||
              this.DEFAULT_BILLBOARD_GROUND;

            let groundIsRamp = false;
            let finalGroundHeight = groundElevation;

            if (this.RAMP_ENABLED && groundElevation > 0 && groundTile !== 0) {
              const rampInfo = this.getRampType(mapX, mapY, groundElevation);

              if (rampInfo.type !== this.RAMP_TYPES.NONE) {
                const neighbors = this.getNeighborHeights(mapX, mapY);
                const baseHeight = Math.min(
                  neighbors.north,
                  neighbors.east,
                  neighbors.south,
                  neighbors.west
                );

                const targetHeight = groundElevation;
                if (targetHeight - baseHeight === 1) {
                  if (baseHeight > 0) {
                    this.tempObjects[this.objectCount++] = {
                      type: "block",
                      x: worldX,
                      y: 0.0,
                      z: worldY,
                      tile: groundTile,
                      dist: distSq,
                      customHeight: baseHeight,
                    };
                  }

                  this.tempObjects[this.objectCount++] = {
                    type: "ramp",
                    x: worldX,
                    y: baseHeight,
                    z: worldY,
                    tile: groundTile,
                    dist: distSq,
                    rampInfo: rampInfo,
                    baseHeight: baseHeight,
                    targetHeight: groundElevation,
                  };
                  groundIsRamp = true;
                  finalGroundHeight = groundElevation;
                }
              }
            }

            if (!groundIsRamp && groundElevation > 0 && groundTile !== 0) {
              this.tempObjects[this.objectCount++] = {
                type: "block",
                x: worldX,
                y: 0.0,
                z: worldY,
                tile: groundTile,
                dist: distSq,
                customHeight: groundElevation,
              };
              const blockHeight = this.isBlock(groundTile)
                ? this.tile_heights[groundTile] || 0.0
                : 0.0;
              finalGroundHeight = groundElevation + blockHeight;
            }

            const proj = this.projectToScreenWithHeight(
              worldX,
              worldY,
              finalGroundHeight,
              camera
            );
            if (proj.size < BILLBOARD_MINIM_SIZE) continue;

            if (proj.visible) {
              let finalTile = tile;
              if (this.isRotatableBillboard(tile)) {
                const cacheKey = `${tile}_${Math.floor(camera.angle * 100)}`;
                if (!billboardCache.has(cacheKey)) {
                  billboardCache.set(
                    cacheKey,
                    this.getRotatedBillboardSprite(
                      tile,
                      camera.angle,
                      worldX,
                      worldY,
                      null
                    )
                  );
                }
                finalTile = billboardCache.get(cacheKey);
              }

              const scale = this.billboard_scales[tile] || 1.0;

              this.tempObjects[this.objectCount++] = {
                type: "billboard",
                x: worldX,
                y: worldY,
                tile: finalTile,
                dist: distSq,
                proj,
                scale: scale,
              };
            }
          }
          // Procesar bloques
          else if (this.isBlock(tile)) {
            if (this.RAMP_ENABLED && heightMapValue > 0) {
              const rampInfo = this.getRampType(mapX, mapY, heightMapValue);

              if (rampInfo.type !== this.RAMP_TYPES.NONE) {
                const neighbors = this.getNeighborHeights(mapX, mapY);

                const baseHeight = Math.min(
                  neighbors.north,
                  neighbors.east,
                  neighbors.south,
                  neighbors.west
                );

                const targetHeight = heightMapValue;

                if (targetHeight - baseHeight === 1) {
                  if (baseHeight > 0) {
                    this.tempObjects[this.objectCount++] = {
                      type: "block",
                      x: worldX,
                      y: 0.0,
                      z: worldY,
                      tile,
                      dist: distSq,
                      customHeight: baseHeight,
                    };
                  }

                  this.tempObjects[this.objectCount++] = {
                    type: "ramp",
                    x: worldX,
                    y: baseHeight,
                    z: worldY,
                    tile,
                    dist: distSq,
                    rampInfo,
                    baseHeight,
                    targetHeight,
                  };

                  continue;
                }
              }
            }

            const customHeight = heightMapValue > 0 ? heightMapValue : null;
            this.tempObjects[this.objectCount++] = {
              type: "block",
              x: worldX,
              y: 0.0,
              z: worldY,
              tile,
              dist: distSq,
              customHeight: customHeight,
            };
          }
          // Procesar tiles de suelo
          else {
            if (heightMapValue > 0) {
              if (this.RAMP_ENABLED) {
                const rampInfo = this.getRampType(mapX, mapY, heightMapValue);

                if (rampInfo.type !== this.RAMP_TYPES.NONE) {
                  const neighbors = this.getNeighborHeights(mapX, mapY);

                  const baseHeight = Math.min(
                    neighbors.north,
                    neighbors.east,
                    neighbors.south,
                    neighbors.west
                  );

                  const targetHeight = heightMapValue;

                  if (targetHeight - baseHeight === 1) {
                    if (baseHeight > 0) {
                      this.tempObjects[this.objectCount++] = {
                        type: "block",
                        x: worldX,
                        y: 0.0,
                        z: worldY,
                        tile,
                        dist: distSq,
                        customHeight: baseHeight,
                      };
                    }

                    this.tempObjects[this.objectCount++] = {
                      type: "ramp",
                      x: worldX,
                      y: baseHeight,
                      z: worldY,
                      tile,
                      dist: distSq,
                      rampInfo,
                      baseHeight,
                      targetHeight,
                    };

                    continue;
                  }
                }
              }

              this.tempObjects[this.objectCount++] = {
                type: "block",
                x: worldX,
                y: 0.0,
                z: worldY,
                tile: tile,
                dist: distSq,
                customHeight: heightMapValue,
              };
            }
          }
        }
      }
    }

    // Objetos independientes
    for (const obj of independentObjects) {
      const worldX = obj.x;
      const worldY = obj.y;
      const height = obj.z;

      const dx = worldX - camX;
      const dy = worldY - camY;
      const distSq = dx * dx + dy * dy;

      if (distSq > maxDistSq) continue;

      const rotY = dx * this.cachedSinA + dy * this.cachedCosA;
      if (rotY < 0.1) continue;

      const rotX = dx * this.cachedCosA - dy * this.cachedSinA;
      const screenX = 0.5 + rotX / rotY;
      if (screenX < -this.FRUSTUM_MARGIN || screenX > 1.0 + this.FRUSTUM_MARGIN)
        continue;

      if (this.isBillboard(obj.tile)) {
        const proj = this.projectToScreenWithHeight(
          worldX,
          worldY,
          height,
          camera
        );
        if (proj.size < BILLBOARD_MINIM_SIZE) continue;

        if (proj.visible) {
          let finalTile = obj.tile;
          if (this.isRotatableBillboard(obj.tile)) {
            const fixedAngle =
              obj.orientation !== undefined ? obj.orientation : null;

            if (fixedAngle === null) {
              const cacheKey = `${obj.tile}_${Math.floor(camera.angle * 100)}`;
              if (!billboardCache.has(cacheKey)) {
                billboardCache.set(
                  cacheKey,
                  this.getRotatedBillboardSprite(
                    obj.tile,
                    camera.angle,
                    worldX,
                    worldY,
                    null
                  )
                );
              }
              finalTile = billboardCache.get(cacheKey);
            } else {
              finalTile = this.getRotatedBillboardSprite(
                obj.tile,
                camera.angle,
                worldX,
                worldY,
                fixedAngle
              );
            }
          }

          const scale =
            obj.scale !== undefined
              ? obj.scale
              : this.billboard_scales[obj.tile] || 1.0;

          this.tempObjects[this.objectCount++] = {
            type: "billboard",
            x: worldX,
            y: worldY,
            tile: finalTile,
            dist: distSq,
            proj,
            scale: scale,
          };
        }
      } else if (this.isBlock(obj.tile)) {
        this.tempObjects[this.objectCount++] = {
          type: "block",
          x: worldX,
          y: height,
          z: worldY,
          tile: obj.tile,
          dist: distSq,
        };
      } else if (obj.type === "model3d") {
        this.tempObjects[this.objectCount++] = {
          type: "model3d",
          modelName: obj.modelName,
          x: worldX,
          y: height,
          z: worldY,
          tile: obj.tile,
          scale: obj.scale || 1.0,
          rotation: obj.rotation || { x: 0, y: 0, z: 0 },
          dist: distSq,
        };
      }
    }

    const objects = this.tempObjects.slice(0, this.objectCount);
    objects.sort((a, b) => b.dist - a.dist);
    return objects;
  }

  drawModel3DInstanced(modelName, instances, camera) {
    if (!instances || instances.length === 0) return;

    const model = this.models3D.get(modelName);
    if (!model) return;

    // ✅ Usar shader de modelos
    this.gl.useProgram(this.modelProgram);

    // Configurar geometría del modelo
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.buffer);

    this.gl.enableVertexAttribArray(this.attribLocations.model.position);
    this.gl.vertexAttribPointer(
      this.attribLocations.model.position,
      3,
      this.gl.FLOAT,
      false,
      32,
      0
    );

    this.gl.enableVertexAttribArray(this.attribLocations.model.texCoord);
    this.gl.vertexAttribPointer(
      this.attribLocations.model.texCoord,
      2,
      this.gl.FLOAT,
      false,
      32,
      12
    );

    this.gl.enableVertexAttribArray(this.attribLocations.model.normal);
    this.gl.vertexAttribPointer(
      this.attribLocations.model.normal,
      3,
      this.gl.FLOAT,
      false,
      32,
      20
    );

    // Uniforms comunes
    this.gl.uniform4f(
      this.uniformLocations.model.camera,
      camera.x,
      camera.y,
      camera.z,
      camera.angle
    );
    this.gl.uniform2f(
      this.uniformLocations.model.resolution,
      this.canvas.width,
      this.canvas.height
    );
    this.gl.uniform1i(
      this.uniformLocations.model.spriteIndex,
      instances[0].tile
    );
    this.gl.uniform1f(
      this.uniformLocations.model.spriteCount,
      this.tile_items_size
    );

    // Iluminación
    this.gl.uniform1i(
      this.uniformLocations.model.illumination,
      this.ILLUMINATION
    );
    this.gl.uniform1f(this.uniformLocations.model.ambient, this.AMBIENT_LIGHT);
    this.gl.uniform1f(this.uniformLocations.model.diffuse, this.LIGHT_DIFFUSE);

    const len = Math.sqrt(
      this.lightDir[0] * this.lightDir[0] +
        this.lightDir[1] * this.lightDir[1] +
        this.lightDir[2] * this.lightDir[2]
    );
    this.gl.uniform3f(
      this.uniformLocations.model.lightDir,
      this.lightDir[0] / len,
      this.lightDir[1] / len,
      this.lightDir[2] / len
    );

    // Textura
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteTexture);
    this.gl.uniform1i(this.uniformLocations.model.spritesheet, 0);

    // Niebla
    this.gl.uniform1i(this.uniformLocations.model.fogEnabled, this.FOG_ENABLED);
    this.gl.uniform1f(this.uniformLocations.model.fogStart, this.FOG_START);
    this.gl.uniform1f(this.uniformLocations.model.fogEnd, this.FOG_END);
    this.gl.uniform3f(
      this.uniformLocations.model.fogColor,
      this.FOG_COLOR[0],
      this.FOG_COLOR[1],
      this.FOG_COLOR[2]
    );

    // ✅ Dibujar cada instancia con su transformación única
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      const rotation = inst.rotation || { x: 0, y: 0, z: 0 };

      this.gl.uniform3f(
        this.uniformLocations.model.modelPos,
        inst.x,
        inst.y,
        inst.z
      );
      this.gl.uniform1f(
        this.uniformLocations.model.modelScale,
        inst.scale || 1.0
      );
      this.gl.uniform3f(
        this.uniformLocations.model.modelRotation,
        rotation.x,
        rotation.y,
        rotation.z
      );

      this.gl.drawArrays(this.gl.TRIANGLES, 0, model.vertexCount);
    }

    // Limpiar
    this.gl.disableVertexAttribArray(this.attribLocations.model.position);
    this.gl.disableVertexAttribArray(this.attribLocations.model.texCoord);
    this.gl.disableVertexAttribArray(this.attribLocations.model.normal);
  }

  // Renderizar cielo
  renderSky() {
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);
    this.gl.useProgram(this.skyProgram);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skyBuffer);
    this.gl.enableVertexAttribArray(this.attribLocations.sky.position);
    this.gl.vertexAttribPointer(
      this.attribLocations.sky.position,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.uniform3f(
      this.uniformLocations.sky.color1,
      this.color1[0],
      this.color1[1],
      this.color1[2]
    );
    this.gl.uniform3f(
      this.uniformLocations.sky.color2,
      this.color2[0],
      this.color2[1],
      this.color2[2]
    );
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
  renderSkydome(camera) {
    if (!this.SKYDOME_ENABLED || !this.skydomeTexture) return;

    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.gl.useProgram(this.skydomeProgram);

    // Matrices
    const viewMatrix = this.createViewMatrix(camera);
    const projMatrix = this.createProjectionMatrix();

    this.gl.uniformMatrix4fv(
      this.uniformLocations.skydome.viewMatrix,
      false,
      viewMatrix
    );
    this.gl.uniformMatrix4fv(
      this.uniformLocations.skydome.projMatrix,
      false,
      projMatrix
    );

    // Textura
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.skydomeTexture);
    this.gl.uniform1i(this.uniformLocations.skydome.skydomeTexture, 0);

    // Geometría
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skydomeBuffer);
    this.gl.enableVertexAttribArray(this.attribLocations.skydome.position);
    this.gl.vertexAttribPointer(
      this.attribLocations.skydome.position,
      3,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.skydomeIndexBuffer);
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.skydomeVertexCount,
      this.gl.UNSIGNED_SHORT,
      0
    );
  }
  createViewMatrix(camera) {
    const mat = new Float32Array(16);
    const cosA = Math.cos(camera.angle);
    const sinA = Math.sin(camera.angle);

    // Rotación Y + Traslación (la cámara está en el centro del skydome)
    mat[0] = cosA;
    mat[1] = 0;
    mat[2] = sinA;
    mat[3] = 0;
    mat[4] = 0;
    mat[5] = 1;
    mat[6] = 0;
    mat[7] = 0;
    mat[8] = -sinA;
    mat[9] = 0;
    mat[10] = cosA;
    mat[11] = 0;
    mat[12] = 0;
    mat[13] = -camera.z;
    mat[14] = 0;
    mat[15] = 1;

    return mat;
  }

  createProjectionMatrix() {
    const mat = new Float32Array(16);
    const fov = (60 * Math.PI) / 180;
    const aspect = this.canvas.width / this.canvas.height;
    const near = 0.1;
    const far = this.SKYDOME_RADIUS * 2;

    const f = 1.0 / Math.tan(fov / 2);
    mat[0] = f / aspect;
    mat[5] = f;
    mat[10] = (far + near) / (near - far);
    mat[11] = -1;
    mat[14] = (2 * far * near) / (near - far);

    return mat;
  }

  // Renderizar suelo
  renderGround(camera) {
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    //this.gl.disable(this.gl.BLEND);

    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.gl.useProgram(this.program);
    this.gl.enableVertexAttribArray(this.attribLocations.ground.position);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(
      this.attribLocations.ground.position,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.uniform1f(
      this.uniformLocations.ground.spriteCount,
      this.tile_items_size
    );
    this.gl.uniform4f(
      this.uniformLocations.ground.camera,
      camera.x,
      camera.y,
      camera.z,
      camera.angle
    );

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteTexture);
    this.gl.uniform1i(this.uniformLocations.ground.spritesheet, 0);

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tileMapTexture);
    this.gl.uniform1i(this.uniformLocations.ground.tileMapTexture, 1);

    // Niebla
    this.gl.uniform1i(
      this.uniformLocations.ground.fogEnabled,
      this.FOG_ENABLED
    );
    this.gl.uniform1f(this.uniformLocations.ground.fogStart, this.FOG_START);
    this.gl.uniform1f(this.uniformLocations.ground.fogEnd, this.FOG_END);
    this.gl.uniform3f(
      this.uniformLocations.ground.fogColor,
      this.FOG_COLOR[0],
      this.FOG_COLOR[1],
      this.FOG_COLOR[2]
    );

    // ═══════════════════════════════════════
    // TIEMPO PARA ANIMACIÓN DE AGUA
    // ═══════════════════════════════════════
    this.gl.uniform1f(this.uniformLocations.ground.time, this.time);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  // nuevo metodo billboards

  drawBillboardsInstanced(tileType, instances) {
    if (!instances || instances.length === 0) return;

    this.gl.useProgram(this.billboardProgram);

    // ✅ OPTIMIZACIÓN 1: Reutilizar buffer si es lo suficientemente grande
    const requiredSize = instances.length * 16; // 4 floats * 4 bytes
    if (
      !this.billboardInstanceData ||
      this.billboardInstanceData.byteLength < requiredSize
    ) {
      this.billboardInstanceData = new Float32Array(instances.length * 4);
    }

    // ✅ OPTIMIZACIÓN 2: Llenar datos sin crear nuevo array cada frame
    for (let i = 0; i < instances.length; i++) {
      const offset = i * 4;
      this.billboardInstanceData[offset + 0] = instances[i].proj.x;
      this.billboardInstanceData[offset + 1] = instances[i].proj.y;
      this.billboardInstanceData[offset + 2] = instances[i].proj.size;
      this.billboardInstanceData[offset + 3] = instances[i].scale || 1.0;
    }
    this.gl.depthMask(false);
    this.gl.disable(this.gl.BLEND);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.billboardInstanceBuffer);
    // ✅ OPTIMIZACIÓN 3: Usar STREAM_DRAW para datos que cambian cada frame
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.billboardInstanceData,
      this.gl.STREAM_DRAW
    );

    // Configurar geometría base (esto puede moverse a initBuffers para hacerlo solo una vez)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.billboardBuffer);
    this.gl.enableVertexAttribArray(this.attribLocations.billboard.offset);
    this.gl.vertexAttribPointer(
      this.attribLocations.billboard.offset,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    // Configurar atributos de instancia
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.billboardInstanceBuffer);
    this.gl.enableVertexAttribArray(
      this.attribLocations.billboard.instanceData
    );
    this.gl.vertexAttribPointer(
      this.attribLocations.billboard.instanceData,
      4,
      this.gl.FLOAT,
      false,
      16,
      0
    );
    this.gl.vertexAttribDivisor(this.attribLocations.billboard.instanceData, 1);

    // ✅ OPTIMIZACIÓN 4: Configurar uniforms una sola vez
    this.gl.uniform1i(this.uniformLocations.billboard.spriteIndex, tileType);
    this.gl.uniform1f(
      this.uniformLocations.billboard.spriteCount,
      this.tile_items_size
    );
    this.gl.uniform1i(
      this.uniformLocations.billboard.fogEnabled,
      this.FOG_ENABLED
    );
    this.gl.uniform1f(this.uniformLocations.billboard.fogStart, this.FOG_START);
    this.gl.uniform1f(this.uniformLocations.billboard.fogEnd, this.FOG_END);
    this.gl.uniform3f(
      this.uniformLocations.billboard.fogColor,
      this.FOG_COLOR[0],
      this.FOG_COLOR[1],
      this.FOG_COLOR[2]
    );

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteTexture);
    this.gl.uniform1i(this.uniformLocations.billboard.spritesheet, 0);

    // ✅ OPTIMIZACIÓN 5: Configurar depth/blend solo una vez al inicio del render pass
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.polygonOffset(-1.0, -1.0);
    this.gl.enable(this.gl.POLYGON_OFFSET_FILL);

    // Dibujar todas las instancias de una vez
    this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6, instances.length);

    this.gl.disable(this.gl.POLYGON_OFFSET_FILL);
    this.gl.vertexAttribDivisor(this.attribLocations.billboard.instanceData, 0);
  }

  // Renderizar billboard
  drawBillboard(billboard) {
    this.gl.useProgram(this.billboardProgram);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.billboardBuffer);
    this.gl.enableVertexAttribArray(this.attribLocations.billboard.offset);
    this.gl.vertexAttribPointer(
      this.attribLocations.billboard.offset,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.uniform2f(
      this.uniformLocations.billboard.screenPos,
      billboard.proj.x,
      billboard.proj.y
    );
    this.gl.uniform1f(
      this.uniformLocations.billboard.size,
      billboard.proj.size
    );
    this.gl.uniform1f(
      this.uniformLocations.billboard.scale,
      billboard.scale || 1.0
    );
    this.gl.uniform1i(
      this.uniformLocations.billboard.spriteIndex,
      billboard.tile
    );
    this.gl.uniform1f(
      this.uniformLocations.billboard.spriteCount,
      this.tile_items_size
    );
    //niebla
    // Calcular distancia del billboard
    const dx = billboard.x - this.lastCamera.x;
    const dy = billboard.y - this.lastCamera.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Añadir uniforms de niebla
    this.gl.uniform1i(
      this.uniformLocations.billboard.fogEnabled,
      this.FOG_ENABLED
    );
    this.gl.uniform1f(this.uniformLocations.billboard.fogStart, this.FOG_START);
    this.gl.uniform1f(this.uniformLocations.billboard.fogEnd, this.FOG_END);
    this.gl.uniform3f(
      this.uniformLocations.billboard.fogColor,
      this.FOG_COLOR[0],
      this.FOG_COLOR[1],
      this.FOG_COLOR[2]
    );
    this.gl.uniform1f(this.uniformLocations.billboard.distance, distance);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteTexture);
    this.gl.uniform1i(this.uniformLocations.billboard.spritesheet, 0);

    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.polygonOffset(-1.0, -1.0);
    this.gl.enable(this.gl.POLYGON_OFFSET_FILL);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    this.gl.disable(this.gl.POLYGON_OFFSET_FILL);
  }

  // Renderizar bloques instanciados
  // Renderizar bloques instanciados
  drawBlocksInstanced(tileType, instances, camera) {
    if (!instances || instances.length === 0) return;

    this.gl.useProgram(this.blockProgram);

    // Usar altura por defecto del tile
    const defaultHeight = this.tile_heights[tileType] || 1.0;

    const instanceData = new Float32Array(instances.length * 4);
    for (let i = 0; i < instances.length; i++) {
      // Usar customHeight individual de cada instancia, o el valor por defecto
      const height =
        instances[i].customHeight !== undefined &&
        instances[i].customHeight !== null
          ? instances[i].customHeight
          : defaultHeight;

      instanceData[i * 4 + 0] = instances[i].x;
      instanceData[i * 4 + 1] = instances[i].y;
      instanceData[i * 4 + 2] = instances[i].z;
      instanceData[i * 4 + 3] = height;
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      instanceData,
      this.gl.DYNAMIC_DRAW
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeBuffer);

    this.gl.enableVertexAttribArray(this.attribLocations.block.position);
    this.gl.vertexAttribPointer(
      this.attribLocations.block.position,
      3,
      this.gl.FLOAT,
      false,
      32,
      0
    );

    this.gl.enableVertexAttribArray(this.attribLocations.block.texCoord);
    this.gl.vertexAttribPointer(
      this.attribLocations.block.texCoord,
      2,
      this.gl.FLOAT,
      false,
      32,
      12
    );

    this.gl.enableVertexAttribArray(this.attribLocations.block.normal);
    this.gl.vertexAttribPointer(
      this.attribLocations.block.normal,
      3,
      this.gl.FLOAT,
      false,
      32,
      20
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
    this.gl.enableVertexAttribArray(this.attribLocations.block.instanceData);
    this.gl.vertexAttribPointer(
      this.attribLocations.block.instanceData,
      4,
      this.gl.FLOAT,
      false,
      16,
      0
    );
    this.gl.vertexAttribDivisor(this.attribLocations.block.instanceData, 1);

    this.gl.uniform4f(
      this.uniformLocations.block.camera,
      camera.x,
      camera.y,
      camera.z,
      camera.angle
    );
    this.gl.uniform2f(
      this.uniformLocations.block.resolution,
      this.canvas.width,
      this.canvas.height
    );
    this.gl.uniform1i(this.uniformLocations.block.spriteIndex, tileType);
    this.gl.uniform1f(
      this.uniformLocations.block.spriteCount,
      this.tile_items_size
    );

    this.gl.uniform1i(
      this.uniformLocations.block.illumination,
      this.ILLUMINATION
    );
    this.gl.uniform1f(this.uniformLocations.block.ambient, this.AMBIENT_LIGHT);
    this.gl.uniform1f(this.uniformLocations.block.diffuse, this.LIGHT_DIFFUSE);

    const len = Math.sqrt(
      this.lightDir[0] * this.lightDir[0] +
        this.lightDir[1] * this.lightDir[1] +
        this.lightDir[2] * this.lightDir[2]
    );
    this.gl.uniform3f(
      this.uniformLocations.block.lightDir,
      this.lightDir[0] / len,
      this.lightDir[1] / len,
      this.lightDir[2] / len
    );

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteTexture);
    this.gl.uniform1i(this.uniformLocations.block.spritesheet, 0);

    // Añadir uniforms de niebla antes del drawArraysInstanced:
    this.gl.uniform1i(this.uniformLocations.block.fogEnabled, this.FOG_ENABLED);
    this.gl.uniform1f(this.uniformLocations.block.fogStart, this.FOG_START);
    this.gl.uniform1f(this.uniformLocations.block.fogEnd, this.FOG_END);
    this.gl.uniform3f(
      this.uniformLocations.block.fogColor,
      this.FOG_COLOR[0],
      this.FOG_COLOR[1],
      this.FOG_COLOR[2]
    );

    this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 36, instances.length);

    this.gl.vertexAttribDivisor(this.attribLocations.block.instanceData, 0);
  }

  // Modificar el método render principal
  render(independentObjects = [], renderSky = true) {
    this.time += 0.016;
    let camera = this.camera;
    this.lastCamera = camera;
    this.updateTrigCache(camera);

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    if (renderSky) this.renderSky();
    if (this.SKYDOME_ENABLED) this.renderSkydome(camera);

    this.renderGround(camera);
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);

    const allObjects = this.collectRenderableObjects(
      camera,
      independentObjects
    );

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.depthMask(true);
    this.gl.disable(this.gl.BLEND);

    // Agrupar objetos por tipo
    let currentBlockTile = null;
    let blockBatch = [];
    let currentModelName = null;
    let modelBatch = [];

    for (const obj of allObjects) {
      if (obj.type === "block") {
        // Dibujar modelos 3D pendientes
        if (modelBatch.length > 0) {
          this.drawModel3DInstanced(currentModelName, modelBatch, camera);
          modelBatch = [];
          currentModelName = null;
        }

        // Agrupar bloques
        if (currentBlockTile === obj.tile) {
          blockBatch.push(obj);
        } else {
          if (blockBatch.length > 0) {
            this.drawBlocksInstanced(currentBlockTile, blockBatch, camera);
          }
          currentBlockTile = obj.tile;
          blockBatch = [obj];
        }
      } else if (obj.type === "model3d") {
        // Dibujar bloques pendientes
        if (blockBatch.length > 0) {
          this.drawBlocksInstanced(currentBlockTile, blockBatch, camera);
          blockBatch = [];
          currentBlockTile = null;
        }

        // Agrupar modelos 3D
        if (currentModelName === obj.modelName) {
          modelBatch.push(obj);
        } else {
          if (modelBatch.length > 0) {
            this.drawModel3DInstanced(currentModelName, modelBatch, camera);
          }
          currentModelName = obj.modelName;
          modelBatch = [obj];
        }
      } else if (obj.type === "billboard") {
        // Dibujar pendientes
        if (blockBatch.length > 0) {
          this.drawBlocksInstanced(currentBlockTile, blockBatch, camera);
          blockBatch = [];
          currentBlockTile = null;
        }
        if (modelBatch.length > 0) {
          this.drawModel3DInstanced(currentModelName, modelBatch, camera);
          modelBatch = [];
          currentModelName = null;
        }

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.depthMask(false);

        const billboardBatch = [obj];
        let nextIndex = allObjects.indexOf(obj) + 1;

        while (nextIndex < allObjects.length) {
          const nextObj = allObjects[nextIndex];
          if (nextObj.type === "billboard" && nextObj.tile === obj.tile) {
            billboardBatch.push(nextObj);
            nextIndex++;
          } else {
            break;
          }
        }

        this.drawBillboardsInstanced(obj.tile, billboardBatch);
        allObjects.splice(
          allObjects.indexOf(obj) + 1,
          billboardBatch.length - 1
        );

        this.gl.depthMask(true);
        this.gl.disable(this.gl.BLEND);
      } else if (obj.type === "ramp") {
        if (blockBatch.length > 0) {
          this.drawBlocksInstanced(currentBlockTile, blockBatch, camera);
          blockBatch = [];
          currentBlockTile = null;
        }
        if (modelBatch.length > 0) {
          this.drawModel3DInstanced(currentModelName, modelBatch, camera);
          modelBatch = [];
          currentModelName = null;
        }
        this.drawRamp(obj, camera);
      }
    }

    // Dibujar últimos batches
    if (blockBatch.length > 0) {
      this.drawBlocksInstanced(currentBlockTile, blockBatch, camera);
    }
    if (modelBatch.length > 0) {
      this.drawModel3DInstanced(currentModelName, modelBatch, camera);
    }

    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
  }

  // Métodos de utilidad
  toggleIllumination() {
    this.ILLUMINATION = !this.ILLUMINATION;
    return this.ILLUMINATION;
  }

  setIllumination(value) {
    this.ILLUMINATION = value;
  }

  setAmbientLight(value) {
    this.AMBIENT_LIGHT = value;
  }

  setLightDiffuse(value) {
    this.LIGHT_DIFFUSE = value;
  }

  setLightDirection(x, y, z) {
    this.lightDir = [x, y, z];
  }

  setSkyColors(color1, color2) {
    this.color1 = color1;
    this.color2 = color2;
  }

  resize(width, height) {
    this.canvas.width = width * this.RENDER_SCALE;
    this.canvas.height = height * this.RENDER_SCALE;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
  }

  enableSkydome(enabled) {
    this.SKYDOME_ENABLED = enabled;
  }

  setSkydomeRadius(radius) {
    this.SKYDOME_RADIUS = radius;
    this.createSkydomeGeometry();
  }

  toggleFog() {
    this.FOG_ENABLED = !this.FOG_ENABLED;
    return this.FOG_ENABLED;
  }

  setFogEnabled(value) {
    this.FOG_ENABLED = value;
  }

  setFogStart(value) {
    this.FOG_START = value;
  }

  setFogEnd(value) {
    this.FOG_END = value;
  }

  setFogColor(r, g, b) {
    this.FOG_COLOR = [r, g, b];
  }

  setFogRange(start, end) {
    this.FOG_START = start;
    this.FOG_END = end;
  }

  //funciones auxiliares

  transformNumber(n) {
    return Number(n).toFixed(1);
  }
  //rampas :
  getRampType(x, y, currentHeight) {
    const neighbors = this.getNeighborHeights(x, y);
    const heightDiffs = {
      north: neighbors.north - currentHeight,
      east: neighbors.east - currentHeight,
      south: neighbors.south - currentHeight,
      west: neighbors.west - currentHeight,
    };

    const highSides = [];
    const lowSides = [];

    Object.keys(heightDiffs).forEach((dir) => {
      if (heightDiffs[dir] === 1) highSides.push(dir);
      if (heightDiffs[dir] === -1) lowSides.push(dir);
    });

    if (highSides.length + lowSides.length === 0)
      return { type: this.RAMP_TYPES.NONE };

    // RAMPA ASCENDENTE: 1 lado alto
    if (highSides.length === 1 && lowSides.length === 0) {
      return {
        type: this.RAMP_TYPES.STRAIGHT,
        direction: highSides[0],
        ascending: true,
      };
    }

    // RAMPA DESCENDENTE: 1 lado bajo (NUEVA - solo para rampas rectas)
    if (lowSides.length === 1 && highSides.length === 0) {
      return {
        type: this.RAMP_TYPES.STRAIGHT,
        direction: lowSides[0],
        ascending: false, // ← Esta es descendente
      };
    }

    // ESQUINA EXTERIOR: 2 lados altos adyacentes
    if (highSides.length === 2 && lowSides.length === 0) {
      const adjacent = this.areAdjacent(highSides[0], highSides[1]);
      if (adjacent) {
        return {
          type: this.RAMP_TYPES.OUTER_CORNER,
          corner: this.getCornerName(highSides),
          ascending: true,
        };
      }
    }

    // ESQUINA INTERIOR: 2 lados bajos adyacentes
    if (lowSides.length === 2 && highSides.length === 0) {
      const adjacent = this.areAdjacent(lowSides[0], lowSides[1]);
      if (adjacent) {
        return {
          type: this.RAMP_TYPES.INNER_CORNER,
          corner: this.getCornerName(lowSides),
          ascending: false,
        };
      }
    }

    return { type: this.RAMP_TYPES.NONE };
  }

  getNeighborHeights(x, y) {
    const getHeight = (nx, ny) => {
      if (nx < 0 || ny < 0 || nx >= this.MAP_WIDTH || ny >= this.MAP_HEIGHT) {
        return 0;
      }
      const idx = ny * this.MAP_WIDTH + nx;
      return this.heightMap ? this.heightMap[idx] || 0 : 0;
    };

    return {
      north: getHeight(x, y - 1),
      east: getHeight(x + 1, y),
      south: getHeight(x, y + 1),
      west: getHeight(x - 1, y),
    };
  }

  areAdjacent(dir1, dir2) {
    const adjacentPairs = [
      ["north", "east"],
      ["east", "south"],
      ["south", "west"],
      ["west", "north"],
    ];

    return adjacentPairs.some(
      (pair) =>
        (pair[0] === dir1 && pair[1] === dir2) ||
        (pair[1] === dir1 && pair[0] === dir2)
    );
  }

  getCornerName(dirs) {
    const set = new Set(dirs);

    // La esquina está donde se JUNTAN los dos lados, no en el lado opuesto

    // Si tenemos north + east → esquina en northeast (donde se juntan)
    if (set.has("north") && set.has("east")) return "northeast";

    // Si tenemos south + east → esquina en southeast (donde se juntan)
    if (set.has("south") && set.has("east")) return "southeast";

    // Si tenemos south + west → esquina en southwest (donde se juntan)
    if (set.has("south") && set.has("west")) return "southwest";

    // Si tenemos north + west → esquina en northwest (donde se juntan)
    if (set.has("north") && set.has("west")) return "northwest";

    return "northeast"; // Fallback
  }

  // ============================================
  // 3. GEOMETRÍA DE RAMPAS
  // ============================================

  
getStraightRampVertices(direction, ascending) {
  // Rampa recta: rampa sube en la dirección especificada
  // north = sube hacia Y-, east = sube hacia X+, south = sube hacia Y+, west = sube hacia X-
  
const rotations = {
  north: 180,    // ←bien
  east: 270,    // ← Cambiar
  south: 0,  // ← Cambiar
  west: 90    // ← Cambiar
};
  
  const angle = (rotations[direction] || 0) * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  const rotate = (x, z) => ({
    x: x * cos - z * sin,
    z: x * sin + z * cos
  });
  
  // Vertices base: rampa con lado bajo en Z+ (0.0) y lado alto en Z- (1.0)
  const verts = [];
  
  // Cara inclinada (6 vértices = 2 triángulos)
  const normal = { x: 0, y: 0.7071, z: 0.7071 };
  verts.push(
    -0.5, 0.0,  0.5,  0, 0,  normal.x, normal.y, normal.z,
     0.5, 0.0,  0.5,  1, 0,  normal.x, normal.y, normal.z,
     0.5, 1.0, -0.5,  1, 1,  normal.x, normal.y, normal.z,
    
    -0.5, 0.0,  0.5,  0, 0,  normal.x, normal.y, normal.z,
     0.5, 1.0, -0.5,  1, 1,  normal.x, normal.y, normal.z,
    -0.5, 1.0, -0.5,  0, 1,  normal.x, normal.y, normal.z
  );
  
  // Cara trasera vertical (lado alto)
  verts.push(
     0.5, 1.0, -0.5,  1, 1,  0, 0, -1,
    -0.5, 1.0, -0.5,  0, 1,  0, 0, -1,
    -0.5, 0.0, -0.5,  0, 0,  0, 0, -1,
    
     0.5, 1.0, -0.5,  1, 1,  0, 0, -1,
    -0.5, 0.0, -0.5,  0, 0,  0, 0, -1,
     0.5, 0.0, -0.5,  1, 0,  0, 0, -1
  );
  
  // Cara izquierda (triángulo)
  verts.push(
    -0.5, 0.0, -0.5,  0, 1,  -1, 0, 0,
    -0.5, 1.0, -0.5,  0, 1,  -1, 0, 0,
    -0.5, 0.0,  0.5,  1, 0,  -1, 0, 0
  );
  
  // Cara derecha (triángulo)
  verts.push(
     0.5, 0.0,  0.5,  0, 0,  1, 0, 0,
     0.5, 1.0, -0.5,  1, 1,  1, 0, 0,
     0.5, 0.0, -0.5,  1, 0,  1, 0, 0
  );
  
  // Cara inferior
  verts.push(
    -0.5, 0.0, -0.5,  0, 0,  0, -1, 0,
     0.5, 0.0, -0.5,  1, 0,  0, -1, 0,
     0.5, 0.0,  0.5,  1, 1,  0, -1, 0,
    
    -0.5, 0.0, -0.5,  0, 0,  0, -1, 0,
     0.5, 0.0,  0.5,  1, 1,  0, -1, 0,
    -0.5, 0.0,  0.5,  0, 1,  0, -1, 0
  );
  
  // Rotar todos los vértices según la dirección
  const rotated = [];
  for (let i = 0; i < verts.length; i += 8) {
    const pos = rotate(verts[i], verts[i + 2]);
    rotated.push(
      pos.x, verts[i + 1], pos.z,  // Posición rotada
      verts[i + 3], verts[i + 4],  // UV
      verts[i + 5], verts[i + 6], verts[i + 7]  // Normales (sin rotar por simplicidad)
    );
  }
  
  return new Float32Array(rotated);
}


getInnerCornerRampVertices(corner, ascending) {
  // Esquina interior: rampa diagonal
  // El vértice alto está en la esquina especificada
  
// En getInnerCornerRampVertices() - CAMBIAR a:
const rotations = {
  northeast: 180,
  southeast: 270,  // ← bien
  southwest: 0,  //<-- bien
  northwest: 90   // ← Todo en 0
};
  
  const angle = (rotations[corner] || 0) * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  const rotate = (x, z) => ({
    x: x * cos - z * sin,
    z: x * sin + z * cos
  });
  
  // Base: esquina interior con vértice alto en (+0.5, -0.5)
  const verts = [];
  const normalDiag = { x: 0.577, y: 0.577, z: 0.577 };
  
  // Cara inclinada diagonal principal (2 triángulos)
  verts.push(
    // Triángulo 1
    -0.5, 0.0, -0.5,  0, 0,  normalDiag.x, normalDiag.y, normalDiag.z,
    -0.5, 0.0,  0.5,  0, 1,  normalDiag.x, normalDiag.y, normalDiag.z,
     0.5, 1.0, -0.5,  1, 1,  normalDiag.x, normalDiag.y, normalDiag.z,
    
    // Triángulo 2
    -0.5, 0.0,  0.5,  0, 1,  normalDiag.x, normalDiag.y, normalDiag.z,
     0.5, 0.0,  0.5,  1, 0,  normalDiag.x, normalDiag.y, normalDiag.z,
     0.5, 1.0, -0.5,  1, 1,  normalDiag.x, normalDiag.y, normalDiag.z
  );
  
  // Cara vertical norte (Z-)
  verts.push(
     0.5, 1.0, -0.5,  1, 1,  0, 0, -1,
    -0.5, 0.0, -0.5,  0, 0,  0, 0, -1,
     0.5, 0.0, -0.5,  1, 0,  0, 0, -1
  );
  
  // Cara vertical este (X+)
  verts.push(
     0.5, 0.0, -0.5,  0, 0,  1, 0, 0,
     0.5, 1.0, -0.5,  0, 1,  1, 0, 0,
     0.5, 0.0,  0.5,  1, 0,  1, 0, 0
  );
  
  // Cara inferior
  verts.push(
    -0.5, 0.0, -0.5,  0, 0,  0, -1, 0,
     0.5, 0.0, -0.5,  1, 0,  0, -1, 0,
     0.5, 0.0,  0.5,  1, 1,  0, -1, 0,
    
    -0.5, 0.0, -0.5,  0, 0,  0, -1, 0,
     0.5, 0.0,  0.5,  1, 1,  0, -1, 0,
    -0.5, 0.0,  0.5,  0, 1,  0, -1, 0
  );
  
  // Rotar según esquina
  const rotated = [];
  for (let i = 0; i < verts.length; i += 8) {
    const pos = rotate(verts[i], verts[i + 2]);
    rotated.push(
      pos.x, verts[i + 1], pos.z,
      verts[i + 3], verts[i + 4],
      verts[i + 5], verts[i + 6], verts[i + 7]
    );
  }
  
  return new Float32Array(rotated);
}


getOuterCornerRampVertices(corner, ascending) {
    // Esquina exterior: rampa convexa (pirámide invertida)
    // El vértice bajo está en la esquina especificada
    //TODO
    const rotations = {
      northeast: 180,   // ← Cambiar de 90
      southeast: 270,   // ← Cambiar de 90
      southwest: 0,     // ← Cambiar de 90
      northwest: 90     // ← Mantener
    };
    
    const angle = (rotations[corner] || 0) * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const rotate = (x, z) => ({
      x: x * cos - z * sin,
      z: x * sin + z * cos
    });
    
    // Base: esquina exterior con vértice bajo en (+0.5, -0.5, 0.0)
    const verts = [];
    const normalNE = { x: 0.577, y: 0.577, z: -0.577 };
    const normalNW = { x: -0.577, y: 0.577, z: -0.577 };
    
    // Cara inclinada norte (Z-) - triángulo
    verts.push(
      -0.5, 1.0, -0.5,  0, 1,  0, 0.7071, -0.7071,
      0.5, 0.0, -0.5,  1, 0,  0, 0.7071, -0.7071,
      0.5, 1.0, -0.5,  1, 1,  0, 0.7071, -0.7071
    );
    
    // Cara inclinada este (X+) - triángulo
    verts.push(
      0.5, 1.0, -0.5,  1, 1,  0.7071, 0.7071, 0,
      0.5, 0.0, -0.5,  1, 0,  0.7071, 0.7071, 0,
      0.5, 1.0,  0.5,  0, 1,  0.7071, 0.7071, 0
    );
    
    // Cara inclinada diagonal - triángulo
    verts.push(
      0.5, 0.0, -0.5,  1, 0,  normalNE.x, normalNE.y, normalNE.z,
      -0.5, 1.0, -0.5,  0, 1,  normalNE.x, normalNE.y, normalNE.z,
      0.5, 1.0,  0.5,  1, 1,  normalNE.x, normalNE.y, normalNE.z
    );
    
    // Cara vertical sur (Z+)
    verts.push(
      -0.5, 1.0, -0.5,  0, 1,  0, 0, 1,
      -0.5, 1.0,  0.5,  0, 1,  0, 0, 1,
      0.5, 1.0,  0.5,  1, 1,  0, 0, 1
    );
    
    // Cara vertical oeste (X-)
    verts.push(
      -0.5, 1.0,  0.5,  1, 1,  -1, 0, 0,
      -0.5, 1.0, -0.5,  0, 1,  -1, 0, 0,
      -0.5, 0.0, -0.5,  0, 0,  -1, 0, 0
    );
    
    // Cara superior (techo plano)
    verts.push(
      -0.5, 1.0, -0.5,  0, 0,  0, 1, 0,
      0.5, 1.0,  0.5,  1, 1,  0, 1, 0,
      -0.5, 1.0,  0.5,  0, 1,  0, 1, 0,
      
      -0.5, 1.0, -0.5,  0, 0,  0, 1, 0,
      0.5, 1.0, -0.5,  1, 0,  0, 1, 0,
      0.5, 1.0,  0.5,  1, 1,  0, 1, 0
    );
    
    // Cara inferior
    verts.push(
      -0.5, 0.0, -0.5,  0, 0,  0, -1, 0,
      0.5, 0.0, -0.5,  1, 0,  0, -1, 0,
      0.5, 0.0,  0.5,  1, 1,  0, -1, 0,
      
      -0.5, 0.0, -0.5,  0, 0,  0, -1, 0,
      0.5, 0.0,  0.5,  1, 1,  0, -1, 0,
      -0.5, 0.0,  0.5,  0, 1,  0, -1, 0
    );
    
    // Rotar según esquina
    const rotated = [];
    for (let i = 0; i < verts.length; i += 8) {
      const pos = rotate(verts[i], verts[i + 2]);
      rotated.push(
        pos.x, verts[i + 1], pos.z,
        verts[i + 3], verts[i + 4],
        verts[i + 5], verts[i + 6], verts[i + 7]
      );
    }
    
    return new Float32Array(rotated);
  }

  getRampVertices(rampInfo) {
    // Retorna vértices personalizados según el tipo de rampa
    const { type, direction, corner, ascending } = rampInfo;

    if (type === this.RAMP_TYPES.STRAIGHT) {
      return this.getStraightRampVertices(direction, ascending);
    } else if (type === this.RAMP_TYPES.INNER_CORNER) {
      return this.getInnerCornerRampVertices(corner, ascending);
    } else if (type === this.RAMP_TYPES.OUTER_CORNER) {
      return this.getOuterCornerRampVertices(corner, ascending);
    }

    return null;
  }

  drawRamp(ramp, camera) {
    // Crear geometría específica para esta rampa
    const rampVertices = this.getRampVertices(ramp.rampInfo);
    if (!rampVertices) return;

    this.gl.useProgram(this.blockProgram);
    this.gl.disable(this.gl.CULL_FACE);

    // Buffer temporal para esta rampa - IMPORTANTE: vincular ANTES de configurar atributos
    const tempBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, tempBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      rampVertices,
      this.gl.DYNAMIC_DRAW
    );

    // Configurar atributos con el buffer temporal ya vinculado
    // Stride = 32 bytes (3 floats pos + 2 floats UV + 3 floats normal = 8 floats * 4 bytes)
    this.gl.enableVertexAttribArray(this.attribLocations.block.position);
    this.gl.vertexAttribPointer(
      this.attribLocations.block.position,
      3,
      this.gl.FLOAT,
      false,
      32,
      0
    );

    this.gl.enableVertexAttribArray(this.attribLocations.block.texCoord);
    this.gl.vertexAttribPointer(
      this.attribLocations.block.texCoord,
      2,
      this.gl.FLOAT,
      false,
      32,
      12
    );

    this.gl.enableVertexAttribArray(this.attribLocations.block.normal);
    this.gl.vertexAttribPointer(
      this.attribLocations.block.normal,
      3,
      this.gl.FLOAT,
      false,
      32,
      20
    );

    // Resetear divisor para estos atributos (no son instanciados)
    this.gl.vertexAttribDivisor(this.attribLocations.block.position, 0);
    this.gl.vertexAttribDivisor(this.attribLocations.block.texCoord, 0);
    this.gl.vertexAttribDivisor(this.attribLocations.block.normal, 0);

    // Ahora configurar el instance buffer
    //const height = ramp.targetHeight - ramp.baseHeight;
    const instanceData = new Float32Array([
      ramp.x,
      ramp.y,
      ramp.z,
      ramp.targetHeight - ramp.baseHeight,
    ]);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      instanceData,
      this.gl.DYNAMIC_DRAW
    );

    this.gl.enableVertexAttribArray(this.attribLocations.block.instanceData);
    this.gl.vertexAttribPointer(
      this.attribLocations.block.instanceData,
      4,
      this.gl.FLOAT,
      false,
      16,
      0
    );
    this.gl.vertexAttribDivisor(this.attribLocations.block.instanceData, 1);

    // Uniforms
    this.gl.uniform4f(
      this.uniformLocations.block.camera,
      camera.x,
      camera.y,
      camera.z,
      camera.angle
    );
    this.gl.uniform2f(
      this.uniformLocations.block.resolution,
      this.canvas.width,
      this.canvas.height
    );
    this.gl.uniform1i(this.uniformLocations.block.spriteIndex, ramp.tile);
    this.gl.uniform1f(
      this.uniformLocations.block.spriteCount,
      this.tile_items_size
    );

    // Iluminación y niebla
    this.gl.uniform1i(
      this.uniformLocations.block.illumination,
      this.ILLUMINATION
    );
    this.gl.uniform1f(this.uniformLocations.block.ambient, this.AMBIENT_LIGHT);
    this.gl.uniform1f(this.uniformLocations.block.diffuse, this.LIGHT_DIFFUSE);

    const len = Math.sqrt(
      this.lightDir[0] * this.lightDir[0] +
        this.lightDir[1] * this.lightDir[1] +
        this.lightDir[2] * this.lightDir[2]
    );
    this.gl.uniform3f(
      this.uniformLocations.block.lightDir,
      this.lightDir[0] / len,
      this.lightDir[1] / len,
      this.lightDir[2] / len
    );

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteTexture);
    this.gl.uniform1i(this.uniformLocations.block.spritesheet, 0);

    this.gl.uniform1i(this.uniformLocations.block.fogEnabled, this.FOG_ENABLED);
    this.gl.uniform1f(this.uniformLocations.block.fogStart, this.FOG_START);
    this.gl.uniform1f(this.uniformLocations.block.fogEnd, this.FOG_END);
    this.gl.uniform3f(
      this.uniformLocations.block.fogColor,
      this.FOG_COLOR[0],
      this.FOG_COLOR[1],
      this.FOG_COLOR[2]
    );

    // Dibujar
    const vertexCount = rampVertices.length / 8; // 8 floats por vértice
    this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, vertexCount, 1);

    // CRÍTICO: Limpiar TODOS los atributos y divisores
    this.gl.disableVertexAttribArray(this.attribLocations.block.position);
    this.gl.disableVertexAttribArray(this.attribLocations.block.texCoord);
    this.gl.disableVertexAttribArray(this.attribLocations.block.normal);
    this.gl.disableVertexAttribArray(this.attribLocations.block.instanceData);
    this.gl.vertexAttribDivisor(this.attribLocations.block.instanceData, 0);

    this.gl.deleteBuffer(tempBuffer);
  }
  setWaterTiles(tiles) {
    this.water_tiles = tiles;
    this.water_tiles_set = new Set(tiles);
  }

  setWaterAnimation(speed, wave) {
    this.WATER_SPEED = speed;
    this.WATER_WAVE = wave;
  }

  isWaterTile(tile) {
    return this.water_tiles_set.has(tile);
  }

  async loadModel(name, objUrl) {
    try {
      console.log(`Cargando modelo: ${name} desde ${objUrl}`);

      const objData = await OBJLoader.load(objUrl);
      const vertexArray = OBJLoader.toVertexArray(objData);

      // Crear buffer WebGL
      const buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        vertexArray,
        this.gl.STATIC_DRAW
      );

      const model = {
        name,
        vertexCount: vertexArray.length / 8, // 8 floats por vértice
        buffer,
        vertexArray,
      };

      this.models3D.set(name, model);
      this.modelBuffers.set(name, buffer);

      console.log(`Modelo ${name} cargado: ${model.vertexCount} vértices`);
      return model;
    } catch (error) {
      console.error(`Error cargando modelo ${name}:`, error);
      throw error;
    }
  }

  // Método para crear instancias de modelos en la escena
  createModelInstance(modelName, x, y, z, options = {}) {
    // ✅ No verificar aquí, solo crear el objeto
    // El modelo puede no estar cargado todavía, pero eso está OK

    return {
      type: "model3d",
      modelName,
      x,
      y,
      z,
      scale: options.scale || 1.0,
      rotation: options.rotation || { x: 0, y: 0, z: 0 },
      tile: options.tile || 1,
      customHeight: options.height || null,
    };
  }

  //metodo auxiliar para pasar de rgb a 0/1
  normalizeColor(c) {
    return c[0] > 1 || c[1] > 1 || c[2] > 1
      ? [c[0] / 255, c[1] / 255, c[2] / 255]
      : c;
  }
}
//parser obj
// Agregar a glitter7engine.js

class OBJLoader {
  static async load(url) {
    const response = await fetch(url);
    const text = await response.text();
    return this.parse(text);
  }
  static simplify(objData, targetReduction = 0.5) {
    // targetReduction: 0.5 = reducir a 50%, 0.1 = reducir a 10%

    console.log(
      `Simplificando modelo: ${objData.faces.length} caras originales`
    );

    const newFaces = [];
    const step = Math.max(1, Math.floor(1 / targetReduction));

    // Tomar 1 de cada N caras
    for (let i = 0; i < objData.faces.length; i += step) {
      newFaces.push(objData.faces[i]);
    }

    console.log(
      `Simplificado a: ${newFaces.length} caras (${(
        (newFaces.length / objData.faces.length) *
        100
      ).toFixed(1)}%)`
    );

    return {
      vertices: objData.vertices,
      texCoords: objData.texCoords,
      normals: objData.normals,
      faces: newFaces,
    };
  }

  static async load(url) {
    const response = await fetch(url);
    const text = await response.text();
    return this.parse(text);
  }

  static parse(objText) {
    const vertices = [];
    const texCoords = [];
    const normals = [];
    const faces = [];

    const lines = objText.split("\n");

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const type = parts[0];

      if (type === "v") {
        vertices.push(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        );
      } else if (type === "vt") {
        texCoords.push(parseFloat(parts[1]), parseFloat(parts[2]));
      } else if (type === "vn") {
        normals.push(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        );
      } else if (type === "f") {
        const face = [];
        for (let i = 1; i < parts.length; i++) {
          const indices = parts[i].split("/");
          face.push({
            v: parseInt(indices[0]) - 1,
            vt: indices[1] ? parseInt(indices[1]) - 1 : null,
            vn: indices[2] ? parseInt(indices[2]) - 1 : null,
          });
        }
        faces.push(face);
      }
    }

    return { vertices, texCoords, normals, faces };
  }

  static toVertexArray(objData) {
    const vertexData = [];

    for (const face of objData.faces) {
      const triangles =
        face.length === 3
          ? [face]
          : [
              [face[0], face[1], face[2]],
              [face[0], face[2], face[3]],
            ];

      for (const tri of triangles) {
        for (const vertex of tri) {
          const vIdx = vertex.v * 3;
          vertexData.push(
            objData.vertices[vIdx],
            objData.vertices[vIdx + 1],
            objData.vertices[vIdx + 2]
          );

          if (vertex.vt !== null) {
            const vtIdx = vertex.vt * 2;
            vertexData.push(
              objData.texCoords[vtIdx],
              objData.texCoords[vtIdx + 1]
            );
          } else {
            vertexData.push(0, 0);
          }

          if (vertex.vn !== null) {
            const vnIdx = vertex.vn * 3;
            vertexData.push(
              objData.normals[vnIdx],
              objData.normals[vnIdx + 1],
              objData.normals[vnIdx + 2]
            );
          } else {
            vertexData.push(0, 1, 0);
          }
        }
      }
    }

    return new Float32Array(vertexData);
  }
}
