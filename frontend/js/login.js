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

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || 'Error al iniciar sesión');
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
      console.error(err);
      alert('Error al iniciar sesión');
    }
  });
}
