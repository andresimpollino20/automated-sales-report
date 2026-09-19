# Portfolio Presentation Guide

## One-line summary

I developed an automated sales-reporting pipeline in Google Sheets and Apps Script that consolidates monthly files, validates data quality, logs processing issues, and refreshes an interactive executive dashboard.

## 45-second interview pitch

The original reporting process depended on manually combining monthly files and correcting inconsistencies before updating the dashboard. I replaced that workflow with a Google Apps Script automation connected to Google Drive. The script standardizes the source files, validates transactions against customer and product masters, rejects critical errors, corrects recoverable issues, and creates an audit trail. The result is a single-view Google Sheets dashboard with commercial KPIs, trends, category and channel analysis, product rankings, and data-quality indicators. In the project dataset, the solution processed 3,840 source rows across 12 files and loaded 3,835 validated records.

## Problem, action, result

### Problem

Monthly sales reporting was repetitive, error-prone, and difficult to audit because the source files could contain inconsistent headers, formats, duplicates, invalid dates, and master-data mismatches.

### Action

- Designed a configuration-driven ingestion process.
- Built validation and normalization rules in Apps Script.
- Created separate consolidated, error-log, and load-control outputs.
- Built an interactive one-view dashboard in Google Sheets.
- Added English presentation labels while preserving the source-language data model.

### Result

- 12 monthly files processed in one controlled refresh.
- 3,835 valid rows consolidated.
- Five critical records rejected before reaching the dashboard.
- Four recoverable issues corrected and logged.
- A reusable workflow that reduces manual manipulation and improves traceability.

## Suggested portfolio card

**Title:** Automated Sales Reporting & Data Quality Pipeline  
**Tools:** Google Sheets · Google Apps Script · Google Drive  
**Description:** Automated the consolidation and validation of monthly sales files and built an interactive executive dashboard with audit-ready error and load controls.

## Recommended screenshots

1. Full dashboard in its default `All` filter state.
2. Dashboard with one filter combination applied.
3. `Control_Carga` showing the 12 processed files.
4. `Errores` showing examples of rejected and corrected records.

Do not include folder IDs, master-file IDs, or identifiable customer data in public screenshots.

