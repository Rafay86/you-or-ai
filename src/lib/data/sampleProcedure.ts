/** A fictional procedure for trying the upload flow without a real document. */
export const SAMPLE_PROCEDURE = `Supplier Invoice Approval Procedure

Purpose:
This fictional procedure describes how supplier invoices are checked and paid at Harbor Lane Ltd.

Procedure:
1. The AP Clerk receives each supplier invoice by email and logs it in SAP.
2. The AP Clerk checks the invoice against the purchase order and the goods receipt.
3. If the invoice does not match the purchase order, the AP Clerk returns it to the supplier and notes the reason.
4. The Department Manager approves invoices up to 10,000 in the approval queue.
5. The Finance Controller signs off any invoice above 10,000.
6. The Treasury Officer schedules payment in the weekly payment run.
7. The AP Clerk files the approved invoice in SharePoint.

Exceptions:
Invoices older than 60 days must be escalated to the Finance Controller before payment.

Controls:
All payments above 50,000 require approval from two directors. Payment runs are retained for audit.`;
