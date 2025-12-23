                                                                                                                                                                
//   ▄████  ▄▄    ▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄  ██████ ██████ ▄▄  ▄▄  ▄▄▄▄ ▄▄ ▄▄  ▄▄ ▄▄▄▄▄ 
//  ██  ▄▄▄ ██    ██   ██     ██   ██▄▄  ██▄█▄   ▄██▀ ██▄▄   ███▄██ ██ ▄▄ ██ ███▄██ ██▄▄  V.0.0.1 alpha
//   ▀███▀  ██▄▄▄ ██   ██     ██   ██▄▄▄ ██ ██  ██▀   ██▄▄▄▄ ██ ▀██ ▀███▀ ██ ██ ▀██ ██▄▄▄  By TonyPonyy
                                                                                      
//constantes

    const FOG_ENABLED_DEFAULT = true;
    const FOG_START_DEFAULT = 30;
    const FOG_END_DEFAULT = 80;
    const CANVAS_POWER_PREFERENCE_DEFAULT = 'default'; 
    const CANVAS_ANTIALIAS_DEFAULT = true; 
    const SKYDOME_HORIZONTAL_REP_DEFAULT = '1'
    const SKYDOME_VERTICAL_REP_DEFAULT = '1'
    const SKYDOME_RADIUS_DEFAULT = 100;
    const SKYDOME_SEGMENTS_DEFAULT =32;
    const SKYDOME_ENABLED_DEFAULT = false;
    const MAX_RENDER_DISTANCE_DEFAULT = 100;
    const FRUSTUM_MARGIN_DEFAULT = 0.4;
    const DEFAULT_BILLBOARD_GROUND_DEFAULT = 0;


class Glitter7engine {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    //creamos la camara
    this.camera ={x:0,y:0,z:0,angle:0};
    
    // Configuración
    this.MAX_RENDER_DISTANCE = config.maxRenderDistance || MAX_RENDER_DISTANCE_DEFAULT;
    this.FRUSTUM_MARGIN = this.transformNumber(( config.frustumMargin || 0.4));
    this.TILE_SIZE = this.transformNumber(config.tileSize) ;
    this.MAP_WIDTH = config.map.mapWidth ;
    this.MAP_HEIGHT = config.map.mapHeight ;
    this.RENDER_SCALE = this.transformNumber((config.renderScale || 1.0));

    
    // Tiles
    this.billboard_tiles = config.billboardTiles || [];
    this.block_tiles = config.blockTiles || [];
    this.billboard_tiles_set = new Set(this.billboard_tiles);
    this.block_tiles_set = new Set(this.block_tiles);
    this.tile_heights = config.tileHeights || {};
    this.heightMap = config.heightMap || null;
    this.DEFAULT_BILLBOARD_GROUND = config.defaultBillboardGround || DEFAULT_BILLBOARD_GROUND_DEFAULT;
    this.billboard_ground_tiles = config.billboardGroundTiles || {};
    // Billboards rotables y escalas
    this.rotatable_billboards = config.rotatableBillboards || [];
    this.rotatable_billboards_set = new Set(this.rotatable_billboards);
    this.billboard_scales = config.billboardScales || {}; // {tile: scale}

    
    // Iluminación
    if (config.light !=null){
      this.ILLUMINATION = config.light.illumination !== undefined ? config.light.illumination : true;
      this.AMBIENT_LIGHT = config.light.ambientLight || 0.5;
      this.LIGHT_DIFFUSE = config.light.lightDiffuse || 0.7;
      this.lightDir = config.light.lightDir || [0.3, 0.7, 0.5];
    }else{
      this.ILLUMINATION=true,
      this.AMBIENT_LIGHT =0.5;
      this.LIGHT_DIFFUSE = 0.7;
      this.lightDir = [0.3, 0.7, 0.5]
    }
     
    if (config.camera){
      this.camera.x = config.camera.x || 0;
      this.camera.y = config.camera.y || 0;
      this.camera.z = config.camera.z || 0;
      this.angle =  config.camera.angle || 0;
    }
    
    // Colores del cielo
    if (config.background != null){
      this.color1 = config.background.color1 || [0.5, 0.7, 1.0];
      this.color2 = config.background.color2 || this.color1;
    }else{
      this.color1 = [0.5, 0.7, 1.0];
      this.color2 = this.color1;
    }
    
