document.addEventListener('DOMContentLoaded', () => {
    // ==================================================
    // ELEMENTOS GENERALES
    // ==================================================
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const yearSpan = document.getElementById('year');

    const form = document.querySelector('.user-form');
    const tbody = document.getElementById('usuarios-tbody');

    // API_BASE debe encontrarse en config.js
    // Si API_BASE no existe, utiliza la misma dirección del frontend
    const BASE_URL =
        typeof API_BASE !== 'undefined'
            ? String(API_BASE).replace(/\/+$/, '')
            : '';

    const USUARIOS_URL = `${BASE_URL}/api/usuarios`;

    // ==================================================
    // SIDEBAR
    // ==================================================
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar-open');
        });
    }

    // ==================================================
    // AÑO DEL FOOTER
    // ==================================================
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // ==================================================
    // FORMATEAR ROL
    // ==================================================
    function formatearRol(rol) {
        switch (rol) {
            case 'admin':
                return 'Administrador';

            case 'ventas':
                return 'Ventas';

            case 'bodega':
                return 'Bodega / Inventario';

            case 'cobros':
                return 'Cobros / Créditos';

            default:
                return rol || 'Sin rol';
        }
    }

    // ==================================================
    // FORMATEAR FECHA
    // ==================================================
    function formatearFecha(fechaValor) {
        if (!fechaValor) {
            return '--/--/----';
        }

        const fecha = new Date(fechaValor);

        if (Number.isNaN(fecha.getTime())) {
            return '--/--/----';
        }

        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        const hora = String(fecha.getHours()).padStart(2, '0');
        const minuto = String(fecha.getMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${anio} ${hora}:${minuto}`;
    }

    // ==================================================
    // LEER RESPUESTA JSON
    // ==================================================
    async function leerRespuesta(respuesta) {
        try {
            return await respuesta.json();
        } catch (error) {
            return {};
        }
    }

    // ==================================================
    // CARGAR USUARIOS
    // ==================================================
    async function cargarUsuarios() {
        if (!tbody) {
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-row">
                    Cargando usuarios...
                </td>
            </tr>
        `;

        try {
            const respuesta = await fetch(USUARIOS_URL, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            const usuarios = await leerRespuesta(respuesta);

            if (!respuesta.ok) {
                throw new Error(
                    usuarios.message ||
                    'Error al obtener los usuarios.'
                );
            }

            tbody.innerHTML = '';

            if (!Array.isArray(usuarios) || usuarios.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-row">
                            Sin usuarios registrados aún.
                        </td>
                    </tr>
                `;

                return;
            }

            usuarios.forEach((usuarioData) => {
                const fila = document.createElement('tr');

                // Usuario
                const tdUsuario = document.createElement('td');
                tdUsuario.textContent = usuarioData.usuario || '';
                fila.appendChild(tdUsuario);

                // Nombre completo
                const tdNombre = document.createElement('td');
                tdNombre.textContent =
                    usuarioData.nombre_completo || '';
                fila.appendChild(tdNombre);

                // Rol
                const tdRol = document.createElement('td');
                tdRol.textContent = formatearRol(usuarioData.rol);
                fila.appendChild(tdRol);

                // Estado
                const tdEstado = document.createElement('td');
                const spanEstado = document.createElement('span');

                spanEstado.classList.add('badge');

                if (usuarioData.estado === 'activo') {
                    spanEstado.classList.add('badge-success');
                    spanEstado.textContent = 'Activo';
                } else {
                    spanEstado.classList.add('badge-danger');
                    spanEstado.textContent = 'Inactivo';
                }

                tdEstado.appendChild(spanEstado);
                fila.appendChild(tdEstado);

                // Último acceso
                const tdAcceso = document.createElement('td');
                tdAcceso.textContent = formatearFecha(
                    usuarioData.ultimo_acceso
                );
                fila.appendChild(tdAcceso);

                // Acciones
                const tdAcciones = document.createElement('td');
                tdAcciones.classList.add('tabla-acciones');

                // Botón editar
                const btnEditar = document.createElement('button');
                btnEditar.type = 'button';
                btnEditar.className = 'btn-icon';
                btnEditar.title = 'Editar';
                btnEditar.setAttribute(
                    'aria-label',
                    `Editar usuario ${usuarioData.usuario}`
                );

                btnEditar.innerHTML = `
                    <i class="fa-solid fa-pen-to-square"></i>
                `;

                tdAcciones.appendChild(btnEditar);

                // Botón eliminar
                const btnEliminar = document.createElement('button');
                btnEliminar.type = 'button';
                btnEliminar.className =
                    'btn-icon btn-icon-danger';

                btnEliminar.title = 'Eliminar';
                btnEliminar.setAttribute(
                    'aria-label',
                    `Eliminar usuario ${usuarioData.usuario}`
                );

                btnEliminar.innerHTML = `
                    <i class="fa-solid fa-trash-can"></i>
                `;

                btnEliminar.addEventListener('click', async () => {
                    await eliminarUsuario(
                        usuarioData.id_usuario,
                        usuarioData.usuario,
                        btnEliminar
                    );
                });

                tdAcciones.appendChild(btnEliminar);

                fila.appendChild(tdAcciones);
                tbody.appendChild(fila);
            });

        } catch (error) {
            console.error('Error al cargar usuarios:', error);

            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-row">
                        ${error.message || 'Error al cargar usuarios.'}
                    </td>
                </tr>
            `;
        }
    }

    // ==================================================
    // ELIMINAR USUARIO
    // ==================================================
    async function eliminarUsuario(
        idUsuario,
        nombreUsuario,
        boton
    ) {
        if (!idUsuario) {
            alert('No se encontró el ID del usuario.');
            return;
        }

        const confirmar = window.confirm(
            `¿Estás seguro de eliminar al usuario "${nombreUsuario}"?\n\nEsta acción no se puede deshacer.`
        );

        if (!confirmar) {
            return;
        }

        boton.disabled = true;

        const contenidoOriginal = boton.innerHTML;

        boton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
        `;

        try {
            const respuesta = await fetch(
                `${USUARIOS_URL}/${encodeURIComponent(idUsuario)}`,
                {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

            const data = await leerRespuesta(respuesta);

            if (!respuesta.ok) {
                alert(
                    data.message ||
                    'No se pudo eliminar el usuario.'
                );

                return;
            }

            alert(
                data.message ||
                'Usuario eliminado correctamente.'
            );

            await cargarUsuarios();

        } catch (error) {
            console.error('Error al eliminar usuario:', error);

            alert(
                'No fue posible comunicarse con el servidor.'
            );

        } finally {
            boton.disabled = false;
            boton.innerHTML = contenidoOriginal;
        }
    }

    // ==================================================
    // REGISTRAR USUARIO
    // ==================================================
    if (form) {
        form.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const nombreCompletoInput =
                document.getElementById('nombre_completo');

            const usuarioInput =
                document.getElementById('usuario');

            const correoInput =
                document.getElementById('correo');

            const rolInput =
                document.getElementById('rol');

            const passwordInput =
                document.getElementById('password');

            const passwordConfirmInput =
                document.getElementById('password_confirm');

            const estadoInput =
                document.getElementById('estado');

            const cambiarPasswordInput =
                document.getElementById('cambiar_password');

            const nombre_completo =
                nombreCompletoInput.value.trim();

            const usuario =
                usuarioInput.value.trim();

            const correo =
                correoInput.value.trim();

            const rol =
                rolInput.value;

            const password =
                passwordInput.value;

            const password_confirm =
                passwordConfirmInput.value;

            const estado =
                estadoInput.value;

            const debe_cambiar_password =
                cambiarPasswordInput.checked;

            // Validar campos obligatorios
            if (
                !nombre_completo ||
                !usuario ||
                !rol ||
                !password ||
                !password_confirm
            ) {
                alert(
                    'Por favor completa los campos obligatorios.'
                );

                return;
            }

            // Validar contraseña
            if (password !== password_confirm) {
                alert('Las contraseñas no coinciden.');
                return;
            }

            if (password.length < 6) {
                alert(
                    'La contraseña debe tener al menos 6 caracteres.'
                );

                return;
            }

            const botonGuardar = form.querySelector(
                'button[type="submit"]'
            );

            if (botonGuardar) {
                botonGuardar.disabled = true;
            }

            try {
                const respuesta = await fetch(USUARIOS_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify({
                        nombre_completo,
                        usuario,
                        correo,
                        rol,
                        password,
                        password_confirm,
                        estado,
                        debe_cambiar_password
                    })
                });

                const data = await leerRespuesta(respuesta);

                if (!respuesta.ok) {
                    alert(
                        data.message ||
                        'Error al guardar el usuario.'
                    );

                    return;
                }

                alert(
                    data.message ||
                    'Usuario registrado correctamente.'
                );

                form.reset();

                // Estado activo por defecto
                if (estadoInput) {
                    estadoInput.value = 'activo';
                }

                await cargarUsuarios();

            } catch (error) {
                console.error(
                    'Error al registrar usuario:',
                    error
                );

                alert(
                    'Error de comunicación con el servidor.'
                );

            } finally {
                if (botonGuardar) {
                    botonGuardar.disabled = false;
                }
            }
        });
    }

    // Cargar usuarios al abrir la página
    cargarUsuarios();
});