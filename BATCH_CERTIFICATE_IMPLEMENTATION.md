# Batch Certificate Feature Implementation

## Overview
Complete batch certificate flow for HalalCMS allowing customers to request batch certificates for factory shipments with automatic fee calculation based on weight.

## Features Implemented

### 1. Backend (Java/Spring Boot)

#### Database Migrations
- `V2__create_batch_certificate_requests.sql` - Main batch requests table with all shipment details
- `V3__create_batch_certificate_documents.sql` - Supporting documents tracking
- `V4__create_batch_certificate_settings.sql` - Global settings for fee configuration

#### Models
- `BatchCertificateRequest` - Main entity with all request details
- `BatchCertificateDocument` - Document tracking entity
- `BatchCertificateSettings` - Fee settings entity

#### DTOs
- `CreateBatchCertificateRequest` - Request creation payload with validation
- `BatchCertificateRequestDto` - Response DTO with all fields
- `BatchCertificateRequestsPageableDto` - Paginated responses
- `BatchCertificateSettingsDto` - Settings DTO
- `ProductBatchItem` - Product line item
- `ApprovalRequestDto` - Approval request payload
- `RejectionRequestDto` - Rejection request payload

#### Repositories
- `BatchCertificateRequestRepository` - JPA repository with custom queries
- `BatchCertificateDocumentRepository` - Document repository
- `BatchCertificateSettingsRepository` - Settings repository

#### Service
- `BatchCertificateService` - Core business logic including:
  - Batch request creation with validation
  - Factory certificate validation
  - Fee calculation (weight × unit price)
  - Admin approval/rejection workflows
  - Settings management

#### Controller
- `BatchCertificateController` - REST endpoints:
  - POST `/batch-certificates/request` - Create batch request
  - GET `/batch-certificates/requests` - List customer requests (paginated)
  - GET `/batch-certificates/requests/{id}` - Get request details
  - GET `/batch-certificates/settings` - Get current settings
  - PATCH `/batch-certificates/admin/requests/{id}/approve` - Admin approval
  - PATCH `/batch-certificates/admin/requests/{id}/reject` - Admin rejection
  - GET `/batch-certificates/admin/requests` - Admin list view
  - PATCH `/batch-certificates/admin/settings` - Update settings

### 2. Frontend (React/TypeScript)

#### Customer Pages
- `CustomerBatchCertificatesPage.tsx` - Main list view with tabs (pending, approved, rejected)
  - Stats cards showing totals and amounts owed
  - Pagination
  - Status indicators with icons
  - Navigation to detail pages

- `CustomerBatchCertificateFormPage.tsx` - Comprehensive request form
  - Factory selection (filtered to factories with active certificates only)
  - Producer information section
  - Optional importer/exporter information
  - Shipment details (dates, countries, references)
  - Dynamic product table with add/remove rows
  - Real-time fee calculation display
  - Validation before submission
  - Success/error messaging

- `CustomerBatchCertificateDetailPage.tsx` - Request detail view
  - Full request information displayed in sections
  - Status badges with color coding
  - Approval/rejection details with timestamps
  - Product list with totals
  - Fee summary with payment status
  - Copy-to-clipboard for certificate numbers

#### Routing
Added to `App.tsx`:
```
/customer/batch-certificates - List page
/customer/batch-certificates/new - Create form
/customer/batch-certificates/:id - Detail page
```

#### Navigation
Added "Batch Certificates" link to `CustomerLayout` navigation menu

## Key Business Logic

### Fee Calculation
```
Total Fee = Total Weight (kg) × Unit Price Per Kg
Example: 100 kg × RM 0.50/kg = RM 50.00
```

### Payment Handling
- Fee is calculated and displayed at submission
- Customer sees amount owed but is NOT charged immediately
- Payment status is tracked as "PENDING" until payment is made
- Request submission is NOT blocked by payment status
- Payment is handled separately after approval

