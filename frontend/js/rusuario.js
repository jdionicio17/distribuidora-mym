// Toggle sidebar + año footer
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const yearSpan = document.getElementById('year');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar-open');
        });
    }

    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // ============================
    // LÓGICA DE REGISTRO + LISTADO
    // ============================
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.querySelector('.user-form');
        const tbody = document.getElementById('usuarios-tbody');

        // Cargar usuarios en la tabla
        async function cargarUsuarios() {
            try {
                const res = await fetch(`${API_BASE}/api/usuarios`);
                if (!res.ok) throw new Error('Error al obtener usuarios');

                const usuarios = await res.json();

                tbody.innerHTML = '';

                if (usuarios.length === 0) {
                    const tr = document.createElement('tr');
                    const td = document.createElement('td');
                    td.colSpan = 6;
                    td.textContent = 'Sin usuarios registrados aún.';
                    td.classList.add('empty-row');
                    tr.appendChild(td);
                    tbody.appendChild(tr);
                    return;
                }

                usuarios.forEach(u => {
                    const tr = document.createElement('tr');

                    // Usuario
                    const tdUsuario = document.createElement('td');
                    tdUsuario.textContent = u.usuario;
                    tr.appendChild(tdUsuario);

                    // Nombre completo
                    const tdNombre = document.createElement('td');
                    tdNombre.textContent = u.nombre_completo;
                    tr.appendChild(tdNombre);

                    // Rol
                    const tdRol = document.createElement('td');
                    tdRol.textContent = formatearRol(u.rol);
                    tr.appendChild(tdRol);

                    // Estado
                    const tdEstado = document.createElement('td');
                    const spanEstado = document.createElement('span');
                    spanEstado.classList.add('badge');
                    if (u.estado === 'activo') {
                        spanEstado.classList.add('badge-success');
                        spanEstado.textContent = 'Activo';
                    } else {
                        spanEstado.classList.add('badge-danger');
                        spanEstado.textContent = 'Inactivo';
                    }
                    tdEstado.appendChild(spanEstado);
                    tr.appendChild(tdEstado);

                    // Último acceso
                    const tdAcceso = document.createElement('td');
                    if (u.ultimo_acceso) {
                        const fecha = new Date(u.ultimo_acceso);
                        const dia = String(fecha.getDate()).padStart(2, '0');
                        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                        const anio = fecha.getFullYear();
                        const hora = String(fecha.getHours()).padStart(2, '0');
                        const min = String(fecha.getMinutes()).padStart(2, '0');
                        tdAcceso.textContent = `${dia}/${mes}/${anio} ${hora}:${min}`;
                    } else {
                        tdAcceso.textContent = '--/--/----';
                    }
                    tr.appendChild(tdAcceso);

                    // Acciones (por ahora sólo botones vacíos)
                    const tdAcciones = document.createElement('td');
                    tdAcciones.classList.add('tabla-acciones');

                    const btnEditar = document.createElement('button');
                    btnEditar.type = 'button';
                    btnEditar.className = 'btn-icon';
                    btnEditar.title = 'Editar';
                    btnEditar.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
                    // aquí luego le añadimos lógica de edición
                    tdAcciones.appendChild(btnEditar);

                    const btnEliminar = document.createElement('button');
                    btnEliminar.type = 'button';
                    btnEliminar.className = 'btn-icon btn-icon-danger';
                    btnEliminar.title = 'Eliminar';
                    btnEliminar.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
                    // aquí luego le añadimos lógica de eliminación
                    tdAcciones.appendChild(btnEliminar);

                    tr.appendChild(tdAcciones);

                    tbody.appendChild(tr);
                });

            } catch (err) {
                console.error(err);
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-row">Error al cargar usuarios.</td>
                    </tr>`;
            }
        }

        // Formatear rol para mostrar más bonito
        function formatearRol(rol) {
            switch (rol) {
                case 'admin': return 'Administrador';
                case 'ventas': return 'Ventas';
                case 'bodega': return 'Bodega / Inventario';
                case 'cobros': return 'Cobros / Créditos';
                default: return rol;
            }
        }

        // Manejo del submit del formulario
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const nombre_completo = document.getElementById('nombre_completo').value.trim();
                const usuario = document.getElementById('usuario').value.trim();
                const correo = document.getElementById('correo').value.trim();
                const rol = document.getElementById('rol').value;
                const password = document.getElementById('password').value;
                const password_confirm = document.getElementById('password_confirm').value;
                const estado = document.getElementById('estado').value;
                const debe_cambiar_password = document.getElementById('cambiar_password').checked;

                if (!nombre_completo || !usuario || !rol || !password || !password_confirm) {
                    alert('Por favor completa los campos obligatorios.');
                    return;
                }

                if (password !== password_confirm) {
                    alert('Las contraseñas no coinciden.');
                    return;
                }

                try {
                    const res = await fetch(`${API_BASE}/api/usuarios`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
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

                    const data = await res.json();

                    if (!res.ok) {
                        alert(data.message || 'Error al guardar el usuario.');
                        return;
                    }

                    alert('Usuario registrado correctamente.');
                    form.reset();
                    // dejar estado en activo por defecto
                    const estadoSelect = document.getElementById('estado');
                    if (estadoSelect) estadoSelect.value = 'activo';

                    await cargarUsuarios();

                } catch (err) {
                    console.error(err);
                    alert('Error de comunicación con el servidor.');
                }
            });
        }

        // Cargar lista de usuarios al entrar a la página
        cargarUsuarios();
    });