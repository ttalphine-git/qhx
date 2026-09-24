package com.halalcms.certificateservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchCertificateRequestDto {
    private Long id;
    private String requestNumber;
    private String status;
    private String companyId;
    private UUID factoryId;
    private Long factoryCertificateId;
    private String factoryCertNumber;
    private LocalDate factoryCertValidFrom;
    private LocalDate factoryCertValidTo;

    private String producerName;
    private String producerPhone;
    private String producerEmail;
    private String producerContact;

    private String importerName;
    private String importerCountry;
    private String importerContact;

    private String exporterName;
    private String exporterCountry;
    private String exporterContact;

    private LocalDate shipmentDate;
    private String shipmentReference;
    private String originCountry;
    private String destinationCountry;

    private List<ProductBatchItem> products;
    private BigDecimal totalWeightKg;

    private BigDecimal unitPricePerKg;
    private BigDecimal totalFee;
    private String currency;

    private String paymentStatus;
    private BigDecimal amountOwed;

    private String assignedAdminId;
    private String adminNotes;
    private LocalDateTime approvedAt;
    private String approvedBy;
    private String rejectionReason;
    private LocalDateTime rejectedAt;
    private String rejectedBy;

    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