### Factory Certificate Validation
- Only factories with ACTIVE certificates can submit batch requests
- Certificate status is validated at submission time
- Certificate expiry dates are displayed for reference
- Admin approval checks certificate is still ACTIVE

### Request Status Workflow
1. **PENDING** - Customer submitted, awaiting admin review
2. **APPROVED** - Admin approved the request, customer knows fee is confirmed
3. **REJECTED** - Admin rejected with reason, customer can resubmit

### Fee Settings
- Default unit price: RM 0.50/kg
- Settings can be updated by admin
- Fees are denormalized on request (audit trail of what was charged)

## Database Schema

### batch_certificate_requests
- Request identification (request_number, company_id, factory_id, user_id)
- Factory certificate linking (factory_certificate_id with FK)
- Producer/Importer/Exporter details
- Shipment information (dates, countries, references)
- Products (stored as JSON)
- Weight and fee calculations
- Payment tracking
- Admin workflow fields (assignment, notes, approval/rejection)
- Timestamps

### batch_certificate_documents
- Document linking to batch requests
- Document type, filename, URL storage
- Upload timestamp tracking

### batch_certificate_settings
- Single row table for global configuration
- Unit price per kg (configurable by admin)
- Currency (default MYR)
- Feature enable/disable flag

## API Contracts

### Request Creation
```json
POST /batch-certificates/request
{
  "factoryId": "uuid",
  "factoryCertificateId": 123,
  "producerName": "Company Name",
  "producerPhone": "+60123456789",
  "producerEmail": "producer@example.com",
  "producerContact": "John Doe",
  "shipmentDate": "2026-09-24",
  "originCountry": "Malaysia",
  "destinationCountry": "Singapore",
  "products": [
    {
      "sku": "PROD-001",
      "name": "Halal Chicken",
      "weightKg": 100.00,
      "unit": "kg"
    }
  ],
  "totalWeightKg": 100.00
}

Response: 201 Created
{
  "id": 1,
  "requestNumber": "BATCH-2026-00001",
  "status": "PENDING",
  "totalFee": 50.00,
  "amountOwed": 50.00,
  "paymentStatus": "PENDING"
}
```

### Request List (Customer)
```
GET /batch-certificates/requests?status=PENDING&page=0&size=20

Response: 200 OK
{
  "content": [{ ...request objects... }],
  "totalElements": 42,
  "totalPages": 3,
  "page": 0,
  "size": 20
}
```

### Admin Approval
```json
PATCH /batch-certificates/admin/requests/{id}/approve
{
  "notes": "All documents verified and complete"
}

Response: 200 OK
{
  "id": 1,
  "status": "APPROVED",
  "approvedAt": "2026-09-24T10:30:00Z",
  "approvedBy": "admin@example.com"
}
```

### Admin Rejection
```json
PATCH /batch-certificates/admin/requests/{id}/reject
{
  "reason": "Missing required export documentation"
}

Response: 200 OK
{
  "id": 1,
  "status": "REJECTED",
  "rejectionReason": "Missing required export documentation",
  "rejectedAt": "2026-09-24T10:30:00Z"
}
```

### Settings
```
GET /batch-certificates/settings

Response: 200 OK
{
  "id": 1,
  "unitPricePerKg": 0.50,
  "currency": "MYR",
  "featureEnabled": true,
  "updatedAt": "2026-09-24T10:30:00Z"
}

PATCH /batch-certificates/admin/settings
{
  "unitPricePerKg": 0.75,
  "featureEnabled": true
}

Response: 200 OK
{
  "id": 1,
  "unitPricePerKg": 0.75,
  "currency": "MYR",
  "featureEnabled": true,
  "updatedAt": "2026-09-24T10:31:00Z",
  "updatedBy": "admin@example.com"
}
```

## Security & Permissions

### Customer Endpoints
- Requires `CUSTOMER` role
- Customers can only view their own requests
- User ID extracted from authentication context

### Admin Endpoints
- Requires one of: `OFFICE_ADMIN`, `OFFICE_OFFICER`, `OFFICE_MANAGER`, `SUPER_ADMIN`
- Can view all requests
- Can approve/reject requests
- Can update settings

