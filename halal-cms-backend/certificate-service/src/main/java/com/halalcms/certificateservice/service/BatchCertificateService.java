package com.halalcms.certificateservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.halalcms.certificateservice.dto.*;
import com.halalcms.certificateservice.model.BatchCertificateDocument;
import com.halalcms.certificateservice.model.BatchCertificateRequest;
import com.halalcms.certificateservice.model.BatchCertificateSettings;
import com.halalcms.certificateservice.model.Certificate;
import com.halalcms.certificateservice.repository.BatchCertificateDocumentRepository;
import com.halalcms.certificateservice.repository.BatchCertificateRequestRepository;
import com.halalcms.certificateservice.repository.BatchCertificateSettingsRepository;
import com.halalcms.certificateservice.repository.CertificateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BatchCertificateService {

    private final ObjectMapper objectMapper;
    private final BatchCertificateRequestRepository batchRequestRepository;
    private final BatchCertificateDocumentRepository batchDocumentRepository;
    private final BatchCertificateSettingsRepository batchSettingsRepository;
    private final CertificateRepository certificateRepository;
    private final BatchCertificatePdfService pdfService;
    private final BatchCertificateNotificationService notificationService;

    public BatchCertificateRequestDto createBatchCertificateRequest(
            String userId,
            String companyId,
            CreateBatchCertificateRequest req) {

        // Validate factory certificate exists and is ACTIVE
        Certificate factoryCert = certificateRepository.findById(req.getFactoryCertificateId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Factory certificate not found"));

        if (!"ACTIVE".equals(factoryCert.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Factory certificate must be ACTIVE to request batch certificate");
        }

        // Fetch current settings for unit price
        BatchCertificateSettings settings = getOrCreateDefaultSettings();

        // Calculate total fee
        BigDecimal totalFee = calculateTotalFee(req.getTotalWeightKg(), settings.getUnitPricePerKg());

        // Generate request number
        String requestNumber = generateRequestNumber();

        // Serialize products to JSON
        String productsJson;
        try {
            productsJson = objectMapper.writeValueAsString(req.getProducts());
        } catch (Exception e) {
            log.error("Failed to serialize products", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to process products");
        }

        // Create batch certificate request
        BatchCertificateRequest batchRequest = BatchCertificateRequest.builder()
                .requestNumber(requestNumber)
                .companyId(companyId)
                .factoryId(req.getFactoryId().toString())
                .factoryCertificateId(req.getFactoryCertificateId())
                .userId(userId)
                .status("PENDING")
                .factoryCertNumber(factoryCert.getCertificateNumber())
                .factoryCertValidFrom(factoryCert.getIssueDate())
                .factoryCertValidTo(factoryCert.getExpiryDate())
                .producerName(req.getProducerName())
                .producerPhone(req.getProducerPhone())
                .producerEmail(req.getProducerEmail())
                .producerContact(req.getProducerContact())
                .importerName(req.getImporterName())
                .importerCountry(req.getImporterCountry())
                .importerContact(req.getImporterContact())
                .exporterName(req.getExporterName())
                .exporterCountry(req.getExporterCountry())
                .exporterContact(req.getExporterContact())
                .shipmentDate(req.getShipmentDate())
                .shipmentReference(req.getShipmentReference())
                .originCountry(req.getOriginCountry())
                .destinationCountry(req.getDestinationCountry())
                .productsJson(productsJson)
                .totalWeightKg(req.getTotalWeightKg())
                .unitPricePerKg(settings.getUnitPricePerKg())
                .totalFee(totalFee)
                .currency(settings.getCurrency())
                .paymentStatus("PENDING")
                .amountOwed(totalFee)
                .submittedAt(LocalDateTime.now())
                .build();

        BatchCertificateRequest saved = batchRequestRepository.save(batchRequest);
        log.info("Created batch certificate request: {}", saved.getRequestNumber());

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public BatchCertificateRequestDto getBatchRequest(Long id) {
        BatchCertificateRequest request = batchRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch request not found"));
        return toDto(request);
    }

    @Transactional(readOnly = true)
    public BatchCertificateRequestsPageableDto getCustomerBatchRequests(
            String userId,
            String status,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("submittedAt").descending());
        Page<BatchCertificateRequest> resultPage;

        if (status != null && !status.isEmpty()) {
            resultPage = batchRequestRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            resultPage = batchRequestRepository.findByUserId(userId, pageable);
        }

        List<BatchCertificateRequestDto> content = resultPage.getContent()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return BatchCertificateRequestsPageableDto.builder()
                .content(content)
                .totalElements(resultPage.getTotalElements())
                .totalPages(resultPage.getTotalPages())
                .page(page)
                .size(size)
                .build();
    }

    @Transactional(readOnly = true)
    public BatchCertificateRequestsPageableDto getAdminBatchRequests(
            String status,
            String companyId,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("submittedAt").descending());
        Page<BatchCertificateRequest> resultPage;

        if (status != null && !status.isEmpty()) {
            resultPage = batchRequestRepository.findByStatus(status, pageable);
        } else {
            resultPage = batchRequestRepository.findAll(pageable);
        }

        List<BatchCertificateRequestDto> content = resultPage.getContent()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return BatchCertificateRequestsPageableDto.builder()
                .content(content)
                .totalElements(resultPage.getTotalElements())
                .totalPages(resultPage.getTotalPages())
                .page(page)
                .size(size)
                .build();
    }

    public BatchCertificateRequestDto approveBatchRequest(Long id, String adminId, String adminNotes) {
        BatchCertificateRequest request = batchRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch request not found"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only PENDING requests can be approved");
        }

        // Verify factory certificate is still ACTIVE
        Certificate factoryCert = certificateRepository.findById(request.getFactoryCertificateId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Factory certificate not found"));

        if (!"ACTIVE".equals(factoryCert.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Factory certificate must be ACTIVE to approve batch request");
        }

        request.setStatus("APPROVED");
        request.setApprovedAt(LocalDateTime.now());
        request.setApprovedBy(adminId);
        request.setAdminNotes(adminNotes);

        // Generate certificate number
        String certificateNumber = generateCertificateNumber();
        request.setCertificateNumber(certificateNumber);

        // Generate QR code data
        String qrCodeData = generateQRCodePayload(request, certificateNumber);
        request.setQrCodeData(qrCodeData);

        BatchCertificateRequest saved = batchRequestRepository.save(request);

        // Generate PDF asynchronously
        try {
            generateCertificatePdfAsync(saved);
        } catch (Exception e) {
            log.error("Failed to generate PDF for approved request {}", saved.getRequestNumber(), e);
        }

        // Send notification asynchronously
        notificationService.sendApprovalNotification(saved);

        log.info("Approved batch request: {} with certificate number: {}", saved.getRequestNumber(), certificateNumber);

        return toDto(saved);
    }

    public BatchCertificateRequestDto rejectBatchRequest(
            Long id,
            String adminId,
            String rejectionReason) {

        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Rejection reason is required");
        }

        BatchCertificateRequest request = batchRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch request not found"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only PENDING requests can be rejected");
        }

        request.setStatus("REJECTED");
        request.setRejectedAt(LocalDateTime.now());
        request.setRejectedBy(adminId);
        request.setRejectionReason(rejectionReason);

        BatchCertificateRequest saved = batchRequestRepository.save(request);

        // Send rejection notification asynchronously
        notificationService.sendRejectionNotification(saved);

        log.info("Rejected batch request: {}", saved.getRequestNumber());

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public BatchCertificateSettingsDto getSettings() {
        BatchCertificateSettings settings = getOrCreateDefaultSettings();
        return BatchCertificateSettingsDto.builder()
                .id(settings.getId())
                .unitPricePerKg(settings.getUnitPricePerKg())
                .currency(settings.getCurrency())
                .featureEnabled(settings.getFeatureEnabled())
                .updatedAt(settings.getUpdatedAt())
                .updatedBy(settings.getUpdatedBy())
                .build();
    }

    public BatchCertificateSettingsDto updateSettings(
            BatchCertificateSettingsDto updateDto,
            String adminId) {

        BatchCertificateSettings settings = getOrCreateDefaultSettings();

        if (updateDto.getUnitPricePerKg() != null) {
            settings.setUnitPricePerKg(updateDto.getUnitPricePerKg());
        }

        if (updateDto.getFeatureEnabled() != null) {
            settings.setFeatureEnabled(updateDto.getFeatureEnabled());
        }

        settings.setUpdatedBy(adminId);

        BatchCertificateSettings saved = batchSettingsRepository.save(settings);
        log.info("Updated batch certificate settings by admin: {}", adminId);

        return BatchCertificateSettingsDto.builder()
                .id(saved.getId())
                .unitPricePerKg(saved.getUnitPricePerKg())
                .currency(saved.getCurrency())
                .featureEnabled(saved.getFeatureEnabled())
                .updatedAt(saved.getUpdatedAt())
                .updatedBy(saved.getUpdatedBy())
                .build();
    }

    private BatchCertificateSettings getOrCreateDefaultSettings() {
        return batchSettingsRepository.findById(1L)
                .orElseGet(() -> {
                    BatchCertificateSettings settings = BatchCertificateSettings.builder()
                            .unitPricePerKg(new BigDecimal("0.50"))
                            .currency("MYR")
                            .featureEnabled(true)
                            .updatedBy("SYSTEM")
                            .build();
                    return batchSettingsRepository.save(settings);
                });
    }

    private BigDecimal calculateTotalFee(BigDecimal weightKg, BigDecimal unitPrice) {
        return weightKg.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
    }

    private String generateRequestNumber() {
        int year = java.time.Year.now().getValue();
        String yearPrefix = "BATCH-" + year + "-";

        List<BatchCertificateRequest> existingRequests = batchRequestRepository.findAll();
        int maxNumber = existingRequests.stream()
                .filter(r -> r.getRequestNumber().startsWith(yearPrefix))
                .map(r -> {
                    String suffix = r.getRequestNumber().substring(yearPrefix.length());
                    try {
                        return Integer.parseInt(suffix);
                    } catch (NumberFormatException e) {
                        return 0;
                    }
                })
                .max(Integer::compareTo)
                .orElse(0);

        return String.format("%s%05d", yearPrefix, maxNumber + 1);
    }

    private String generateCertificateNumber() {
        int year = java.time.Year.now().getValue();
        String yearPrefix = "HAFR" + year;

        List<BatchCertificateRequest> existingRequests = batchRequestRepository.findAll();
        int maxNumber = existingRequests.stream()
                .filter(r -> r.getCertificateNumber() != null && r.getCertificateNumber().startsWith(yearPrefix))
                .map(r -> {
                    String suffix = r.getCertificateNumber().substring(yearPrefix.length());
                    try {
                        return Integer.parseInt(suffix);
                    } catch (NumberFormatException e) {
                        return 0;
                    }
                })
                .max(Integer::compareTo)
                .orElse(0);

        return String.format("%s%08d", yearPrefix, maxNumber + 1);
    }

    private String generateQRCodePayload(BatchCertificateRequest request, String certificateNumber) {
        try {
            Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("type", "batch-certificate");
            payload.put("certificateNumber", certificateNumber);
            payload.put("requestNumber", request.getRequestNumber());
            payload.put("companyId", request.getCompanyId());
            payload.put("producerName", request.getProducerName());
            payload.put("shipmentDate", request.getShipmentDate().toString());
            payload.put("totalWeight", request.getTotalWeightKg().toString());
            payload.put("verificationUrl", "https://halal-cms.example.com/verify/" + certificateNumber);

            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to generate QR code payload", e);
            return "";
        }
    }

    private void generateCertificatePdfAsync(BatchCertificateRequest request) {
        try {
            byte[] pdfBytes = pdfService.generateCertificatePdf(request);
            // TODO: Upload to S3/storage and update pdf_url
            // For now, just log success
            request.setPdfGeneratedAt(LocalDateTime.now());
            batchRequestRepository.save(request);
            log.info("PDF generated for certificate: {}", request.getCertificateNumber());
        } catch (Exception e) {
            log.error("Failed to generate PDF for request {}", request.getRequestNumber(), e);
        }
    }

    private BatchCertificateRequestDto toDto(BatchCertificateRequest request) {
        List<ProductBatchItem> products;
        try {
            products = Arrays.asList(objectMapper.readValue(request.getProductsJson(), ProductBatchItem[].class));
        } catch (Exception e) {
            log.warn("Failed to deserialize products for request {}", request.getId());
            products = List.of();
        }

        return BatchCertificateRequestDto.builder()
                .id(request.getId())
                .requestNumber(request.getRequestNumber())
                .status(request.getStatus())
                .companyId(request.getCompanyId())
                .factoryId(java.util.UUID.fromString(request.getFactoryId()))
                .factoryCertificateId(request.getFactoryCertificateId())
                .factoryCertNumber(request.getFactoryCertNumber())
                .factoryCertValidFrom(request.getFactoryCertValidFrom())
                .factoryCertValidTo(request.getFactoryCertValidTo())
                .producerName(request.getProducerName())
                .producerPhone(request.getProducerPhone())
                .producerEmail(request.getProducerEmail())
                .producerContact(request.getProducerContact())
                .importerName(request.getImporterName())
                .importerCountry(request.getImporterCountry())
                .importerContact(request.getImporterContact())
                .exporterName(request.getExporterName())
                .exporterCountry(request.getExporterCountry())
                .exporterContact(request.getExporterContact())
                .shipmentDate(request.getShipmentDate())
                .shipmentReference(request.getShipmentReference())
                .originCountry(request.getOriginCountry())
                .destinationCountry(request.getDestinationCountry())
                .products(products)
                .totalWeightKg(request.getTotalWeightKg())
                .unitPricePerKg(request.getUnitPricePerKg())
                .totalFee(request.getTotalFee())
                .currency(request.getCurrency())
                .paymentStatus(request.getPaymentStatus())
                .amountOwed(request.getAmountOwed())
                .assignedAdminId(request.getAssignedAdminId())
                .adminNotes(request.getAdminNotes())
                .approvedAt(request.getApprovedAt())
                .approvedBy(request.getApprovedBy())
                .rejectionReason(request.getRejectionReason())
                .rejectedAt(request.getRejectedAt())
                .rejectedBy(request.getRejectedBy())
                .submittedAt(request.getSubmittedAt())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}
