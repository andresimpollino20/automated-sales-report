/*
==========================================================
GOOGLE SHEETS SALES AUTOMATION

Actualiza:
- Base_Consolidada
- Errores
- Control_Carga
- Configuracion!B8

Configuración:
B2 = ID carpeta de ventas
B3 = ID Maestro_Clientes
B4 = ID Maestro_Productos
B5 = Clientes
B6 = Productos
B7 = Ventas
==========================================================
*/


// ======================================================
// MENÚ
// ======================================================

function onOpen() {

  SpreadsheetApp.getUi()
    .createMenu("Automation")
    .addItem("Update report", "actualizarReporte")
    .addToUi();
}


// ======================================================
// PROCESO PRINCIPAL
// ======================================================

function actualizarReporte() {

  const bloqueo = LockService.getDocumentLock();

  if (!bloqueo.tryLock(5000)) {
    throw new Error(
      "Another update is already running."
    );
  }

  try {

    const libroReporte =
      SpreadsheetApp.getActiveSpreadsheet();

    const hojaConfiguracion =
      libroReporte.getSheetByName("Configuracion");

    const hojaBase =
      libroReporte.getSheetByName("Base_Consolidada");

    const hojaErrores =
      libroReporte.getSheetByName("Errores");

    const hojaControl =
      libroReporte.getSheetByName("Control_Carga");

    if (
      !hojaConfiguracion ||
      !hojaBase ||
      !hojaErrores ||
      !hojaControl
    ) {
      throw new Error(
        "Missing required sheet: Configuracion, " +
        "Base_Consolidada, Errores or Control_Carga."
      );
    }

    const configuracion =
      obtenerConfiguracion_(hojaConfiguracion);

    validarConfiguracion_(configuracion);

    libroReporte.toast(
      "Reading master data and monthly files...",
      "Update",
      5
    );

    const clientes = obtenerMaestroClientes_(
      configuracion.idMaestroClientes,
      configuracion.hojaClientes
    );

    const productos = obtenerMaestroProductos_(
      configuracion.idMaestroProductos,
      configuracion.hojaProductos
    );

    const carpeta = DriveApp.getFolderById(
      configuracion.idCarpetaVentas
    );

    const archivosMensuales =
      obtenerArchivosMensuales_(carpeta);

    const encabezadoBase = [
      "Sale_ID",
      "Date",
      "Customer_Code",
      "Customer_Name",
      "Product_Code",
      "Product_Name",
      "Category",
      "Channel",
      "Sales_Representative",
      "Province",
      "Quantity",
      "Unit_Price",
      "Discount_Percentage",
      "Total_Amount",
      "Status",
      "Source_File",
      "Month",
      "Validation_Result"
    ];

    const encabezadoErrores = [
      "Process_Date",
      "File",
      "Source_Row",
      "Sale_ID",
      "Field",
      "Original_Value",
      "Type",
      "Action"
    ];

    const encabezadoControl = [
      "File",
      "Records_Read",
      "Records_Loaded",
      "Records_Rejected",
      "Warnings",
      "Load_Status",
      "Process_Date"
    ];

    const baseConsolidada = [];
    const errores = [];
    const controlCarga = [];

    const idsProcesados = new Set();
    const fechaProceso = new Date();

    for (let mes = 1; mes <= 12; mes++) {

      const nombreArchivo =
        "Ventas_2025_" +
        String(mes).padStart(2, "0");

      libroReporte.toast(
        "Processing " + nombreArchivo,
        "Update",
        3
      );

      const archivo =
        archivosMensuales[nombreArchivo];

      if (!archivo) {

        errores.push([
          fechaProceso,
          nombreArchivo,
          "",
          "",
          "File",
          nombreArchivo,
          "Error",
          "Monthly file not found"
        ]);

        controlCarga.push([
          nombreArchivo,
          0,
          0,
          0,
          0,
          "Not found",
          fechaProceso
        ]);

        continue;
      }

      procesarArchivoMensual_({
        archivo: archivo,
        nombreArchivo: nombreArchivo,
        nombreHoja: configuracion.hojaVentas,
        clientes: clientes,
        productos: productos,
        idsProcesados: idsProcesados,
        baseConsolidada: baseConsolidada,
        errores: errores,
        controlCarga: controlCarga,
        fechaProceso: fechaProceso
      });
    }

    escribirBase_(
      hojaBase,
      encabezadoBase,
      baseConsolidada
    );

    escribirErrores_(
      hojaErrores,
      encabezadoErrores,
      errores
    );

    escribirControl_(
      hojaControl,
      encabezadoControl,
      controlCarga
    );

    hojaConfiguracion
      .getRange("B8")
      .setValue(fechaProceso)
      .setNumberFormat("dd/mm/yyyy hh:mm:ss");

    SpreadsheetApp.flush();

    const mensaje =
      "Update completed. " +
      baseConsolidada.length +
      " records loaded and " +
      errores.length +
      " observations detected.";

    libroReporte.toast(
      mensaje,
      "Update completed",
      10
    );

    SpreadsheetApp.getUi().alert(mensaje);

  } finally {
    bloqueo.releaseLock();
  }
}