    // Skydome
    if (config.skydome){
      this.SKYDOME_ENABLED = config.skydome.enabled !== undefined ? config.skydome.enabled : SKYDOME_ENABLED_DEFAULT;
      this.SKYDOME_RADIUS = config.skydome.radius || SKYDOME_RADIUS_DEFAULT;
      this.SKYDOME_SEGMENTS = config.skydome.segments || SKYDOME_SEGMENTS_DEFAULT;
      this.skydomeTexture = null;
      this.skydome_rep_h = this.transformNumber( (config.skydome.rep_h || SKYDOME_HORIZONTAL_REP_DEFAULT));
      this.skydome_vert_ajust = this.transformNumber( (config.skydome.rep_v || SKYDOME_VERTICAL_REP_DEFAULT) );
    }else{
      this.SKYDOME_ENABLED = SKYDOME_ENABLED_DEFAULT;
      this.SKYDOME_RADIUS = SKYDOME_RADIUS_DEFAULT;
      this.SKYDOME_SEGMENTS = SKYDOME_SEGMENTS_DEFAULT;
      this.skydomeTexture = null;
      this.skydome_rep_h = this.transformNumber(SKYDOME_HORIZONTAL_REP_DEFAULT);
      this.skydome_vert_ajust = this.transformNumber(SKYDOME_VERTICAL_REP_DEFAULT);
    }
        // Niebla
    if (config.fog){
      this.FOG_ENABLED = config.fog.enabled !== undefined ? config.fog.enabled : FOG_ENABLED_DEFAULT;
      this.FOG_START = config.fog.start || FOG_START_DEFAULT;  // Distancia donde empieza la niebla
      this.FOG_END = config.fog.end || FOG_END_DEFAULT;      // Distancia donde es niebla completa
      this.FOG_COLOR = config.fog.color || this.color1; // Color de la niebla
    }else{
      this.FOG_ENABLED =  FOG_ENABLED_DEFAULT;
      this.FOG_START =  FOG_START_DEFAULT;  // Distancia donde empieza la niebla
      this.FOG_END =  FOG_END_DEFAULT;      // Distancia donde es niebla completa
      this.FOG_COLOR = this.color1; // Color de la niebla
    }


    // WebGL Context
    let contextOptions = this.canvas.getContext('webgl2', {
      alpha: CANVAS_ANTIALIAS_DEFAULT,
      depth: true,
      stencil: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: CANVAS_POWER_PREFERENCE_DEFAULT, //''default',low-power,'high-performance',
      failIfMajorPerformanceCaveat: false // <-- para que en chrome pueda usar la gpu
    });
    
      this.gl = this.canvas.getContext('webgl2', contextOptions);
  
  if (!this.gl) {
    // Fallback a WebGL1
    console.warn('WebGL2 no disponible, intentando WebGL1...');
    this.gl = this.canvas.getContext('webgl', contextOptions) || 
              this.canvas.getContext('experimental-webgl', contextOptions);
  }
  
  if (!this.gl) {
    throw new Error('WebGL no está disponible en este navegador');
  }
  
  // Verificar extensiones necesarias para WebGL1
  if (!this.gl.getExtension) {
    console.warn('Contexto WebGL limitado');
  }
  
