# Validation Rules

| Control | Severity | System action |
|---|---|---|
| Blank transaction ID | Error | Reject row |
| Duplicate transaction ID | Error | Reject duplicate row |
| Invalid transaction date | Error | Reject row |
| Invalid or blank quantity | Error | Reject row |
| Unknown customer code | Error | Reject row |
| Unknown product code | Error | Reject row |
| Leading or trailing spaces | Warning | Trim value and load row |
| Non-standard header | Warning | Map header and continue |
| Category inconsistent with product master | Warning | Replace with master value |
| Incorrect total amount | Warning | Recalculate and log correction |

## Amount reconciliation

The expected transaction amount is calculated as:

`Quantity × Unit Price × (1 − Discount Percentage)`

The validated value is used in the consolidated dataset when the source total is inconsistent and all required numeric inputs are valid.

## Reporting filter

Sales KPIs and rankings include only records whose transaction status is `Completed`. Data-quality metrics evaluate the complete ingestion process.