### Input Validation
- Factory certificate must exist and be ACTIVE
- Producer name required
- At least one product with weight required
- Shipment date required
- Countries required
- Total weight must be > 0

## Testing Considerations

### Happy Path
1. Customer logs in
2. Navigates to "Batch Certificates"
3. Clicks "New Request"
4. Selects factory with active certificate
5. Fills all required fields
6. Adds products with weights
7. Sees fee calculation (weight × unit price)
8. Submits request
9. Receives confirmation and request number
10. Views request in list with PENDING status
11. Admin approves request
12. Customer sees APPROVED status

### Edge Cases
- Factory with no active certificates (error shown)
- Zero weight products (prevented)
- Missing required fields (validation)
- Admin updates settings while request in draft
- Certificate expires after request created (admin checks on approval)
- Multiple products with mixed weights

## File Locations

### Backend
```
halal-cms-backend/
├── certificate-service/
│   ├── src/main/java/com/halalcms/certificateservice/
│   │   ├── model/
│   │   │   ├── BatchCertificateRequest.java
│   │   │   ├── BatchCertificateDocument.java
│   │   │   └── BatchCertificateSettings.java
│   │   ├── dto/
│   │   │   ├── CreateBatchCertificateRequest.java
│   │   │   ├── BatchCertificateRequestDto.java
│   │   │   ├── BatchCertificateRequestsPageableDto.java
│   │   │   ├── BatchCertificateSettingsDto.java
│   │   │   ├── ProductBatchItem.java
│   │   │   ├── ApprovalRequestDto.java
│   │   │   └── RejectionRequestDto.java
│   │   ├── repository/
│   │   │   ├── BatchCertificateRequestRepository.java
│   │   │   ├── BatchCertificateDocumentRepository.java
│   │   │   └── BatchCertificateSettingsRepository.java
│   │   ├── service/
│   │   │   └── BatchCertificateService.java
│   │   └── controller/
│   │       └── BatchCertificateController.java
│   └── src/main/resources/db/migration/
│       ├── V2__create_batch_certificate_requests.sql
│       ├── V3__create_batch_certificate_documents.sql
│       └── V4__create_batch_certificate_settings.sql
```

### Frontend
```
halal-cms-frontend/
└── src/
    ├── pages/customer/
    │   ├── CustomerBatchCertificatesPage.tsx
    │   ├── CustomerBatchCertificateFormPage.tsx
    │   └── CustomerBatchCertificateDetailPage.tsx
    └── App.tsx (updated with routes)
```

## Next Steps (Future Enhancements)

1. **Document Upload** - Add file upload for supporting documents
2. **Payment Integration** - Connect to payment gateway for actual payment processing
3. **Certificate Generation** - Auto-generate batch certificate PDF on approval
4. **Notifications** - Email notifications on approval/rejection
5. **Audit Logging** - Enhanced audit trail for compliance
6. **Batch Operations** - Admin ability to approve/reject multiple requests at once
7. **Export/Print** - PDF export and printing of batch certificate requests
8. **Search/Filter** - Advanced search and filtering by date range, company, status
9. **SLA Tracking** - Track approval SLA and show metrics
10. **Recurring Batches** - Option to create recurring batch certificate requests

## Migration Notes

The database migrations use Flyway version control. Run migrations through your application startup process:

```bash
# Migrations run automatically on application startup
# Or manually with:
mvn flyway:migrate
```

Initial settings record is automatically seeded on first migration.

## Performance Considerations

- Batch requests indexed by: company_id, factory_id, user_id, status, payment_status
- Products and documents stored as JSON (denormalized for flexibility)
- Pagination enforced (20 items/page default)
- Request number generation uses current year to keep numbers manageable

## Known Limitations

1. Payment is not processed automatically - integration with payment system needed
2. No file upload UI for supporting documents yet
3. No email notifications integrated
4. No batch PDF generation yet
5. Admin list doesn't support filtering by company name yet