// ======================================================
// CONFIGURACIÓN
// ======================================================

function obtenerConfiguracion_(hoja) {

  return {
    idCarpetaVentas:
      limpiarTexto_(
        hoja.getRange("B2").getValue()
      ),

    idMaestroClientes:
      limpiarTexto_(
        hoja.getRange("B3").getValue()
      ),

    idMaestroProductos:
      limpiarTexto_(
        hoja.getRange("B4").getValue()
      ),

    hojaClientes:
      limpiarTexto_(
        hoja.getRange("B5").getValue()
      ),

    hojaProductos:
      limpiarTexto_(
        hoja.getRange("B6").getValue()
      ),

    hojaVentas:
      limpiarTexto_(
        hoja.getRange("B7").getValue()
      )
  };
}


function validarConfiguracion_(configuracion) {

  const faltantes = [];

  if (!configuracion.idCarpetaVentas) {
    faltantes.push("B2: sales folder ID");
  }

  if (!configuracion.idMaestroClientes) {
    faltantes.push("B3: customer master ID");
  }

  if (!configuracion.idMaestroProductos) {
    faltantes.push("B4: product master ID");
  }

  if (!configuracion.hojaClientes) {
    faltantes.push("B5: customer sheet");
  }

  if (!configuracion.hojaProductos) {
    faltantes.push("B6: product sheet");
  }

  if (!configuracion.hojaVentas) {
    faltantes.push("B7: sales sheet");
  }

  if (faltantes.length > 0) {
    throw new Error(
      "Missing configuration values: " +
      faltantes.join(", ")
    );
  }
}


// ======================================================
// MAESTRO DE CLIENTES
// ======================================================

function obtenerMaestroClientes_(
  idArchivo,
  nombreHoja
) {

  const libro =
    SpreadsheetApp.openById(idArchivo);

  const hoja =
    buscarHoja_(libro, nombreHoja);

  if (!hoja) {
    throw new Error(
      'Sheet "' +
      nombreHoja +
      '" was not found in Maestro_Clientes.'
    );
  }

  const datos =
    hoja.getDataRange().getValues();

  const clientes = new Map();

  for (let fila = 1; fila < datos.length; fila++) {

    const codigo =
      limpiarTexto_(datos[fila][0]);

    if (!codigo) {
      continue;
    }

    clientes.set(
      normalizarCodigo_(codigo),
      {
        codigo: codigo,
        nombre: limpiarTexto_(datos[fila][1]),
        segmento: limpiarTexto_(datos[fila][2]),
        canal: limpiarTexto_(datos[fila][3]),
        provincia: limpiarTexto_(datos[fila][4]),
        ciudad: limpiarTexto_(datos[fila][5]),
        estado: limpiarTexto_(datos[fila][7])
      }
    );
  }

  return clientes;
}


// ======================================================
// MAESTRO DE PRODUCTOS
// ======================================================

