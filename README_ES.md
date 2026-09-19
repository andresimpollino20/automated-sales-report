# Reporte Automatizado de Ventas y Calidad de Datos

Solución integral desarrollada con **Google Sheets, Google Drive y Google Apps Script**. El proyecto automatiza la consolidación de archivos mensuales de ventas, valida la calidad de los datos, registra inconsistencias y actualiza un dashboard ejecutivo interactivo.

## Objetivo

Reemplazar un proceso manual y repetitivo por un flujo controlado capaz de consolidar 12 archivos mensuales, normalizar formatos, validar clientes y productos, eliminar duplicados, registrar errores y actualizar automáticamente los indicadores comerciales.

## Dashboard interactivo

[Abrir el dashboard en Google Sheets](https://docs.google.com/spreadsheets/d/1THt9u8sw1mRxW28qljmpSoeEN-kNSqSmX-nY9JkyBPI/edit)

![Vista previa del dashboard](images/dashboard.png)

## Resultados principales

| Indicador | Resultado |
|---|---:|
| Ventas totales | $129.753.436,60 |
| Unidades vendidas | 29.129 |
| Clientes únicos | 93 |
| Transacciones completadas | 2.605 |
| Registros leídos | 3.840 |
| Registros válidos cargados | 3.835 |
| Registros rechazados | 5 |
| Advertencias registradas | 4 |
| Archivos procesados | 12 |

## Flujo de trabajo

1. El usuario coloca cada archivo mensual en la carpeta configurada de Google Drive.
2. El menú personalizado ejecuta `actualizarReporte()`.
3. Apps Script lee los archivos mensuales y los maestros de clientes y productos.
4. El proceso normaliza campos, valida reglas, elimina duplicados y recalcula totales inconsistentes.
5. Los registros válidos se cargan en `Base_Consolidada`.
6. Los errores y las correcciones se documentan en `Errores` y `Control_Carga`.
7. El dashboard se actualiza automáticamente.

## Herramientas

- Google Sheets
- Google Drive
- Google Apps Script
- Fórmulas, gráficos y validación de datos

## Nota de privacidad

La versión pública debe utilizar datos de muestra anonimizados. No se deben publicar IDs de carpetas, IDs de archivos maestros, nombres de clientes ni archivos operativos reales.

La documentación principal en inglés se encuentra en [README.md](README.md).

