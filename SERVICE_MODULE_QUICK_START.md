# SERVICE MODULE - QUICK START GUIDE

## 🚀 Getting Started

### Access the Service Module
1. Login to AGS-ERP application
2. From sidebar menu → Click **Service** (Wrench icon)
3. You'll see the Service List page with all existing services

---

## 📋 COMMON WORKFLOWS

### Workflow 1: Create a New Service

**Step 1: Open Service Creation Form**
- Click "New Service" button at top of Service List
- You'll be taken to `/service/create`

**Step 2: Fill Service Details**
1. **Entry Details**
   - Entry Date (today's date by default)
   - Expected Delivery Date (when customer expects service to be ready)

2. **Customer Selection**
   - Select customer from dropdown
   - Contact person and phone auto-fill from customer master

3. **Device/Asset Selection**
   - If customer has existing assets, they appear in dropdown
   - Select asset OR manually enter device details
   - Device type, brand, model, serial number auto-fill from asset if selected

4. **Accessories Received**
   - Check boxes for accessories received with the device
   - Options: Power Adapter, Power Cable, USB Cable, Mouse, Keyboard, Remote, Charger, Other

5. **Service Details**
   - Enter customer complaint (what's wrong with the device)
   - Select priority (Low, Medium, High, Urgent)
   - Select service type (Chargeable Service or AMC Service)
   - Optional: Add remarks

6. **Submit**
   - Click "Create Service" button
   - Service number auto-generates (SV000001, SV000002, etc.)
   - You'll see success message with service number
   - Auto-redirected to service detail page

---

### Workflow 2: Track Service Progress

**Step 1: Open Service Detail**
- Click on service number in list view
- You'll see complete service information

**Step 2: Monitor Status Timeline**
- "Status Timeline" section shows all status changes
- Original "Received" status displayed with timestamp

**Step 3: Update Service Information**
- Click "Edit" button to enter edit mode
- Editable fields: Contact person, phone, complaint, diagnosis, work done, remarks
- Click "Save" to update

**Step 4: Change Service Status**
- "Status Change" section shows available next statuses
- Current workflow states:
  - **Received** → Service received and logged
  - **Inspection** → Initial inspection in progress
  - **Approved** → Device approved for repair/service
  - **In Service** → Work started (⚠️ Spares stock deducted at this point)
  - **Waiting for Spare** → Waiting for spare part arrival
  - **Ready for Delivery** → Service completed, ready to give to customer
  - **Delivered** → Service delivered to customer
  - **Closed** → Service completed and payment received
  - **Cancelled** → Service cancelled by customer/system

---

### Workflow 3: Add Spares/Materials to Service

**Step 1: Navigate to Service Detail**
- Open service detail page

**Step 2: Add Spare**
- Scroll to "Spares/Materials" section
- Click "Add Spare" button
- Select product from inventory
- Enter quantity
- Enter rate (auto-calculates total with GST)

**Step 3: How Spares Work**
- Each spare shows: Product Name, Quantity, Rate, Total Amount
- Spare charge auto-added to service charges
- When service status changes to "In Service", product stock is automatically deducted
- If service cancelled, stock is automatically restored

**Step 4: Modify or Remove Spares**
- Click "Edit" on spare row to modify quantity/rate
- Click "Remove" to delete spare (automatically restores stock if already deducted)

---

### Workflow 4: Process Payment

**Step 1: Navigate to Payment Section**
- Scroll to "Service Charges" section in detail view
- Shows: Grand Total, Paid Amount, Balance Amount

**Step 2: Record Payment**
- Click "Record Payment" button
- Enter payment date
- Enter payment amount (can be partial payment)
- Select payment mode (Cash, Cheque, Bank Transfer, Card, UPI, Other)
- Optional: Enter reference number or remarks
- Click "Record Payment"

**Step 3: Payment Status Tracking**
- **Unpaid**: No payments made yet (balance = grand total)
- **Partially Paid**: Some payment made (balance > 0)
- **Paid**: Full payment received (balance = 0)

**Step 4: View Payment History**
- All payments shown in "Payments" table
- Each payment shows: Date, Amount, Mode, Reference, Received By

---

### Workflow 5: Deliver Service to Customer

**Step 1: Mark Service as Ready**
- Change service status to "Ready for Delivery"

**Step 2: Click Deliver Button**
- "Deliver" button appears when status is "Ready for Delivery"
- Click to enter delivery information

**Step 3: Enter Delivery Details**
- Delivered To (customer name/representative)
- Delivered By (technician name)
- Customer Acknowledgement (any remarks)
- System auto-sets actual delivery date

**Step 4: Service Status Transitions**
- Status changes to "Delivered"
- Service challan can be printed with actual_delivery_date

---

### Workflow 6: Print Service Challan/Job Card

**Step 1: Navigate to Service Detail**
- Open service you want to print

**Step 2: Options**
- **View Challan**: Click "📄 View Challan" to see printable preview
- **Print Challan**: Click "🖨️ Print Challan" to open in print dialog

**Step 3: Challan Contents**
The job card includes:
- Company header (AGS details)
- Service number, dates, status
- Customer information (company, contact, phone, address)
- Device information (type, brand, model, serial)
- Accessories received
- Service details (complaint, diagnosis, work done, remarks)
- Spares used table
- Charges breakdown (labour, spare, other, discount, GST, grand total)
- Payment status
- Signature lines for: Received By, Technician, Delivered By

**Step 4: Print**
- Use Ctrl+P to print to PDF or paper
- Optimized for A4 paper size
- Professional layout with company branding

---

## 🔍 FILTERING & SEARCHING

### List View Filters
- **Customer Filter**: Select specific customer to view their services only
- **Device Type Filter**: Filter by device type (Computer, Laptop, Mobile, etc.)
- **Status Filter**: Show only services in specific status
- **Assigned Technician Filter**: Show services assigned to specific technician
- **Search Field**: Search by:
  - Service number (SV000001)
  - Serial number of device
  - Customer phone number
  - Customer company name

### Pagination
- Default: 20 services per page
- Navigate with pagination controls at bottom of list
- Shows: "Showing X of Y services"

---

## 💰 FINANCIAL CALCULATIONS (Automatic)

### Grand Total Calculation
```
Labour Charge:      ₹500
Spare Charge:       ₹2,500  (sum of all spare total amounts)
Other Charge:       ₹100
Discount:          -₹100
_____________
Taxable Amount:     ₹3,000

GST (18%):          ₹540
_____________
Grand Total:        ₹3,540

Paid Amount:        ₹2,000
Balance:            ₹1,540
```

### Spare Calculation
```
Quantity:           2
Rate per unit:      ₹1,500
Discount:           ₹100
_____________
Subtotal:           ₹2,900
GST (18%):          ₹522
_____________
Total:              ₹3,422
```

---

## ⚠️ IMPORTANT NOTES

### Stock Deduction (Automatic)
- ❌ Stock is **NOT** deducted when spare is added
- ✅ Stock is **deducted** when service status changes to "In Service"
- ✅ Stock is **restored** if service is cancelled or deleted
- ✅ Each deduction recorded with timestamp for audit trail

### Status Restrictions
- ❌ Cannot edit service if status is "Delivered" or "Closed"
- ✅ Can change status from any state to "Cancelled"
- ✅ Service must be "Ready for Delivery" before clicking "Deliver"

### Customer & Asset Handling
- ✅ No duplicate customer records created
- ✅ Service references existing Customer master
- ✅ Asset can be existing or new device details inline
- ✅ Multiple services can reference same asset

### Payment Handling
- ✅ Can record multiple partial payments
- ✅ Amount per payment must not exceed grand total
- ✅ Payment status auto-updates (Unpaid → Partially Paid → Paid)
- ✅ No payment editing (can only add new payments)

---

## 🔧 TECHNICIAN ASSIGNMENT

### Assigning Technician
- Optional during service creation
- Can be updated by selecting technician from user dropdown
- Technician information shown in detail view
- Can filter service list by assigned technician

---

## 📊 VIEWING SERVICE HISTORY

### Status History
- Click service detail → "Status Timeline" section
- Shows every status change with:
  - Old status → New status
  - Date and time of change
  - User who made change
  - Any remarks

### Payment History
- Shows all payments in chronological order
- Each entry: Date, Amount, Mode, Reference, Received By

---

## 🛠️ TROUBLESHOOTING

**Problem**: Service number not generating
- Solution: Service number auto-generates on save. Refresh if needed.

**Problem**: Stock not deducting when service created
- Solution: Stock deducts only when service status changes to "In Service"

**Problem**: Cannot delete service
- Solution: Cannot delete Delivered or Closed services. These must be archived.

**Problem**: Cannot edit service
- Solution: Cannot edit services with status "Delivered" or "Closed"

**Problem**: Spare product not appearing
- Solution: Ensure product exists in Product master and is not deleted

**Problem**: Customer details not auto-filling
- Solution: Ensure customer is properly created with contact details

---

## 📞 SUPPORT

For issues or questions:
1. Check this guide for common workflows
2. Review service detail page help tooltips
3. Contact system administrator if needed

---

**SERVICE MODULE v1.0 - Ready for Production** ✅
