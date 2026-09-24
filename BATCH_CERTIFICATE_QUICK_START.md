# Batch Certificate Feature - Quick Start Guide

## What's New

A complete batch certificate request workflow for HalalCMS customers to request batch certificates for factory shipments with automatic fee calculation.

## How It Works

### For Customers

1. **Navigate to Batch Certificates** → New menu option in customer portal
2. **Click "New Request"** → Opens multi-section form
3. **Select Factory** → Must have an ACTIVE factory certificate (auto-validated)
4. **Fill Details**:
   - Producer information (name, phone, email, contact)
   - Optional: Importer and exporter details
   - Shipment details (date, origin, destination)
   - Products with weights (add multiple rows)
5. **See Fee Calculation** → Displays: Weight × Unit Price = Total Fee
   - Example: 100 kg × RM0.50/kg = RM50.00
6. **Submit** → Request created with status PENDING, no payment taken yet
7. **Track Request** → View in "Batch Certificates" list with status updates

### For Admins

1. **Navigate to Admin Panel** → Batch Certificates section (TBD - needs admin page)
2. **Review Pending Requests** → See list of PENDING requests
3. **Approve** → Click approve, optionally add notes → Customer sees APPROVED status
4. **Reject** → Click reject, provide reason → Customer sees REJECTED status
5. **Manage Settings** → Update unit price (RM/kg) for fee calculation

## File Structure Summary

### Backend Files Created (6)

**Database Migrations:**
- `V2__create_batch_certificate_requests.sql` - Main requests table
- `V3__create_batch_certificate_documents.sql` - Document tracking
- `V4__create_batch_certificate_settings.sql` - Configuration

**Java Code:**
- `BatchCertificateRequest.java` (Model)
- `BatchCertificateDocument.java` (Model)
- `BatchCertificateSettings.java` (Model)
- `CreateBatchCertificateRequest.java` (DTO)
- `BatchCertificateRequestDto.java` (DTO)
- `BatchCertificateRequestsPageableDto.java` (DTO)
- `BatchCertificateSettingsDto.java` (DTO)
- `ProductBatchItem.java` (DTO)
- `ApprovalRequestDto.java` (DTO)
- `RejectionRequestDto.java` (DTO)
- `BatchCertificateRequestRepository.java` (Repository)
- `BatchCertificateDocumentRepository.java` (Repository)
- `BatchCertificateSettingsRepository.java` (Repository)
- `BatchCertificateService.java` (Service - 380 lines, comprehensive business logic)
- `BatchCertificateController.java` (REST Controller - 8 endpoints)

### Frontend Files Created (3)

**Customer Pages:**
- `CustomerBatchCertificatesPage.tsx` - List view with tabs and stats
- `CustomerBatchCertificateFormPage.tsx` - Comprehensive request form
- `CustomerBatchCertificateDetailPage.tsx` - Request detail view

**Updated Files:**
- `App.tsx` - Added 3 new routes
- `CustomerLayout.tsx` - Added navigation menu item

## API Endpoints (8 Total)

### Customer Endpoints (4)
- `POST /batch-certificates/request` - Create request
- `GET /batch-certificates/requests` - List requests (paginated)
- `GET /batch-certificates/requests/{id}` - Get request details
- `GET /batch-certificates/settings` - Get fee settings

### Admin Endpoints (4)
- `GET /batch-certificates/admin/requests` - List all requests
- `PATCH /batch-certificates/admin/requests/{id}/approve` - Approve request
- `PATCH /batch-certificates/admin/requests/{id}/reject` - Reject request
- `PATCH /batch-certificates/admin/settings` - Update settings

## Key Features

✅ **Factory Certificate Validation** - Only factories with ACTIVE certificates can apply
✅ **Automatic Fee Calculation** - Weight × Unit Price (configurable)
✅ **No Blocking Payment** - Request submitted without payment, fee tracked separately
✅ **Status Tracking** - PENDING → APPROVED/REJECTED workflow
✅ **Multi-section Form** - Producer, importer, exporter, shipment, products
✅ **Dynamic Product List** - Add/remove product rows, auto-calculates total weight
✅ **Real-time Fee Display** - Shows total fee before submission
✅ **Admin Approval Workflow** - Approve/reject with notes
✅ **Pagination** - All lists support pagination
✅ **Role-based Access** - Customer and Admin endpoints properly secured

## Database Changes

