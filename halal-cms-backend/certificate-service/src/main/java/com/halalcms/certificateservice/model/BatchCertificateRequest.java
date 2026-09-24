package com.halalcms.certificateservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "batch_certificate_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchCertificateRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_number", nullable = false, unique = true, length = 50)
    private String requestNumber;

    @Column(name = "company_id", nullable = false, length = 36)
    private String companyId;

    @Column(name = "factory_id", nullable = false, length = 36)
    private String factoryId;

    @Column(name = "factory_certificate_id", nullable = false)
    private Long factoryCertificateId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "factory_cert_number", length = 50)
    private String factoryCertNumber;

    @Column(name = "factory_cert_valid_from")
    private LocalDate factoryCertValidFrom;

    @Column(name = "factory_cert_valid_to")
    private LocalDate factoryCertValidTo;

    @Column(name = "producer_name", length = 255)
    private String producerName;

    @Column(name = "producer_phone", length = 50)
    private String producerPhone;

    @Column(name = "producer_email", length = 255)
    private String producerEmail;

    @Column(name = "producer_contact", length = 255)
    private String producerContact;

    @Column(name = "importer_name", length = 255)
    private String importerName;

    @Column(name = "importer_country", length = 100)
    private String importerCountry;

    @Column(name = "importer_contact", length = 255)
    private String importerContact;

    @Column(name = "exporter_name", length = 255)
    private String exporterName;

    @Column(name = "exporter_country", length = 100)
    private String exporterCountry;

    @Column(name = "exporter_contact", length = 255)
    private String exporterContact;

    @Column(name = "shipment_date")
    private LocalDate shipmentDate;

    @Column(name = "shipment_reference", length = 100)
    private String shipmentReference;

    @Column(name = "origin_country", length = 100)
    private String originCountry;

    @Column(name = "destination_country", length = 100)
    private String destinationCountry;

    @Column(name = "products_json", columnDefinition = "TEXT", nullable = false)
    private String productsJson;

    @Column(name = "total_weight_kg", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalWeightKg;

    @Column(name = "unit_price_per_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPricePerKg;

    @Column(name = "total_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalFee;

    @Column(name = "currency", length = 10)
    @Builder.Default
    private String currency = "MYR";

    @Column(name = "payment_status", nullable = false, length = 30)
    @Builder.Default
    private String paymentStatus = "PENDING";

    @Column(name = "amount_owed", precision = 12, scale = 2)
    private BigDecimal amountOwed;

    @Column(name = "documents_json", columnDefinition = "TEXT")
    private String documentsJson;

    @Column(name = "assigned_admin_id", length = 36)
    private String assignedAdminId;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejected_by", length = 100)
    private String rejectedBy;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "certificate_number", length = 50)
    private String certificateNumber;

    @Column(name = "certificate_template_id")
    private Long certificateTemplateId;

    @Column(name = "approved_template_snapshot", columnDefinition = "TEXT")
    private String approvedTemplateSnapshot;

    @Column(name = "qr_code_data", columnDefinition = "TEXT")
    private String qrCodeData;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @Column(name = "pdf_generated_at")
    private LocalDateTime pdfGeneratedAt;

    @Column(name = "notification_sent_at")
    private LocalDateTime notificationSentAt;
}