function obtenerMaestroProductos_(
  idArchivo,
  nombreHoja
) {

  const libro =
    SpreadsheetApp.openById(idArchivo);

  const hoja =
    buscarHoja_(libro, nombreHoja);

  if (!hoja) {
    throw new Error(
      'Sheet "' +
      nombreHoja +
      '" was not found in Maestro_Productos.'
    );
  }

  const datos =
    hoja.getDataRange().getValues();

  const productos = new Map();

  for (let fila = 1; fila < datos.length; fila++) {

    const codigo =
      limpiarTexto_(datos[fila][0]);

    if (!codigo) {
      continue;
    }

    productos.set(
      normalizarCodigo_(codigo),
      {
        codigo: codigo,
        nombre: limpiarTexto_(datos[fila][1]),
        categoria: limpiarTexto_(datos[fila][2]),
        subcategoria:
          limpiarTexto_(datos[fila][3]),
        marca: limpiarTexto_(datos[fila][4]),
        precioLista:
          convertirNumero_(datos[fila][5]),
        estado: limpiarTexto_(datos[fila][7])
      }
    );
  }

  return productos;
}


// ======================================================
// ARCHIVOS MENSUALES
// ======================================================

function obtenerArchivosMensuales_(carpeta) {

  const resultado = {};
  const archivos = carpeta.getFiles();

  while (archivos.hasNext()) {

    const archivo = archivos.next();
    const nombre = archivo.getName();

    const esGoogleSheets =
      archivo.getMimeType() ===
      MimeType.GOOGLE_SHEETS;

    const nombreValido =
      /^Ventas_2025_(0[1-9]|1[0-2])$/.test(
        nombre
      );

    if (!esGoogleSheets || !nombreValido) {
      continue;
    }

    /*
    Si existen archivos duplicados con el mismo
    nombre, utiliza el modificado más recientemente.
    */
    if (
      !resultado[nombre] ||
      archivo.getLastUpdated() >
      resultado[nombre].getLastUpdated()
    ) {
      resultado[nombre] = archivo;
    }
  }

  return resultado;
}


// ======================================================
// PROCESAR ARCHIVO MENSUAL
// ======================================================

