const ProveedorModel = require('../models/proveedor.model');

const ESTADOS_PERMITIDOS = [
  'activo',
  'inactivo'
];

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================
function obtenerIdValido(valor) {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}


function limpiarTexto(valor) {
  if (typeof valor !== 'string') {
    return '';
  }

  return valor.trim();
}


function textoOpcional(valor) {
  const texto = limpiarTexto(valor);

  return texto === '' ? null : texto;
}


function correoValido(correo) {
  if (!correo) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}


function normalizarDatosProveedor(body) {
  return {
    nombre_proveedor: limpiarTexto(
      body.nombre_proveedor
    ),

    nombre_contacto: textoOpcional(
      body.nombre_contacto
    ),

    telefono: textoOpcional(
      body.telefono
    ),

    telefono_alt: textoOpcional(
      body.telefono_alt
    ),

    email: textoOpcional(
      body.email
    ),

    nit: textoOpcional(
      body.nit
    ),

    ciudad: textoOpcional(
      body.ciudad
    ),

    departamento: textoOpcional(
      body.departamento
    ),

    direccion: textoOpcional(
      body.direccion
    ),

    estado: limpiarTexto(
      body.estado
    ) || 'activo',

    notas: textoOpcional(
      body.notas
    )
  };
}


// =====================================================
// GET /api/proveedores
// LISTAR PROVEEDORES
// =====================================================
async function listarProveedores(req, res) {
  try {
    const proveedores =
      await ProveedorModel.getAllProveedores();

    return res.status(200).json(proveedores);

  } catch (error) {
    console.error(
      'Error al listar proveedores:',
      error
    );

    return res.status(500).json({
      message: 'Error al obtener los proveedores.'
    });
  }
}


// =====================================================
// GET /api/proveedores/:id
// OBTENER PROVEEDOR
// =====================================================
async function obtenerProveedor(req, res) {
  try {
    const idProveedor =
      obtenerIdValido(req.params.id);

    if (!idProveedor) {
      return res.status(400).json({
        message:
          'El ID del proveedor no es válido.'
      });
    }

    const proveedor =
      await ProveedorModel.getProveedorById(
        idProveedor
      );

    if (!proveedor) {
      return res.status(404).json({
        message: 'Proveedor no encontrado.'
      });
    }

    return res.status(200).json(proveedor);

  } catch (error) {
    console.error(
      'Error al obtener proveedor:',
      error
    );

    return res.status(500).json({
      message:
        'Error interno al obtener el proveedor.'
    });
  }
}


// =====================================================
// POST /api/proveedores
// CREAR PROVEEDOR
// =====================================================
async function crearProveedor(req, res) {
  try {
    const datos =
      normalizarDatosProveedor(req.body);

    if (!datos.nombre_proveedor) {
      return res.status(400).json({
        message:
          'El nombre del proveedor es obligatorio.'
      });
    }

    if (
      !ESTADOS_PERMITIDOS.includes(datos.estado)
    ) {
      return res.status(400).json({
        message:
          'El estado seleccionado no es válido.'
      });
    }

    if (!correoValido(datos.email)) {
      return res.status(400).json({
        message:
          'El correo electrónico no es válido.'
      });
    }

    const duplicado =
      await ProveedorModel.buscarDuplicado({
        email: datos.email,
        nit: datos.nit
      });

    if (duplicado) {
      if (
        datos.email &&
        duplicado.email === datos.email
      ) {
        return res.status(409).json({
          message:
            'Ya existe un proveedor con ese correo electrónico.'
        });
      }

      if (
        datos.nit &&
        duplicado.nit === datos.nit
      ) {
        return res.status(409).json({
          message:
            'Ya existe un proveedor con ese NIT.'
        });
      }

      return res.status(409).json({
        message:
          'Ya existe un proveedor con el mismo correo o NIT.'
      });
    }

    const nuevoProveedor =
      await ProveedorModel.createProveedor(datos);

    return res.status(201).json({
      message:
        'Proveedor creado correctamente.',
      proveedor: nuevoProveedor
    });

  } catch (error) {
    console.error(
      'Error al crear proveedor:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Ya existe un proveedor con el mismo correo o NIT.'
      });
    }

    return res.status(500).json({
      message:
        'Error interno al crear el proveedor.'
    });
  }
}


