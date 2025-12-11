// ====== CONTROLES MÓVILES ======
const joystickArea = document.getElementById('joystick-area');
const joystickStick = document.getElementById('joystick-stick');
const btnJump = document.getElementById('btn-jump');
const btnCrouch = document.getElementById('btn-crouch');

let joystickActive = false;
let joystickStartX = 0;
let joystickStartY = 0;
let joystickX = 0;
let joystickY = 0;

// Joystick touch handlers
joystickArea.addEventListener('touchstart', (e) => {
  e.preventDefault();
  joystickActive = true;
  const touch = e.touches[0];
  const rect = joystickArea.getBoundingClientRect();
  joystickStartX = rect.left + rect.width / 2;
  joystickStartY = rect.top + rect.height / 2;
  updateJoystick(touch.clientX, touch.clientY);
});

joystickArea.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (joystickActive) {
    const touch = e.touches[0];
    updateJoystick(touch.clientX, touch.clientY);
  }
});

joystickArea.addEventListener('touchend', (e) => {
  e.preventDefault();
  joystickActive = false;
  joystickX = 0;
  joystickY = 0;
  joystickStick.style.left = '45px';
  joystickStick.style.top = '45px';
  // Resetear teclas de dirección
  keys['ArrowLeft'] = false;
  keys['ArrowRight'] = false;
  keys['ArrowUp'] = false;
  keys['ArrowDown'] = false;
});

function updateJoystick(touchX, touchY) {
  const deltaX = touchX - joystickStartX;
  const deltaY = touchY - joystickStartY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const maxDistance = 45; // Radio máximo del joystick
  
  // Limitar la distancia
  const limitedDistance = Math.min(distance, maxDistance);
  const angle = Math.atan2(deltaY, deltaX);
  
  joystickX = Math.cos(angle) * limitedDistance / maxDistance;
  joystickY = Math.sin(angle) * limitedDistance / maxDistance;
  
  // Mover el stick visualmente
  const stickX = 45 + Math.cos(angle) * limitedDistance;
  const stickY = 45 + Math.sin(angle) * limitedDistance;
  joystickStick.style.left = stickX + 'px';
  joystickStick.style.top = stickY + 'px';
  
  // Simular teclas de dirección
  const threshold = 0.3;
  keys['ArrowLeft'] = joystickX < -threshold;
  keys['ArrowRight'] = joystickX > threshold;
  keys['ArrowUp'] = joystickY < -threshold;
  keys['ArrowDown'] = joystickY > threshold;
}

// Botón de salto
btnJump.addEventListener('touchstart', (e) => {
  e.preventDefault();
  keys['w'] = true;
  keys['W'] = true;
});

btnJump.addEventListener('touchend', (e) => {
  e.preventDefault();
  keys['w'] = false;
  keys['W'] = false;
});

// Botón de agacharse
btnCrouch.addEventListener('touchstart', (e) => {
  e.preventDefault();
  keys['s'] = true;
  keys['S'] = true;
});

btnCrouch.addEventListener('touchend', (e) => {
  e.preventDefault();
  keys['s'] = false;
  keys['S'] = false;
});

// Prevenir zoom en dispositivos móviles
document.addEventListener('touchmove', (e) => {
  if (e.scale !== 1) {
    e.preventDefault();
  }
}, { passive: false });
