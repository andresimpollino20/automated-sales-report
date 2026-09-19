# Consolidated Data Dictionary

| Field | Description | Expected type |
|---|---|---|
| `Sale_ID` | Unique transaction identifier | Text |
| `Date` | Transaction date | Date |
| `Customer_Code` | Customer master key | Text |
| `Customer_Name` | Customer display name | Text |
| `Product_Code` | Product master key | Text |
| `Product_Name` | Product display name | Text |
| `Category` | Standardized product category | Text |
| `Channel` | Commercial sales channel | Text |
| `Sales_Representative` | Salesperson assigned to the transaction | Text |
| `Province` | Customer or transaction province | Text |
| `Quantity` | Units sold | Integer |
| `Unit_Price` | Price per unit | Decimal / currency |
| `Discount_Percentage` | Applied discount rate | Decimal / percentage |
| `Total_Amount` | Net transaction amount | Decimal / currency |
| `Status` | Transaction state | Text |
| `Source_File` | Monthly file from which the row was read | Text |
| `Month` | Reporting month derived from the transaction | Date / month |
| `Validation_Result` | Final validation status | Text |

## Error-log fields

| Field | Description |
|---|---|
| `Process_Date` | Timestamp of the refresh run |
| `File` | Source file containing the issue |
| `Source_Row` | Original row number |
| `Sale_ID` | Transaction identifier, when available |
| `Field` | Field that triggered the validation |
| `Original_Value` | Value received from the source |
| `Type` | Error or warning |
| `Action` | Rejection or correction applied |