function procesarArchivoMensual_(parametros) {

  const archivo = parametros.archivo;
  const nombreArchivo = parametros.nombreArchivo;
  const nombreHoja = parametros.nombreHoja;
  const clientes = parametros.clientes;
  const productos = parametros.productos;
  const idsProcesados = parametros.idsProcesados;
  const base = parametros.baseConsolidada;
  const errores = parametros.errores;
  const control = parametros.controlCarga;
  const fechaProceso = parametros.fechaProceso;

  let registrosLeidos = 0;
  let registrosCargados = 0;
  let registrosRechazados = 0;
  let advertencias = 0;

  try {

    const libro = SpreadsheetApp.openById(
      archivo.getId()
    );

    const hoja = buscarHoja_(
      libro,
      nombreHoja
    );

    if (!hoja) {

      errores.push([
        fechaProceso,
        nombreArchivo,
        "",
        "",
        "Sheet",
        nombreHoja,
        "Error",
        "File skipped: sheet not found"
      ]);

      control.push([
        nombreArchivo,
        0,
        0,
        0,
        0,
        "Error: sheet not found",
        fechaProceso
      ]);

      return;
    }

    const datos =
      hoja.getDataRange().getValues();

    if (datos.length < 2) {

      control.push([
        nombreArchivo,
        0,
        0,
        0,
        0,
        "No records",
        fechaProceso
      ]);

      return;
    }

    const encabezados = datos[0];

    const indices =
      crearIndices_(encabezados);

    const camposObligatorios = [
      "ID_Venta",
      "Fecha",
      "Codigo_Cliente",
      "Codigo_Producto",
      "Cantidad",
      "Precio_Unitario",
      "Descuento_Porcentaje",
      "Estado"
    ];

    const faltantes =
      camposObligatorios.filter(
        function(campo) {
          return indices[campo] === undefined;
        }
      );

    if (faltantes.length > 0) {

      errores.push([
        fechaProceso,
        nombreArchivo,
        1,
        "",
        "Headers",
        faltantes.join(", "),
        "Error",
        "File skipped due to missing columns"
      ]);

      control.push([
        nombreArchivo,
        datos.length - 1,
        0,
        datos.length - 1,
        0,
        "Structure error",
        fechaProceso
      ]);

      return;
    }

    const usaEncabezadoAlternativo =
      encabezados.some(function(encabezado) {

        return normalizarEncabezado_(
          encabezado
        ) === "codcliente";
      });

    if (usaEncabezadoAlternativo) {

      errores.push([
        fechaProceso,
        nombreArchivo,
        1,
        "",
        "Customer_Code",
        "Cod_Cliente",
        "Warning",
        "Header normalized automatically"
      ]);

      advertencias++;
    }

    for (
      let numeroFila = 1;
      numeroFila < datos.length;
      numeroFila++
    ) {

      const fila = datos[numeroFila];

      if (filaVacia_(fila)) {
        continue;
      }

      registrosLeidos++;

      const resultado =
        validarYLimpiarFila_({
          fila: fila,
          numeroFila: numeroFila + 1,
          nombreArchivo: nombreArchivo,
          indices: indices,
          clientes: clientes,
          productos: productos,
          idsProcesados: idsProcesados,
          fechaProceso: fechaProceso
        });

      resultado.errores.forEach(
        function(error) {

          errores.push(error);

          if (error[6] === "Warning") {
            advertencias++;
          }
        }
      );

      if (resultado.rechazada) {
        registrosRechazados++;
      } else {
        base.push(resultado.filaLimpia);
        registrosCargados++;
      }
    }

    let estadoCarga = "Correct";

    if (registrosRechazados > 0) {
      estadoCarga =
        "Completed with rejected records";
    } else if (advertencias > 0) {
      estadoCarga =
        "Completed with warnings";
    }

    control.push([
      nombreArchivo,
      registrosLeidos,
      registrosCargados,
      registrosRechazados,
      advertencias,
      estadoCarga,
      fechaProceso
    ]);

  } catch (error) {

    errores.push([
      fechaProceso,
      nombreArchivo,
      "",
      "",
      "File",
      error.message,
      "Error",
      "File could not be processed"
    ]);

    control.push([
      nombreArchivo,
      registrosLeidos,
      registrosCargados,
      registrosRechazados,
      advertencias,
      "Processing error",
      fechaProceso
    ]);
  }
}


// ======================================================
// VALIDAR Y LIMPIAR FILA
// ======================================================