  console.log('WebGL Version:', this.gl.getParameter(this.gl.VERSION));
  console.log('WebGL Vendor:', this.gl.getParameter(this.gl.VENDOR));
  console.log('WebGL Renderer:', this.gl.getParameter(this.gl.RENDERER));
    
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
    this.initUniforms();
    this.setTileMap(config.map.array);

  }
  
  initTextures() {
    this.spriteTexture = this.gl.createTexture();
    this.tileMapTexture = this.gl.createTexture();
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tileMapTexture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    // Textura del skydome
    this.skydomeTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.skydomeTexture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);

  }
  
  initShaders() {
    // Crear shaders
    this.program = this.createProgram(this.getGroundVS(), this.getGroundFS());
    this.billboardProgram = this.createProgram(this.getBillboardVS(), this.getBillboardFS());
    this.blockProgram = this.createProgram(this.getBlockVS(), this.getBlockFS());
    this.skyProgram = this.createProgram(this.getSkyVS(), this.getSkyFS());
    this.skydomeProgram = this.createProgram(this.getSkydomeVS(), this.getSkydomeFS());
  }
  
  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader error:', this.gl.getShaderInfoLog(shader));
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
      console.error('Program error:', this.gl.getProgramInfoLog(program));
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
      discard;  // Crea un agujero transparente
    }
    
    if(tileIndex == 0u) {
      outColor = vec4(0.3, 0.3, 0.3, 1.0);
      return;
    }
    
    float tx = fract(worldX);
    float ty = fract(worldY);
    
    float spriteWidth = 1.0 / u_spriteCount;
    vec2 texCoord = vec2(tx * spriteWidth, ty);
    texCoord.x += float(tileIndex - 1u) * spriteWidth;
    
    vec4 baseColor = texture(u_spritesheet, texCoord);
    
    // Aplicar niebla
    if (u_fogEnabled) {
      float distance = perspective;
      float fogFactor = clamp((u_fogEnd - distance) / (u_fogEnd - u_fogStart), 0.0, 1.0);
      outColor = vec4(mix(u_fogColor, baseColor.rgb, fogFactor), baseColor.a);
    } else {
      outColor = baseColor;
    }
  }`;
}

  
getBillboardVS() {
  return `#version 300 es
  in vec2 a_offset;
  uniform vec2 u_screenPos;
  uniform float u_size;
  uniform float u_scale;
  out vec2 v_texCoord;
  void main() {
    vec2 pos = u_screenPos + vec2(a_offset.x, a_offset.y + 1.0) * u_size * u_scale;
    //vec2 pos = u_screenPos + vec2(a_offset.x, -(a_offset.y + 1.0)) * u_size * u_scale;
    gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
    v_texCoord = (a_offset + 1.0) * 0.5;
  }`;
}
  
  getBillboardFS() {
  return `#version 300 es
  precision highp float;
  in vec2 v_texCoord;
  out vec4 outColor;
  uniform sampler2D u_spritesheet;
  uniform int u_spriteIndex;
  uniform float u_spriteCount;
  uniform bool u_fogEnabled;
  uniform float u_fogStart;
  uniform float u_fogEnd;
  uniform vec3 u_fogColor;
  uniform float u_distance;
  
  void main() {
    vec2 uv = v_texCoord;
      uv.y = 1.0 - uv.y;  // ← AÑADIR ESTA LÍNEA
    uv.x /= u_spriteCount;
    uv.x += float(u_spriteIndex - 1) / u_spriteCount;
    vec4 color = texture(u_spritesheet, uv);
    if (color.a < 0.1) discard;
    
    // Aplicar niebla
    if (u_fogEnabled) {
      float fogFactor = clamp((u_fogEnd - u_distance) / (u_fogEnd - u_fogStart), 0.0, 1.0);
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
  
  void main() {
    vec3 instancePos = a_instanceData.xyz;
    float height = a_instanceData.w;
    
    vec3 scaledPos = a_position;
    scaledPos.y *= height;
    
    vec3 worldPos = scaledPos + instancePos;
    
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
  
  void main() {
    if (v_depth < 0.0) discard;
    
    float spriteWidth = 1.0 / u_spriteCount;
    vec2 uv = vec2(v_texCoord.x * spriteWidth, fract(v_texCoord.y));
    uv.x += float(u_spriteIndex - 1) * spriteWidth;
    
    vec4 color = texture(u_spritesheet, uv);
    if (color.a < 0.1) discard;
    
    vec3 finalColor = color.rgb;
    
    // Aplicar iluminación
    if (u_illumination) {
      float diffuseLight = max(dot(v_normal, u_lightDir), 0.0);
      float lighting = u_ambient + diffuseLight * u_diffuse;
      finalColor *= lighting;
    }
    
    // Aplicar niebla
    if (u_fogEnabled) {
      float fogFactor = clamp((u_fogEnd - v_depth) / (u_fogEnd - u_fogStart), 0.0, 1.0);
      finalColor = mix(u_fogColor, finalColor, fogFactor);
    }
    
    outColor = vec4(finalColor, color.a);
  }`;
}
  initBuffers() {
    // Buffer para el quad del suelo y cielo
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), this.gl.STATIC_DRAW);
    
    // Buffer para billboards
    this.billboardBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.billboardBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), this.gl.STATIC_DRAW);
    
    // Buffer para cubos
    this.cubeBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.getCubeVertices(), this.gl.STATIC_DRAW);
    
    // Buffer para instancias
    this.instanceBuffer = this.gl.createBuffer();
    
    // Buffer para cielo
    this.skyBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skyBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), this.gl.STATIC_DRAW);
    // buffer skydome
    this.skydomeBuffer = this.gl.createBuffer();
    this.skydomeIndexBuffer = this.gl.createBuffer();
    this.createSkydomeGeometry();

  
  }
  
  getCubeVertices() {
    return new Float32Array([
      // Cara frontal (Z+) - Normal: (0, 0, 1)
      -0.5, 0.0,  0.5,  0, 0,  0, 0, 1,
       0.5, 0.0,  0.5,  1, 0,  0, 0, 1,
       0.5, 1.0,  0.5,  1, 1,  0, 0, 1,
      -0.5, 0.0,  0.5,  0, 0,  0, 0, 1,
       0.5, 1.0,  0.5,  1, 1,  0, 0, 1,
      -0.5, 1.0,  0.5,  0, 1,  0, 0, 1,
      
      // Cara trasera (Z-) - Normal: (0, 0, -1)
       0.5, 0.0, -0.5,  1, 0,  0, 0, -1,
      -0.5, 0.0, -0.5,  0, 0,  0, 0, -1,
      -0.5, 1.0, -0.5,  0, 1,  0, 0, -1,
       0.5, 0.0, -0.5,  1, 0,  0, 0, -1,
      -0.5, 1.0, -0.5,  0, 1,  0, 0, -1,
       0.5, 1.0, -0.5,  1, 1,  0, 0, -1,
      
      // Cara izquierda (X-) - Normal: (-1, 0, 0)
      -0.5, 0.0, -0.5,  0, 0,  -1, 0, 0,
      -0.5, 0.0,  0.5,  1, 0,  -1, 0, 0,
      -0.5, 1.0,  0.5,  1, 1,  -1, 0, 0,
      -0.5, 0.0, -0.5,  0, 0,  -1, 0, 0,
      -0.5, 1.0,  0.5,  1, 1,  -1, 0, 0,
      -0.5, 1.0, -0.5,  0, 1,  -1, 0, 0,
      
      // Cara derecha (X+) - Normal: (1, 0, 0)
       0.5, 0.0,  0.5,  0, 0,  1, 0, 0,
       0.5, 0.0, -0.5,  1, 0,  1, 0, 0,
       0.5, 1.0, -0.5,  1, 1,  1, 0, 0,
       0.5, 0.0,  0.5,  0, 0,  1, 0, 0,
       0.5, 1.0, -0.5,  1, 1,  1, 0, 0,
       0.5, 1.0,  0.5,  0, 1,  1, 0, 0,
      
      // Cara superior (Y+) - Normal: (0, 1, 0)
      -0.5, 1.0,  0.5,  0, 0,  0, 1, 0,
       0.5, 1.0,  0.5,  1, 0,  0, 1, 0,
       0.5, 1.0, -0.5,  1, 1,  0, 1, 0,
      -0.5, 1.0,  0.5,  0, 0,  0, 1, 0,
       0.5, 1.0, -0.5,  1, 1,  0, 1, 0,
      -0.5, 1.0, -0.5,  0, 1,  0, 1, 0,
      
      // Cara inferior (Y-) - Normal: (0, -1, 0)
      -0.5, 0.0, -0.5,  0, 0,  0, -1, 0,
       0.5, 0.0, -0.5,  1, 0,  0, -1, 0,
       0.5, 0.0,  0.5,  1, 1,  0, -1, 0,
      -0.5, 0.0, -0.5,  0, 0,  0, -1, 0,
       0.5, 0.0,  0.5,  1, 1,  0, -1, 0,
      -0.5, 0.0,  0.5,  0, 1,  0, -1, 0
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
  this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
  
  this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.skydomeIndexBuffer);
  this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
}
  
  initUniforms() {
      this.uniformLocations = {
    skydome: {
      viewMatrix: this.gl.getUniformLocation(this.skydomeProgram, 'u_viewMatrix'),
      projMatrix: this.gl.getUniformLocation(this.skydomeProgram, 'u_projMatrix'),
      skydomeTexture: this.gl.getUniformLocation(this.skydomeProgram, 'u_skydomeTexture')
    },
    ground: {
      spriteCount: this.gl.getUniformLocation(this.program, 'u_spriteCount'),
      camera: this.gl.getUniformLocation(this.program, 'u_camera'),
      tileMapTexture: this.gl.getUniformLocation(this.program, 'u_tileMapTexture'),
      spritesheet: this.gl.getUniformLocation(this.program, 'u_spritesheet'),
      fogEnabled: this.gl.getUniformLocation(this.program, 'u_fogEnabled'),
      fogStart: this.gl.getUniformLocation(this.program, 'u_fogStart'),
      fogEnd: this.gl.getUniformLocation(this.program, 'u_fogEnd'),
      fogColor: this.gl.getUniformLocation(this.program, 'u_fogColor')
    },
    billboard: {
      screenPos: this.gl.getUniformLocation(this.billboardProgram, 'u_screenPos'),
      size: this.gl.getUniformLocation(this.billboardProgram, 'u_size'),
        scale: this.gl.getUniformLocation(this.billboardProgram, 'u_scale'),
      spriteIndex: this.gl.getUniformLocation(this.billboardProgram, 'u_spriteIndex'),
      spriteCount: this.gl.getUniformLocation(this.billboardProgram, 'u_spriteCount'),
      spritesheet: this.gl.getUniformLocation(this.billboardProgram, 'u_spritesheet'),
      fogEnabled: this.gl.getUniformLocation(this.billboardProgram, 'u_fogEnabled'),
      fogStart: this.gl.getUniformLocation(this.billboardProgram, 'u_fogStart'),
      fogEnd: this.gl.getUniformLocation(this.billboardProgram, 'u_fogEnd'),
      fogColor: this.gl.getUniformLocation(this.billboardProgram, 'u_fogColor'),
      distance: this.gl.getUniformLocation(this.billboardProgram, 'u_distance')
    },
    block: {
      camera: this.gl.getUniformLocation(this.blockProgram, 'u_camera'),
      resolution: this.gl.getUniformLocation(this.blockProgram, 'u_resolution'),
      spriteIndex: this.gl.getUniformLocation(this.blockProgram, 'u_spriteIndex'),
      spriteCount: this.gl.getUniformLocation(this.blockProgram, 'u_spriteCount'),
      spritesheet: this.gl.getUniformLocation(this.blockProgram, 'u_spritesheet'),
      lightDir: this.gl.getUniformLocation(this.blockProgram, 'u_lightDir'),
      illumination: this.gl.getUniformLocation(this.blockProgram, 'u_illumination'),
      ambient: this.gl.getUniformLocation(this.blockProgram, 'u_ambient'),
      diffuse: this.gl.getUniformLocation(this.blockProgram, 'u_diffuse'),
      fogEnabled: this.gl.getUniformLocation(this.blockProgram, 'u_fogEnabled'),
      fogStart: this.gl.getUniformLocation(this.blockProgram, 'u_fogStart'),
      fogEnd: this.gl.getUniformLocation(this.blockProgram, 'u_fogEnd'),
      fogColor: this.gl.getUniformLocation(this.blockProgram, 'u_fogColor')
    },
    sky: {
      color1: this.gl.getUniformLocation(this.skyProgram, 'u_color1'),
      color2: this.gl.getUniformLocation(this.skyProgram, 'u_color2')
    }
  };
    
    this.attribLocations = {
      skydome: {
        position: this.gl.getAttribLocation(this.skydomeProgram, 'a_position')
      },

      ground: {
        position: this.gl.getAttribLocation(this.program, 'a_position')
      },
      billboard: {
        offset: this.gl.getAttribLocation(this.billboardProgram, 'a_offset')
      },
      block: {
        position: this.gl.getAttribLocation(this.blockProgram, 'a_position'),
        texCoord: this.gl.getAttribLocation(this.blockProgram, 'a_texCoord'),
        normal: this.gl.getAttribLocation(this.blockProgram, 'a_normal'),
        instanceData: this.gl.getAttribLocation(this.blockProgram, 'a_instanceData')
      },
      sky: {
        position: this.gl.getAttribLocation(this.skyProgram, 'a_position')
      }
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
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        
        resolve();
      };
      
      image.onerror = () => reject(new Error('Error al cargar spritesheet'));
      image.src = imageSource;
    });
  }
  loadSkydomeTexture(imageSource) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    
    image.onload = () => {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.skydomeTexture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
      resolve();
    };
    
    image.onerror = () => reject(new Error('Error al cargar textura del skydome'));
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
  const heightMapValue = this.heightMap ? (this.heightMap[i] || 0.0) : 0.0;
  
  // Si es un billboard, poner el tile de suelo correspondiente
  if (this.isBillboard(tile)) {
    // Si hay altura, no renderizar suelo (se renderiza como bloque)
    if (heightMapValue > 0) {
      data[i] = 0; // Transparente
    } else {
      data[i] = this.billboard_ground_tiles[tile] || this.DEFAULT_BILLBOARD_GROUND;
    }
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
  this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.R8UI, this.MAP_WIDTH, this.MAP_HEIGHT, 0, this.gl.RED_INTEGER, this.gl.UNSIGNED_BYTE, data);
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
  
  isInFrustum(worldX, worldY, camera) {
    const dx = worldX - camera.x;
    const dy = worldY - camera.y;
    const rotY = dx * this.cachedSinA + dy * this.cachedCosA;
    if (rotY < 0.1 || rotY > this.MAX_RENDER_DISTANCE) return false;
    const rotX = dx * this.cachedCosA - dy * this.cachedSinA;
    const screenX = 0.5 + rotX / rotY;
    return screenX >= -this.FRUSTUM_MARGIN && screenX <= (1.0 + this.FRUSTUM_MARGIN);
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
      visible: rotY > -3 && screenX >= -3 && screenX <= 1 && screenY >= -3 && screenY <= 1,
      x: screenX,
      y: screenY,
      size: invRotY
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
      visible: rotY > 0.01 && screenX >= 0 && screenX <= 1 && screenY >= -3 && screenY <= 1,
      x: screenX,
      y: screenY,
      size: invRotY
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

getRotatedBillboardSprite(baseTile, cameraAngle, billboardX, billboardY, fixedOrientation = null) {
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
  const quadrant = Math.floor((relativeAngle + Math.PI / 4) / (Math.PI / 2)) % 4;
  
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
  
  // Recolectar objetos renderizables
  collectRenderableObjects(camera, independentObjects = []) {
  this.objectCount = 0;
  const camX = camera.x;
  const camY = camera.y;
  
  // Objetos del tilemap
  if (this.tileMap) {
    for (let i = 0; i < this.tileMap.length; i++) {
      const tile = this.tileMap[i];
      if (tile === 0) continue;
      
      const mapX = i % this.MAP_WIDTH;
      const mapY = Math.floor(i / this.MAP_WIDTH);
      const worldX = mapX + 0.5;
      const worldY = mapY + 0.5;
      
      if (!this.isInFrustum(worldX, worldY, camera)) continue;
      
      const dx = worldX - camX;
      const dy = worldY - camY;
      const distSq = dx * dx + dy * dy;
      
      // Obtener altura del heightMap
      const heightMapValue = this.heightMap ? (this.heightMap[i] || 0.0) : 0.0;
      
      if (this.isBillboard(tile)) {
        // Obtener elevación del suelo
        const groundElevation = heightMapValue;
        
        // Calcular altura del bloque base si existe
        const groundTile = this.billboard_ground_tiles[tile] || this.DEFAULT_BILLBOARD_GROUND;
        const blockHeight = this.isBlock(groundTile) ? (this.tile_heights[groundTile] || 0.0) : 0.0;
        
        // Altura total = elevación del suelo + altura del bloque base
        const totalHeight = groundElevation + blockHeight;
        
        // Si hay elevación del suelo, crear bloque base
        if (groundElevation > 0) {
          this.tempObjects[this.objectCount++] = {
            type: 'block',
            x: worldX,
            y: 0.0,
            z: worldY,
            tile: groundTile,
            dist: distSq,
            customHeight: groundElevation
          };
        }
        
        // Renderizar billboard encima
        const proj = this.projectToScreenWithHeight(worldX, worldY, totalHeight, camera);
        if (proj.visible) {
          let finalTile = tile;
          if (this.isRotatableBillboard(tile)) {
            finalTile = this.getRotatedBillboardSprite(tile, camera.angle, worldX, worldY, null);
          }
          
          const scale = this.billboard_scales[tile] || 1.0;
          
          this.tempObjects[this.objectCount++] = {
            type: 'billboard',
            x: worldX,
            y: worldY,
            tile: finalTile,
            dist: distSq,
            proj,
            scale: scale
          };
        }
        
      } else if (this.isBlock(tile)) {
        // Bloque normal: usar heightMap si existe y es > 0, sino usar tile_heights
        const customHeight = (heightMapValue > 0) ? heightMapValue : null;
        
        this.tempObjects[this.objectCount++] = {
          type: 'block',
          x: worldX,
          y: 0.0,
          z: worldY,
          tile,
          dist: distSq,
          customHeight: customHeight
        };
        
      } else {
        // Tile de suelo - si tiene altura en heightMap, convertirlo en bloque
        if (heightMapValue > 0) {
          this.tempObjects[this.objectCount++] = {
            type: 'block',
            x: worldX,
            y: 0.0,
            z: worldY,
            tile: tile,
            dist: distSq,
            customHeight: heightMapValue
          };
        }
      }
    }
  }
  
  // Objetos independientes
  for (const obj of independentObjects) {
    const worldX = obj.x;
    const worldY = obj.y;
    const height = obj.z;
    
    if (!this.isInFrustum(worldX, worldY, camera)) continue;
    
    const dx = worldX - camX;
    const dy = worldY - camY;
    const distSq = dx * dx + dy * dy;
    
    if (this.isBillboard(obj.tile)) {
      const proj = this.projectToScreenWithHeight(worldX, worldY, height, camera);
      if (proj.visible) {
        // Calcular sprite rotado si aplica
        let finalTile = obj.tile;
        if (this.isRotatableBillboard(obj.tile)) {
          const fixedAngle = obj.orientation !== undefined ? obj.orientation : null;
          finalTile = this.getRotatedBillboardSprite(obj.tile, camera.angle, worldX, worldY, fixedAngle);
        }
        
        // Obtener escala (del objeto, global por tile, o 1.0 por defecto)
        const scale = obj.scale !== undefined ? obj.scale : (this.billboard_scales[obj.tile] || 1.0);
        
        this.tempObjects[this.objectCount++] = {
          type: 'billboard',
          x: worldX,
          y: worldY,
          tile: finalTile,
          dist: distSq,
          proj,
          scale: scale
        };
      }
    } else if (this.isBlock(obj.tile)) {
      this.tempObjects[this.objectCount++] = {
        type: 'block',
        x: worldX,
        y: height,
        z: worldY,
        tile: obj.tile,
        dist: distSq
      };
    }
  }
  
  const objects = this.tempObjects.slice(0, this.objectCount);
  objects.sort((a, b) => b.dist - a.dist);
  return objects;
}
  
  // Renderizar cielo
  renderSky() {
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);
    this.gl.useProgram(this.skyProgram);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skyBuffer);
    this.gl.enableVertexAttribArray(this.attribLocations.sky.position);
    this.gl.vertexAttribPointer(this.attribLocations.sky.position, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.uniform3f(this.uniformLocations.sky.color1, this.color1[0], this.color1[1], this.color1[2]);
    this.gl.uniform3f(this.uniformLocations.sky.color2, this.color2[0], this.color2[1], this.color2[2]);
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
  
  this.gl.uniformMatrix4fv(this.uniformLocations.skydome.viewMatrix, false, viewMatrix);
  this.gl.uniformMatrix4fv(this.uniformLocations.skydome.projMatrix, false, projMatrix);
  
  // Textura
  this.gl.activeTexture(this.gl.TEXTURE0);
  this.gl.bindTexture(this.gl.TEXTURE_2D, this.skydomeTexture);
  this.gl.uniform1i(this.uniformLocations.skydome.skydomeTexture, 0);
  
  // Geometría
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skydomeBuffer);
  this.gl.enableVertexAttribArray(this.attribLocations.skydome.position);
  this.gl.vertexAttribPointer(this.attribLocations.skydome.position, 3, this.gl.FLOAT, false, 0, 0);
  
  this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.skydomeIndexBuffer);
  this.gl.drawElements(this.gl.TRIANGLES, this.skydomeVertexCount, this.gl.UNSIGNED_SHORT, 0);
}
createViewMatrix(camera) {
  const mat = new Float32Array(16);
  const cosA = Math.cos(camera.angle);
  const sinA = Math.sin(camera.angle);
  
  // Rotación Y + Traslación (la cámara está en el centro del skydome)
  mat[0] = cosA; mat[1] = 0; mat[2] = sinA; mat[3] = 0;
  mat[4] = 0; mat[5] = 1; mat[6] = 0; mat[7] = 0;
  mat[8] = -sinA; mat[9] = 0; mat[10] = cosA; mat[11] = 0;
  mat[12] = 0; mat[13] = -camera.z; mat[14] = 0; mat[15] = 1;
  
  return mat;
}

createProjectionMatrix() {
  const mat = new Float32Array(16);
  const fov = 60 * Math.PI / 180;
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
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    
    this.gl.useProgram(this.program);
    this.gl.enableVertexAttribArray(this.attribLocations.ground.position);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.attribLocations.ground.position, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.uniform1f(this.uniformLocations.ground.spriteCount, this.tile_items_size);
    this.gl.uniform4f(this.uniformLocations.ground.camera, camera.x, camera.y, camera.z, camera.angle);
    
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteTexture);
    this.gl.uniform1i(this.uniformLocations.ground.spritesheet, 0);
    
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tileMapTexture);
    this.gl.uniform1i(this.uniformLocations.ground.tileMapTexture, 1);

      // niebla
    this.gl.uniform1i(this.uniformLocations.ground.fogEnabled, this.FOG_ENABLED);
    this.gl.uniform1f(this.uniformLocations.ground.fogStart, this.FOG_START);
    this.gl.uniform1f(this.uniformLocations.ground.fogEnd, this.FOG_END);
    this.gl.uniform3f(this.uniformLocations.ground.fogColor, 
    this.FOG_COLOR[0], this.FOG_COLOR[1], this.FOG_COLOR[2]);

    
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
  
  // Renderizar billboard
  drawBillboard(billboard) {
    this.gl.useProgram(this.billboardProgram);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.billboardBuffer);
    this.gl.enableVertexAttribArray(this.attribLocations.billboard.offset);
    this.gl.vertexAttribPointer(this.attribLocations.billboard.offset, 2, this.gl.FLOAT, false, 0, 0);
    
    this.gl.uniform2f(this.uniformLocations.billboard.screenPos, billboard.proj.x, billboard.proj.y);
    this.gl.uniform1f(this.uniformLocations.billboard.size, billboard.proj.size);
   this.gl.uniform1f(this.uniformLocations.billboard.scale, billboard.scale || 1.0);
    this.gl.uniform1i(this.uniformLocations.billboard.spriteIndex, billboard.tile);
    this.gl.uniform1f(this.uniformLocations.billboard.spriteCount, this.tile_items_size);
    //niebla
      // Calcular distancia del billboard
    const dx = billboard.x - this.lastCamera.x;
    const dy = billboard.y - this.lastCamera.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Añadir uniforms de niebla
    this.gl.uniform1i(this.uniformLocations.billboard.fogEnabled, this.FOG_ENABLED);
    this.gl.uniform1f(this.uniformLocations.billboard.fogStart, this.FOG_START);
    this.gl.uniform1f(this.uniformLocations.billboard.fogEnd, this.FOG_END);
    this.gl.uniform3f(this.uniformLocations.billboard.fogColor, 
      this.FOG_COLOR[0], this.FOG_COLOR[1], this.FOG_COLOR[2]);
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
    const height = instances[i].customHeight !== undefined && instances[i].customHeight !== null 
      ? instances[i].customHeight 
      : defaultHeight;
    
    instanceData[i * 4 + 0] = instances[i].x;
    instanceData[i * 4 + 1] = instances[i].y;
    instanceData[i * 4 + 2] = instances[i].z;
    instanceData[i * 4 + 3] = height;
  }
  
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, instanceData, this.gl.DYNAMIC_DRAW);
  
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeBuffer);
  
  this.gl.enableVertexAttribArray(this.attribLocations.block.position);
  this.gl.vertexAttribPointer(this.attribLocations.block.position, 3, this.gl.FLOAT, false, 32, 0);
  
  this.gl.enableVertexAttribArray(this.attribLocations.block.texCoord);
  this.gl.vertexAttribPointer(this.attribLocations.block.texCoord, 2, this.gl.FLOAT, false, 32, 12);
  
  this.gl.enableVertexAttribArray(this.attribLocations.block.normal);
  this.gl.vertexAttribPointer(this.attribLocations.block.normal, 3, this.gl.FLOAT, false, 32, 20);
  
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
  this.gl.enableVertexAttribArray(this.attribLocations.block.instanceData);
  this.gl.vertexAttribPointer(this.attribLocations.block.instanceData, 4, this.gl.FLOAT, false, 16, 0);
  this.gl.vertexAttribDivisor(this.attribLocations.block.instanceData, 1);
  
  this.gl.uniform4f(this.uniformLocations.block.camera, camera.x, camera.y, camera.z, camera.angle);
  this.gl.uniform2f(this.uniformLocations.block.resolution, this.canvas.width, this.canvas.height);
  this.gl.uniform1i(this.uniformLocations.block.spriteIndex, tileType);
  this.gl.uniform1f(this.uniformLocations.block.spriteCount, this.tile_items_size);
  
  this.gl.uniform1i(this.uniformLocations.block.illumination, this.ILLUMINATION);
  this.gl.uniform1f(this.uniformLocations.block.ambient, this.AMBIENT_LIGHT);
  this.gl.uniform1f(this.uniformLocations.block.diffuse, this.LIGHT_DIFFUSE);
  
  const len = Math.sqrt(this.lightDir[0]*this.lightDir[0] + this.lightDir[1]*this.lightDir[1] + this.lightDir[2]*this.lightDir[2]);
  this.gl.uniform3f(this.uniformLocations.block.lightDir, this.lightDir[0]/len, this.lightDir[1]/len, this.lightDir[2]/len);
  
  this.gl.activeTexture(this.gl.TEXTURE0);
  this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteTexture);
  this.gl.uniform1i(this.uniformLocations.block.spritesheet, 0);
  
  // Añadir uniforms de niebla antes del drawArraysInstanced:
  this.gl.uniform1i(this.uniformLocations.block.fogEnabled, this.FOG_ENABLED);
  this.gl.uniform1f(this.uniformLocations.block.fogStart, this.FOG_START);
  this.gl.uniform1f(this.uniformLocations.block.fogEnd, this.FOG_END);
  this.gl.uniform3f(this.uniformLocations.block.fogColor, 
    this.FOG_COLOR[0], this.FOG_COLOR[1], this.FOG_COLOR[2]);
  
  this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 36, instances.length);
  
  this.gl.vertexAttribDivisor(this.attribLocations.block.instanceData, 0);
}
  
  // Método principal de render
  render(independentObjects = [], renderSky = true) {
    let camera = this.camera;
    this.lastCamera = camera; //
    this.updateTrigCache(camera);
    
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    
    // Cielo
    if (renderSky) {
      this.renderSky();
    }
    if (this.SKYDOME_ENABLED) {
      this.renderSkydome(camera);
    }
    // Suelo
    this.renderGround(camera);
    
    // Clear depth buffer
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    
    // Recolectar objetos
    const allObjects = this.collectRenderableObjects(camera, independentObjects);
    
    // Configurar depth test para objetos 3D
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.depthMask(true);
    this.gl.disable(this.gl.BLEND);
    
    // Renderizar objetos
    let currentTile = null;
    let batchInstances = [];
    
    for (const obj of allObjects) {
      if (obj.type === 'block') {
        if (currentTile === null) {
          currentTile = obj.tile;
        }
        
        if (currentTile === obj.tile) {
          batchInstances.push(obj);
        } else {
          if (batchInstances.length > 0) {
            this.drawBlocksInstanced(currentTile, batchInstances, camera);
          }
          currentTile = obj.tile;
          batchInstances = [obj];
        }
      } else if (obj.type === 'billboard') {
        if (batchInstances.length > 0) {
          this.drawBlocksInstanced(currentTile, batchInstances, camera);
          batchInstances = [];
          currentTile = null;
        }
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthMask(false);
        
        this.drawBillboard(obj);
        
        this.gl.depthMask(true);
        this.gl.disable(this.gl.BLEND);
      }
    }
    
    // Renderizar batch final
    if (batchInstances.length > 0) {
      this.drawBlocksInstanced(currentTile, batchInstances, camera);
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
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
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

  transformNumber(n){
    return Number(n).toFixed(1);
  }


}