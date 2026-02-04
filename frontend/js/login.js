// frontend/js/login.js

const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario  = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value;

    if (!usuario || !password) {
      alert('Por favor ingresa usuario y contraseña.');
      return;
    }

    // Deshabilitar botón para evitar doble click
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Iniciando sesión...';

    try {
      console.log('🔗 Intentando conectar a:', window.API_BASE); // ✅ Agregado window.
      
      const res = await fetch(`${window.API_BASE}/api/auth/login`, { // ✅ Agregado window.
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario, password })
      });

      console.log('📡 Status de respuesta:', res.status);
      
      const data = await res.json().catch(() => ({}));
      console.log('📦 Datos recibidos:', data);

      if (!res.ok) {
        alert(data.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        return;
      }

      const usuarioLog = data.usuario || {};
      const rol = usuarioLog.rol;

      // Guardar usuario en localStorage
      localStorage.setItem('usuarioMyM', JSON.stringify({
        id_usuario: usuarioLog.id_usuario,
        usuario: usuarioLog.usuario,
        nombre_completo: usuarioLog.nombre_completo,
        rol: usuarioLog.rol
      }));

      console.log('✅ Login exitoso, redirigiendo a:', rol);

      // Redirección según rol
      if (rol === 'admin') {
        window.location.href = 'adminv.html';
      } else if (rol === 'ventas') {
        window.location.href = 'vendedorv.html';
      } else if (rol === 'bodega') {
        window.location.href = 'bodegav.html';
      } else if (rol === 'cobros') {
        window.location.href = 'cobrosv.html';
      } else {
        alert('Rol no reconocido: ' + rol);
      }

    } catch (err) {
      console.error('❌ Error completo:', err);
      alert('Error al conectar con el servidor. Verifica tu conexión a internet.');
    } finally {
      // Rehabilitar botón
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}