function validarYLimpiarFila_(parametros) {

  const fila = parametros.fila;
  const numeroFila = parametros.numeroFila;
  const nombreArchivo = parametros.nombreArchivo;
  const indices = parametros.indices;
  const clientes = parametros.clientes;
  const productos = parametros.productos;
  const idsProcesados = parametros.idsProcesados;
  const fechaProceso = parametros.fechaProceso;

  const erroresFila = [];

  let rechazada = false;
  let corregida = false;

  function valor(campo) {

    const posicion = indices[campo];

    return posicion === undefined
      ? ""
      : fila[posicion];
  }

  const idVenta =
    limpiarTexto_(valor("ID_Venta"));

  function registrar(
    campo,
    valorOriginal,
    tipo,
    accion
  ) {

    erroresFila.push([
      fechaProceso,
      nombreArchivo,
      numeroFila,
      idVenta,
      campo,
      valorOriginal,
      tipo,
      accion
    ]);

    if (tipo === "Error") {
      rechazada = true;
    } else {
      corregida = true;
    }
  }

  // ID de venta

  if (!idVenta) {

    registrar(
      "Sale_ID",
      valor("ID_Venta"),
      "Error",
      "Rejected: empty sale ID"
    );

  } else if (idsProcesados.has(idVenta)) {

    registrar(
      "Sale_ID",
      idVenta,
      "Error",
      "Rejected: duplicate sale ID"
    );

  } else {
    idsProcesados.add(idVenta);
  }

  // Fecha

  const fechaOriginal =
    valor("Fecha");

  const fecha =
    convertirFecha_(fechaOriginal);

  if (!fecha) {

    registrar(
      "Date",
      fechaOriginal,
      "Error",
      "Rejected: invalid date"
    );
  }

  // Cliente

  const codigoClienteSinLimpiar =
    valor("Codigo_Cliente");

  const codigoClienteOriginal =
    limpiarTexto_(codigoClienteSinLimpiar);

  const codigoClienteNormalizado =
    normalizarCodigo_(
      codigoClienteOriginal
    );

  if (
    codigoClienteSinLimpiar !== null &&
    codigoClienteSinLimpiar !== undefined &&
    String(codigoClienteSinLimpiar) !==
      String(codigoClienteSinLimpiar).trim()
  ) {

    registrar(
      "Customer_Code",
      codigoClienteSinLimpiar,
      "Warning",
      "Leading or trailing spaces removed"
    );
  }

  const cliente =
    clientes.get(codigoClienteNormalizado);

  if (!codigoClienteOriginal) {

    registrar(
      "Customer_Code",
      codigoClienteSinLimpiar,
      "Error",
      "Rejected: empty customer code"
    );

  } else if (!cliente) {

    registrar(
      "Customer_Code",
      codigoClienteOriginal,
      "Error",
      "Rejected: customer not found"
    );
  }

  // Producto

  const codigoProductoOriginal =
    limpiarTexto_(
      valor("Codigo_Producto")
    );

  const producto =
    productos.get(
      normalizarCodigo_(
        codigoProductoOriginal
      )
    );

  if (!codigoProductoOriginal) {

    registrar(
      "Product_Code",
      valor("Codigo_Producto"),
      "Error",
      "Rejected: empty product code"
    );

  } else if (!producto) {

    registrar(
      "Product_Code",
      codigoProductoOriginal,
      "Error",
      "Rejected: product not found"
    );
  }

  // Cantidad

  const cantidadOriginal =
    valor("Cantidad");

  const cantidad =
    convertirNumero_(cantidadOriginal);

  if (
    cantidad === null ||
    cantidad <= 0
  ) {

    registrar(
      "Quantity",
      cantidadOriginal,
      "Error",
      "Rejected: invalid quantity"
    );
  }

  // Precio

  const precioOriginal =
    valor("Precio_Unitario");

  const precio =
    convertirNumero_(precioOriginal);

  if (
    precio === null ||
    precio <= 0
  ) {

    registrar(
      "Unit_Price",
      precioOriginal,
      "Error",
      "Rejected: invalid unit price"
    );

  } else if (
    typeof precioOriginal === "string" &&
    precioOriginal.includes(",")
  ) {

    registrar(
      "Unit_Price",
      precioOriginal,
      "Warning",
      "Unit price converted to number"
    );
  }

  // Descuento

  const descuentoResultado =
    convertirDescuento_(
      valor("Descuento_Porcentaje")
    );

  const descuento =
    descuentoResultado.valor;

  if (descuento === null) {

    registrar(
      "Discount_Percentage",
      valor("Descuento_Porcentaje"),
      "Error",
      "Rejected: invalid discount"
    );

  } else if (
    descuentoResultado.corregido
  ) {

    registrar(
      "Discount_Percentage",
      valor("Descuento_Porcentaje"),
      "Warning",
      "Discount converted to percentage"
    );
  }

  // Estado normalizado

  const estadoOriginal =
    limpiarTexto_(valor("Estado"));

  const estado =
    normalizarEstado_(estadoOriginal);

  if (!estadoOriginal) {

    registrar(
      "Status",
      valor("Estado"),
      "Error",
      "Rejected: empty status"
    );
  }

  // Categoría

  let categoriaFinal =
    producto
      ? producto.categoria
      : limpiarTexto_(valor("Categoria"));

  if (
    producto &&
    limpiarTexto_(valor("Categoria")) &&
    normalizarTexto_(
      valor("Categoria")
    ) !==
    normalizarTexto_(
      producto.categoria
    )
  ) {

    registrar(
      "Category",
      valor("Categoria"),
      "Warning",
      "Category corrected from product master"
    );

    categoriaFinal =
      producto.categoria;
  }

  // Importe

  const importeOriginal =
    convertirNumero_(
      valor("Importe_Total")
    );

  let importeCalculado = null;

  if (
    cantidad !== null &&
    precio !== null &&
    descuento !== null
  ) {

    importeCalculado = redondear_(
      cantidad *
      precio *
      (1 - descuento),
      2
    );
  }

  if (
    importeCalculado !== null &&
    (
      importeOriginal === null ||
      Math.abs(
        importeCalculado -
        importeOriginal
      ) > 0.02
    )
  ) {

    registrar(
      "Total_Amount",
      valor("Importe_Total"),
      "Warning",
      "Total amount recalculated"
    );
  }

  if (rechazada) {

    return {
      rechazada: true,
      filaLimpia: null,
      errores: erroresFila
    };
  }

  const mes = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    1
  );

  const filaLimpia = [
    idVenta,
    fecha,
    cliente.codigo,
    cliente.nombre,
    producto.codigo,
    producto.nombre,
    categoriaFinal,
    cliente.canal,
    limpiarTexto_(valor("Vendedor")),
    cliente.provincia,
    cantidad,
    precio,
    descuento,
    importeCalculado,
    estado,
    nombreArchivo,
    mes,
    corregida ? "Corrected" : "Correct"
  ];

  return {
    rechazada: false,
    filaLimpia: filaLimpia,
    errores: erroresFila
  };
}