// =====================================================
// PUT /api/proveedores/:id
// ACTUALIZAR PROVEEDOR
// =====================================================
async function actualizarProveedor(req, res) {
  try {
    const idProveedor =
      obtenerIdValido(req.params.id);

    if (!idProveedor) {
      return res.status(400).json({
        message:
          'El ID del proveedor no es válido.'
      });
    }

    const proveedorActual =
      await ProveedorModel.getProveedorById(
        idProveedor
      );

    if (!proveedorActual) {
      return res.status(404).json({
        message: 'Proveedor no encontrado.'
      });
    }

    const datos =
      normalizarDatosProveedor(req.body);

    if (!datos.nombre_proveedor) {
      return res.status(400).json({
        message:
          'El nombre del proveedor es obligatorio.'
      });
    }

    if (
      !ESTADOS_PERMITIDOS.includes(datos.estado)
    ) {
      return res.status(400).json({
        message:
          'El estado seleccionado no es válido.'
      });
    }

    if (!correoValido(datos.email)) {
      return res.status(400).json({
        message:
          'El correo electrónico no es válido.'
      });
    }

    const duplicado =
      await ProveedorModel.buscarDuplicado({
        email: datos.email,
        nit: datos.nit,
        excluirId: idProveedor
      });

    if (duplicado) {
      if (
        datos.email &&
        duplicado.email === datos.email
      ) {
        return res.status(409).json({
          message:
            'Otro proveedor ya utiliza ese correo electrónico.'
        });
      }

      if (
        datos.nit &&
        duplicado.nit === datos.nit
      ) {
        return res.status(409).json({
          message:
            'Otro proveedor ya utiliza ese NIT.'
        });
      }

      return res.status(409).json({
        message:
          'Otro proveedor utiliza el mismo correo o NIT.'
      });
    }

    const proveedorActualizado =
      await ProveedorModel.updateProveedor(
        idProveedor,
        datos
      );

    if (!proveedorActualizado) {
      return res.status(404).json({
        message:
          'No se pudo actualizar el proveedor.'
      });
    }

    return res.status(200).json({
      message:
        'Proveedor actualizado correctamente.',
      proveedor: proveedorActualizado
    });

  } catch (error) {
    console.error(
      'Error al actualizar proveedor:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Ya existe otro proveedor con el mismo correo o NIT.'
      });
    }

    return res.status(500).json({
      message:
        'Error interno al actualizar el proveedor.'
    });
  }
}


// =====================================================
// DELETE /api/proveedores/:id
// ELIMINAR PROVEEDOR
// =====================================================
async function eliminarProveedor(req, res) {
  try {
    const idProveedor =
      obtenerIdValido(req.params.id);

    if (!idProveedor) {
      return res.status(400).json({
        message:
          'El ID del proveedor no es válido.'
      });
    }

    const proveedor =
      await ProveedorModel.getProveedorById(
        idProveedor
      );

    if (!proveedor) {
      return res.status(404).json({
        message: 'Proveedor no encontrado.'
      });
    }

    const eliminado =
      await ProveedorModel.deleteProveedor(
        idProveedor
      );

    if (!eliminado) {
      return res.status(404).json({
        message:
          'No se pudo eliminar el proveedor.'
      });
    }

    return res.status(200).json({
      message:
        `El proveedor "${proveedor.nombre_proveedor}" fue eliminado correctamente.`,
      id_proveedor: idProveedor
    });

  } catch (error) {
    console.error(
      'Error al eliminar proveedor:',
      error
    );

    if (
      error.code === 'ER_ROW_IS_REFERENCED_2' ||
      error.code === 'ER_ROW_IS_REFERENCED'
    ) {
      return res.status(409).json({
        message:
          'No se puede eliminar este proveedor porque tiene compras u otros registros relacionados. Puedes cambiar su estado a inactivo.'
      });
    }

    return res.status(500).json({
      message:
        'Error interno al eliminar el proveedor.'
    });
  }
}


module.exports = {
  listarProveedores,
  obtenerProveedor,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor
};