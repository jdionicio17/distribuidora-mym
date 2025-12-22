// frontend/js/categoriasv.js

document.addEventListener('DOMContentLoaded', () => {
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

  // ========= LÓGICA FRONT (conectada al backend) =========

  const categoriaForm = document.getElementById('categoriaForm');
  const btnGuardarCat = document.getElementById('btnGuardarCategoria');
  const btnLimpiarCat = document.getElementById('btnLimpiarCategoria');

  const tablaCategoriasEl = document.getElementById('tablaCategorias');
  const tablaCategorias = tablaCategoriasEl ? tablaCategoriasEl.querySelector('tbody') : null;

  // ✅ Endpoints (NO redefinimos API_BASE)
  const CATEGORIAS_API = `${API_BASE}/api/categorias`;

  if (!categoriaForm || !btnGuardarCat || !btnLimpiarCat || !tablaCategorias) {
    console.warn('Faltan elementos del DOM para categorías. Revisa IDs en el HTML.');
    return;
  }

  // Cargar categorías desde backend
  async function cargarCategorias() {
    try {
      const res = await fetch(CATEGORIAS_API);
      if (!res.ok) throw new Error('Error al cargar categorías');
      const data = await res.json();

      tablaCategorias.innerHTML = '';

      if (!data || data.length === 0) {
        tablaCategorias.innerHTML = `
          <tr><td colspan="3" class="empty-row">Sin categorías registradas.</td></tr>
        `;
        return;
      }

      data.forEach(cat => {
        const tr = document.createElement('tr');
        tr.dataset.id = cat.id_categoria;
        tr.dataset.descripcion = cat.descripcion || '';

        tr.innerHTML = `
          <td>${cat.nombre_categoria}</td>
          <td>
            <span class="badge ${cat.estado === 'activa' ? 'badge-success' : 'badge-danger'}">
              ${cat.estado === 'activa' ? 'Activa' : 'Inactiva'}
            </span>
          </td>
          <td class="tabla-acciones">
            <button type="button" class="btn-icon btn-editar" title="Editar">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn-icon btn-icon-danger btn-eliminar" title="Eliminar">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        `;
        tablaCategorias.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      alert('Error al cargar las categorías.');
    }
  }

  // Guardar / actualizar categoría
  categoriaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id_categoria = document.getElementById('id_categoria').value;

    const payload = {
      nombre_categoria: document.getElementById('nombre_categoria').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim(),
      estado: document.getElementById('estado').value
    };

    if (!payload.nombre_categoria) {
      alert('El nombre de la categoría es obligatorio');
      return;
    }

    const esEditar = !!id_categoria;
    const url = esEditar ? `${CATEGORIAS_API}/${id_categoria}` : CATEGORIAS_API;
    const metodo = esEditar ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || 'Error al guardar la categoría');
        return;
      }

      await cargarCategorias();
      categoriaForm.reset();
      document.getElementById('id_categoria').value = '';
      btnGuardarCat.innerHTML = '<i class="fa-solid fa-tags"></i>&nbsp;Guardar categoría';
      alert('Categoría guardada correctamente.');
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error guardando la categoría.');
    }
  });

  // Limpiar formulario y volver a modo "guardar"
  btnLimpiarCat.addEventListener('click', () => {
    categoriaForm.reset();
    document.getElementById('id_categoria').value = '';
    btnGuardarCat.innerHTML = '<i class="fa-solid fa-tags"></i>&nbsp;Guardar categoría';
  });

  // Delegación de eventos para Editar / Eliminar
  tablaCategorias.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const fila = btn.closest('tr');
    if (!fila) return;

    const id = fila.dataset.id;

    // Editar
    if (btn.classList.contains('btn-editar')) {
      const celdas = fila.querySelectorAll('td');
      document.getElementById('id_categoria').value = id;
      document.getElementById('nombre_categoria').value = celdas[0].textContent.trim();

      const badgeText = fila.querySelector('.badge').textContent.trim().toLowerCase();
      document.getElementById('estado').value = badgeText === 'activa' ? 'activa' : 'inactiva';

      document.getElementById('descripcion').value = fila.dataset.descripcion || '';
      btnGuardarCat.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>&nbsp;Actualizar categoría';
    }

    // Eliminar
    if (btn.classList.contains('btn-eliminar')) {
      const nombre = fila.querySelector('td').textContent.trim();
      const confirmar = confirm(`¿Seguro que deseas eliminar la categoría "${nombre}"?`);
      if (!confirmar) return;

      try {
        const res = await fetch(`${CATEGORIAS_API}/${id}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          alert(data.message || 'Error al eliminar la categoría');
          return;
        }

        await cargarCategorias();
      } catch (err) {
        console.error(err);
        alert('Ocurrió un error eliminando la categoría.');
      }
    }
  });

  // Cargar categorías al entrar
  cargarCategorias();
});