// ======================================================
// NORMALIZAR ENCABEZADOS
// ======================================================

function crearIndices_(encabezados) {

  const indices = {};

  const equivalencias = {
    "idventa": "ID_Venta",
    "saleid": "ID_Venta",

    "fecha": "Fecha",
    "date": "Fecha",

    "codigocliente": "Codigo_Cliente",
    "codcliente": "Codigo_Cliente",
    "customercode": "Codigo_Cliente",

    "nombrecliente": "Nombre_Cliente",
    "customername": "Nombre_Cliente",

    "codigoproducto": "Codigo_Producto",
    "codproducto": "Codigo_Producto",
    "productcode": "Codigo_Producto",

    "nombreproducto": "Nombre_Producto",
    "productname": "Nombre_Producto",

    "categoria": "Categoria",
    "category": "Categoria",

    "canal": "Canal",
    "channel": "Canal",

    "vendedor": "Vendedor",
    "salesrepresentative": "Vendedor",

    "provincia": "Provincia",
    "province": "Provincia",

    "cantidad": "Cantidad",
    "quantity": "Cantidad",

    "preciounitario": "Precio_Unitario",
    "unitprice": "Precio_Unitario",

    "descuentoporcentaje":
      "Descuento_Porcentaje",

    "discountpercentage":
      "Descuento_Porcentaje",

    "importetotal": "Importe_Total",
    "totalamount": "Importe_Total",

    "estado": "Estado",
    "status": "Estado",

    "archivoorigen": "Archivo_Origen",
    "sourcefile": "Archivo_Origen"
  };

  encabezados.forEach(
    function(encabezado, posicion) {

      const nombreNormalizado =
        normalizarEncabezado_(encabezado);

      const nombreCanonico =
        equivalencias[nombreNormalizado];

      if (nombreCanonico) {
        indices[nombreCanonico] =
          posicion;
      }
    }
  );

  return indices;
}


// ======================================================
// ESCRIBIR BASE
// ======================================================

function escribirBase_(
  hoja,
  encabezados,
  datos
) {

  prepararHoja_(
    hoja,
    encabezados,
    datos
  );

  if (datos.length === 0) {
    return;
  }

  hoja.getRange(
    2,
    2,
    datos.length,
    1
  ).setNumberFormat("dd/mm/yyyy");

  hoja.getRange(
    2,
    11,
    datos.length,
    1
  ).setNumberFormat("#,##0");

  hoja.getRange(
    2,
    12,
    datos.length,
    1
  ).setNumberFormat('"$"#,##0.00');

  hoja.getRange(
    2,
    13,
    datos.length,
    1
  ).setNumberFormat("0.0%");

  hoja.getRange(
    2,
    14,
    datos.length,
    1
  ).setNumberFormat('"$"#,##0.00');

  hoja.getRange(
    2,
    17,
    datos.length,
    1
  ).setNumberFormat("mmm-yyyy");

  hoja.setColumnWidth(4, 190);
  hoja.setColumnWidth(6, 190);
  hoja.setColumnWidth(16, 145);
}