### New Tables (3)
1. **batch_certificate_requests** - Main requests (request_number, factory_id, products, fees, status)
2. **batch_certificate_documents** - Document tracking
3. **batch_certificate_settings** - Global fee configuration (starts with RM0.50/kg)

### Indexes
- company_id, factory_id, user_id, status, payment_status for fast queries

## Testing Checklist

- [ ] Create batch certificate request
  - [ ] Select factory with active certificate
  - [ ] Fill all required fields
  - [ ] Add products with weights
  - [ ] Verify fee calculation (weight × 0.50)
  - [ ] Submit successfully
  
- [ ] View requests list
  - [ ] See PENDING request in list
  - [ ] Stats show correct totals
  - [ ] Pagination works
  
- [ ] View request details
  - [ ] All fields display correctly
  - [ ] Fee calculation shows
  - [ ] Copy button for certificate number works
  
- [ ] Admin operations (TBD - admin UI needed)
  - [ ] Approve request
  - [ ] Reject request with reason
  - [ ] Update settings
  
- [ ] Validation
  - [ ] Can't select factory without active cert
  - [ ] Can't submit without producer name
  - [ ] Can't submit with zero weight
  - [ ] Error messages display clearly

## Frontend Routes

```
/customer/batch-certificates              → List page
/customer/batch-certificates/new          → Create form
/customer/batch-certificates/:id          → Detail page
```

## Important Notes

### Payment Handling
- ⚠️ Fees are calculated and displayed but NOT charged immediately
- Customers see "Amount Owed" but can submit before paying
- Payment integration is SEPARATE from this feature
- Each request tracks `amountOwed` and `paymentStatus`

### Request Numbering
- Format: `BATCH-2026-00001`
- Auto-generated by service (yearly counter)
- Unique per request

### Default Settings
- Unit Price: RM 0.50/kg
- Currency: MYR
- Feature: Enabled

### Validation Rules
- Factory certificate must be ACTIVE
- Producer name required
- At least 1 product with weight required
- Total weight must be > 0
- Shipment date required
- Origin and destination countries required

## Common Questions

**Q: What happens if factory certificate expires after request is created?**
A: Admin approval checks certificate is still ACTIVE - will show error if expired

**Q: Can customer edit request after submitting?**
A: Not in current implementation - would need to add "Edit" button for PENDING status

**Q: When is payment due?**
A: After APPROVAL - payment handling is separate workflow (TBD)

**Q: Can multiple customers share a factory?**
A: Yes - factory_id is stored with request, system manages multi-company scenarios

**Q: What if products exceed safe weight limits?**
A: No validation on max weight currently - can add if needed

## Next Steps for Completion

1. **Admin Pages** - Create admin dashboard for approving/rejecting requests
   - `/office/batch-certificates` - List view
   - `/office/batch-certificates/:id` - Detail/approval page

2. **Document Upload** - Add file upload UI for supporting documents

3. **Email Notifications** - Auto-notify customer on approval/rejection

4. **PDF Generation** - Generate batch certificate PDF on approval

5. **Payment Integration** - Connect to payment gateway

6. **Advanced Search** - Add date range, company filters to admin list

7. **Batch Operations** - Approve/reject multiple requests at once

## Deployment Notes

### Database
Migrations run automatically on application startup (Flyway)
- Ensures `batch_certificate_requests` table exists
- Seeds default settings (RM0.50/kg, enabled)
- Creates indexes for performance

### Configuration
No additional configuration needed beyond standard Spring Boot setup
- Uses existing DataSource
- Uses existing ObjectMapper bean
- Uses existing security configuration

### Backwards Compatibility
- No changes to existing tables
- No changes to existing APIs
- New feature is completely isolated
- Safe to deploy without affecting other features

## Troubleshooting

**Issue:** Factory dropdown is empty
- **Solution:** Ensure factory has an ACTIVE certificate (check status in factories page)

**Issue:** Fee calculation shows 0
- **Solution:** Add products and ensure weight is > 0

**Issue:** Can't submit form
- **Solution:** Check all red asterisk (*) fields are filled and products have weights

**Issue:** 401/403 error on API calls
- **Solution:** Ensure user is logged in with CUSTOMER role

## Architecture Notes

The implementation follows the existing HalalCMS patterns:
- JPA entities with Lombok
- DTOs for request/response
- Service layer for business logic
- Controller with security annotations
- Repository pattern for data access
- Proper transaction management
- Comprehensive validation
- Standard error handling
