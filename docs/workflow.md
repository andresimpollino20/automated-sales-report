# Technical Workflow

## Source layer

The solution receives 12 monthly sales files stored in a controlled Google Drive folder. Separate customer and product master spreadsheets provide the reference data required for validation.

## Processing layer

The main Apps Script function, `actualizarReporte()`, performs the following sequence:

1. Reads configuration parameters.
2. Identifies eligible monthly source files.
3. Reads and maps source headers.
4. Standardizes strings, dates, numeric fields, and column names.
5. Checks transaction IDs for blanks and duplicates.
6. Validates customer and product codes against master tables.
7. Corrects recoverable fields such as spacing, headers, categories, and calculated totals.
8. Rejects records containing critical errors.
9. Writes valid rows to the consolidated table.
10. Writes row-level issues to the error log.
11. Writes file-level statistics to the load-control table.
12. Updates the last-refresh timestamp.

## Output layer

| Sheet | Purpose |
|---|---|
| `Dashboard` | Executive KPIs, visualizations, filters, rankings, and data-quality summary |
| `Base_Consolidada` | Standardized transaction-level dataset used by the report |
| `Errores` | Audit trail of rejected records and recoverable corrections |
| `Control_Carga` | File-level counts, status, warnings, and processing date |
| `Configuracion` | Source references, expected sheet names, and refresh timestamp |
| `Documentacion` | In-workbook user and technical documentation |

## Refresh model

The dashboard is formula-driven. After the script replaces the consolidated data, the KPIs, helper tables, charts, and rankings recalculate automatically. Month, channel, and province selectors filter the dashboard without changing the source data.