// ======================================================
// ESCRIBIR ERRORES
// ======================================================

function escribirErrores_(
  hoja,
  encabezados,
  datos
) {

  prepararHoja_(
    hoja,
    encabezados,
    datos
  );

  if (datos.length === 0) {
    return;
  }

  hoja.getRange(
    2,
    1,
    datos.length,
    1
  ).setNumberFormat(
    "dd/mm/yyyy hh:mm:ss"
  );

  hoja.setColumnWidth(2, 150);
  hoja.setColumnWidth(6, 180);
  hoja.setColumnWidth(8, 290);

  const tipos = hoja.getRange(
    2,
    7,
    datos.length,
    1
  ).getValues();

  const fondos = tipos.map(
    function(fila) {

      const color =
        fila[0] === "Error"
          ? "#F4CCCC"
          : "#FFF2CC";

      return Array(
        encabezados.length
      ).fill(color);
    }
  );

  hoja.getRange(
    2,
    1,
    datos.length,
    encabezados.length
  ).setBackgrounds(fondos);
}


// ======================================================
// ESCRIBIR CONTROL
// ======================================================

function escribirControl_(
  hoja,
  encabezados,
  datos
) {

  prepararHoja_(
    hoja,
    encabezados,
    datos
  );

  if (datos.length === 0) {
    return;
  }

  hoja.getRange(
    2,
    2,
    datos.length,
    4
  ).setNumberFormat("#,##0");

  hoja.getRange(
    2,
    7,
    datos.length,
    1
  ).setNumberFormat(
    "dd/mm/yyyy hh:mm:ss"
  );

  hoja.setColumnWidth(1, 160);
  hoja.setColumnWidth(6, 220);
  hoja.setColumnWidth(7, 160);
}


// ======================================================
// PREPARAR HOJA
// ======================================================

function prepararHoja_(
  hoja,
  encabezados,
  datos
) {

  const filtro = hoja.getFilter();

  if (filtro) {
    filtro.remove();
  }

  hoja.clear();

  asegurarTamano_(
    hoja,
    Math.max(datos.length + 1, 2),
    encabezados.length
  );

  hoja.getRange(
    1,
    1,
    1,
    encabezados.length
  )
    .setValues([encabezados])
    .setBackground("#1F4E78")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  if (datos.length > 0) {

    hoja.getRange(
      2,
      1,
      datos.length,
      encabezados.length
    ).setValues(datos);

    hoja.getRange(
      1,
      1,
      datos.length + 1,
      encabezados.length
    ).createFilter();
  }

  hoja.setFrozenRows(1);

  hoja.setColumnWidths(
    1,
    encabezados.length,
    125
  );

  hoja.getDataRange()
    .setVerticalAlignment("middle");
}


// ======================================================
// TAMAÑO DE HOJAS
// ======================================================

function asegurarTamano_(
  hoja,
  filasNecesarias,
  columnasNecesarias
) {

  if (
    hoja.getMaxRows() <
    filasNecesarias
  ) {

    hoja.insertRowsAfter(
      hoja.getMaxRows(),
      filasNecesarias -
      hoja.getMaxRows()
    );
  }

  if (
    hoja.getMaxColumns() <
    columnasNecesarias
  ) {

    hoja.insertColumnsAfter(
      hoja.getMaxColumns(),
      columnasNecesarias -
      hoja.getMaxColumns()
    );
  }
}


// ======================================================
// CONVERTIR FECHA
// ======================================================

function convertirFecha_(valor) {

  if (
    valor instanceof Date &&
    !isNaN(valor.getTime())
  ) {

    return new Date(
      valor.getFullYear(),
      valor.getMonth(),
      valor.getDate()
    );
  }

  const texto =
    limpiarTexto_(valor);

  const coincidencia =
    texto.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
    );

  if (!coincidencia) {
    return null;
  }

  const dia =
    Number(coincidencia[1]);

  const mes =
    Number(coincidencia[2]);

  const anio =
    Number(coincidencia[3]);

  const fecha =
    new Date(anio, mes - 1, dia);

  if (
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    return null;
  }

  return fecha;
}


