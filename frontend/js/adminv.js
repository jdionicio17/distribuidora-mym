// frontend/js/adminv.js

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar + año
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const yearSpan = document.getElementById('year');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('sidebar-open'));
  }
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // ✅ FUNCIÓN MEJORADA PARA FORMATEAR FECHA/HORA
  function formatDateTime(v) {
    if (!v) return '—';

    // MySQL devuelve formato: 'YYYY-MM-DD HH:mm:ss'
    // Reemplazamos el espacio con 'T' para que JavaScript lo parsee correctamente
    const dateStr = String(v).replace(' ', 'T');
    const d = new Date(dateStr);

    if (isNaN(d.getTime())) {
      // Si falla el parseo, intentamos mostrar solo la fecha
      return String(v).slice(0, 10);
    }

    // Formato personalizado: DD/MM/YYYY, HH:mm AM/PM
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const año = d.getFullYear();

    let hora = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = hora >= 12 ? 'p. m.' : 'a. m.';

    hora = hora % 12;
    if (hora === 0) hora = 12;

    return `${dia}/${mes}/${año}, ${hora}:${min} ${ampm}`;
  }

  // Helpers
  const fmtQ = (n) => 'Q ' + (Number(n) || 0).toFixed(2);

  async function cargarDashboard() {
    try {
      // ✅ CAMBIO CLAVE: usar API_BASE
      const res = await fetch(`${API_BASE}/api/admin/dashboard`);

      if (!res.ok) throw new Error('No se pudo cargar dashboard');
      const data = await res.json();

      // KPIs
      document.getElementById('kpiVentasHoy').textContent = fmtQ(data.kpis?.ventas_hoy);
      document.getElementById('kpiVentasMes').textContent = fmtQ(data.kpis?.ventas_mes);
      document.getElementById('kpiGananciaMes').textContent = fmtQ(data.kpis?.ganancia_estimada_mes);
      document.getElementById('kpiCreditosActivos').textContent = String(data.kpis?.creditos_activos || 0);

      // Últimas ventas
      const tv = document.getElementById('tbodyUltimasVentas');
      const ventas = data.tablas?.ultimas_ventas || [];
      tv.innerHTML = ventas.length ? ventas.map(v => `
        <tr>
          <td>${formatDateTime(v.fecha_venta)}</td>
          <td>${v.nombre_cliente || '—'}</td>
          <td>${fmtQ(v.total_neto)}</td>
          <td>${(v.tipo_venta === 'credito') ? 'Crédito' : 'Contado'}</td>
        </tr>
      `).join('') : `<tr><td colspan="4" class="empty-row">Sin registros todavía.</td></tr>`;

      // Últimas compras
      const tc = document.getElementById('tbodyUltimasCompras');
      const compras = data.tablas?.ultimas_compras || [];
      tc.innerHTML = compras.length ? compras.map(c => `
        <tr>
          <td>${formatDateTime(c.fecha_compra)}</td>
          <td>${c.nombre_proveedor || '—'}</td>
          <td>${fmtQ(c.total)}</td>
          <td>${fmtQ(c.pagado)}</td>
        </tr>
      `).join('') : `<tr><td colspan="4" class="empty-row">Sin registros todavía.</td></tr>`;

      // Inventario bajo
      const ti = document.getElementById('tbodyInventarioBajo');
      const inv = data.tablas?.inventario_bajo || [];
      ti.innerHTML = inv.length ? inv.map(p => `
        <tr>
          <td>${p.nombre_producto}</td>
          <td>${Number(p.stock_actual || 0)}</td>
          <td>${Number(p.stock_minimo || 0)}</td>
        </tr>
      `).join('') : `<tr><td colspan="3" class="empty-row">Sin alertas por ahora.</td></tr>`;

      // Más / menos vendidos (en una tabla)
      const tm = document.getElementById('tbodyMasMenosVendidos');
      const mas = data.tablas?.productos_mas_vendidos || [];
      const menos = data.tablas?.productos_menos_vendidos || [];
      const rows = [];

      for (const p of mas) {
        rows.push(`
          <tr>
            <td>${p.nombre_producto}</td>
            <td>${Number(p.cantidad_vendida || 0)}</td>
            <td>Más vendido</td>
          </tr>
        `);
      }
      for (const p of menos) {
        rows.push(`
          <tr>
            <td>${p.nombre_producto}</td>
            <td>${Number(p.cantidad_vendida || 0)}</td>
            <td>Menos vendido</td>
          </tr>
        `);
      }
      tm.innerHTML = rows.length ? rows.join('') : `<tr><td colspan="3" class="empty-row">Sin estadísticas todavía.</td></tr>`;

      // Créditos próximos
      const tcr = document.getElementById('tbodyCreditosProximos');
      const cr = data.tablas?.creditos_proximos || [];
      tcr.innerHTML = cr.length ? cr.map(x => `
        <tr>
          <td>${x.nombre_cliente}</td>
          <td>${fmtQ(x.saldo_pendiente)}</td>
          <td>${x.fecha_vencimiento ? String(x.fecha_vencimiento).slice(0,10) : '—'}</td>
        </tr>
      `).join('') : `<tr><td colspan="3" class="empty-row">Sin créditos registrados.</td></tr>`;

      // Ventas 7 días
      const t7 = document.getElementById('tbodyVentas7');
      const v7 = data.tablas?.ventas_ultimos_7_dias || [];
      t7.innerHTML = v7.length ? v7.map(r => `
        <tr>
          <td>${String(r.dia).slice(0,10)}</td>
          <td>${fmtQ(r.total)}</td>
        </tr>
      `).join('') : `<tr><td colspan="2" class="empty-row">Sin datos para mostrar.</td></tr>`;

    } catch (e) {
      console.error(e);
      alert('Error al cargar el dashboard. Revisa consola del backend.');
    }
  }

  cargarDashboard();
});
