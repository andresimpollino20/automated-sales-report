# Apps Script Source

[`Code.gs`](Code.gs) contains the complete automation used by the project.

The script:

- creates the **Automation → Update report** menu;
- reads operational references from the `Configuracion` sheet;
- loads customer and product master data;
- processes the 12 monthly sales files;
- standardizes headers, text, dates, numbers, discounts, and statuses;
- validates identifiers and business rules;
- separates rejected records from recoverable warnings;
- writes the consolidated base, error log, and load-control table;
- updates the successful-refresh timestamp.

Operational file and folder IDs are intentionally not embedded in the source code. They remain in the private spreadsheet configuration.