// ======================================================
// CONVERTIR NÚMEROS
// ======================================================

function convertirNumero_(valor) {

  if (
    typeof valor === "number" &&
    !isNaN(valor)
  ) {
    return valor;
  }

  let texto =
    limpiarTexto_(valor);

  if (!texto) {
    return null;
  }

  texto = texto
    .replace(/\$/g, "")
    .replace(/\s/g, "");

  if (
    texto.includes(".") &&
    texto.includes(",")
  ) {

    if (
      texto.lastIndexOf(",") >
      texto.lastIndexOf(".")
    ) {

      texto = texto
        .replace(/\./g, "")
        .replace(",", ".");

    } else {
      texto =
        texto.replace(/,/g, "");
    }

  } else if (
    texto.includes(",")
  ) {
    texto =
      texto.replace(",", ".");
  }

  const numero = Number(texto);

  return isNaN(numero)
    ? null
    : numero;
}


// ======================================================
// CONVERTIR DESCUENTO
// ======================================================

function convertirDescuento_(valor) {

  const texto =
    limpiarTexto_(valor);

  let corregido = false;
  let numero;

  if (
    typeof valor === "string" &&
    texto.endsWith("%")
  ) {

    numero = convertirNumero_(
      texto.replace("%", "")
    );

    if (numero === null) {

      return {
        valor: null,
        corregido: false
      };
    }

    numero = numero / 100;
    corregido = true;

  } else {

    numero =
      convertirNumero_(valor);

    if (numero === null) {

      return {
        valor: null,
        corregido: false
      };
    }

    if (
      numero > 1 &&
      numero <= 100
    ) {

      numero = numero / 100;
      corregido = true;
    }
  }

  if (
    numero < 0 ||
    numero > 1
  ) {

    return {
      valor: null,
      corregido: corregido
    };
  }

  return {
    valor: numero,
    corregido: corregido
  };
}


// ======================================================
// NORMALIZAR ESTADO
// ======================================================

function normalizarEstado_(valor) {

  const estado =
    normalizarTexto_(valor);

  const equivalencias = {
    "completada": "Completed",
    "completado": "Completed",
    "entregado": "Completed",
    "entregada": "Completed",
    "completed": "Completed",

    "cancelado": "Cancelled",
    "cancelada": "Cancelled",
    "cancelled": "Cancelled",
    "canceled": "Cancelled",

    "pendiente": "Pending",
    "pending": "Pending"
  };

  return equivalencias[estado] ||
    limpiarTexto_(valor);
}


// ======================================================
// FUNCIONES AUXILIARES
// ======================================================

function buscarHoja_(
  libro,
  nombreBuscado
) {

  const nombreNormalizado =
    normalizarTexto_(nombreBuscado);

  const hojas =
    libro.getSheets();

  for (
    let i = 0;
    i < hojas.length;
    i++
  ) {

    if (
      normalizarTexto_(
        hojas[i].getName()
      ) === nombreNormalizado
    ) {
      return hojas[i];
    }
  }

  return null;
}


function filaVacia_(fila) {

  return fila.every(
    function(valor) {

      return limpiarTexto_(valor) === "";
    }
  );
}


function limpiarTexto_(valor) {

  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  return String(valor).trim();
}


function normalizarCodigo_(valor) {

  return limpiarTexto_(valor)
    .toUpperCase();
}


function normalizarTexto_(valor) {

  return limpiarTexto_(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}


function normalizarEncabezado_(valor) {

  return normalizarTexto_(valor)
    .replace(
      /[^a-z0-9]/g,
      ""
    );
}


function redondear_(
  numero,
  decimales
) {

  const factor =
    Math.pow(10, decimales);

  return Math.round(
    (
      numero +
      Number.EPSILON
    ) * factor
  ) / factor;
}