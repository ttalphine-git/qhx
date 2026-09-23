package com.halalcms.applicationservice.controller;

import com.halalcms.applicationservice.client.CompanyServiceClient;
import com.halalcms.applicationservice.dto.*;
import com.halalcms.applicationservice.model.Application;
import com.halalcms.applicationservice.model.ApplicationStatus;
import com.halalcms.applicationservice.repository.ApplicationRepository;
import com.halalcms.applicationservice.service.ApplicationService;
import com.halalcms.applicationservice.service.AuditReportService;
import com.halalcms.applicationservice.service.DocumentService;
import com.halalcms.applicationservice.service.FindingsService;
import com.halalcms.applicationservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final AuditReportService auditReportService;
    private final DocumentService documentService;
    private final PaymentService paymentService;
    private final ApplicationRepository applicationRepository;
    private final CompanyServiceClient companyServiceClient;
    private final FindingsService findingsService;

    @GetMapping
    public ResponseEntity<ApplicationsPageableDTO> list(
            @RequestParam(required = false) String statuses,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        String userId = (String) authentication.getPrincipal();
        String role = extractRole(authentication);

        ApplicationsPageableDTO result = applicationService.list(statuses, search, page, size, userId, role);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/small")
    public ResponseEntity<List<ApplicationSmallResponseDTO>> listSmall() {
        return ResponseEntity.ok(applicationService.listSmall());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ApplicationResponseDTO> create(
            @RequestBody(required = false) Map<String, Object> payload,
            Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        ApplicationResponseDTO created = applicationService.create(userId, payload != null ? payload : Map.of());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApplicationResponseDTO> updateStatus(
            @PathVariable Long id,
            @RequestBody String status) {
        // Strip surrounding quotes if sent as plain JSON string
        String cleaned = status.trim().replace("\"", "");
        ApplicationStatus newStatus;
        try {
            newStatus = ApplicationStatus.valueOf(cleaned);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + cleaned);
        }
        return ResponseEntity.ok(applicationService.updateStatus(id, newStatus));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        applicationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/personal")
    public ResponseEntity<CompanyInformationDTO> getPersonalInfo(@PathVariable Long id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Application not found with id: " + id));

        CompanyInformationDTO.CompanyInformationDTOBuilder builder = CompanyInformationDTO.builder()
                .companyName(application.getCompanyName() != null ? application.getCompanyName() : "")
                .registrationNumber("")
                .address("")
                .city("")
                .country(application.getCountry() != null ? application.getCountry() : "")
                .phone("")
                .email("")
                .website("")
                .industry("")
                .companyType("")
                .businessLicenseNo("")
                .licenseExpiry("")
                .issuingAuthority("")
                .vatSstNo("");

        CompanyServiceClient.CompanyDto company = null;

        // Try to fetch company by companyId first
        if (application.getCompanyId() != null) {
            company = companyServiceClient.getCompany(application.getCompanyId());
        }

        // If companyId not available or not found, try to fetch by userId
        if (company == null && application.getUserId() != null) {
            company = companyServiceClient.getCompanyByUserId(application.getUserId());
        }

        if (company != null) {
            builder
                .registrationNumber(company.getRegistrationNumber() != null ? company.getRegistrationNumber() : "")
                .companyName(company.getName() != null ? company.getName() : application.getCompanyName())
                .address(company.getAddress() != null ? company.getAddress() : "")
                .city(company.getCity() != null ? company.getCity() : "")
                .country(company.getCountry() != null ? company.getCountry() : application.getCountry())
                .phone(company.getPhone() != null ? company.getPhone() : "")
                .email(company.getEmail() != null ? company.getEmail() : "")
                .website(company.getWebsite() != null ? company.getWebsite() : "")
                .companyType(company.getBusinessType() != null ? company.getBusinessType() : "")
                .businessLicenseNo(company.getLicenseNo() != null ? company.getLicenseNo() : "")
                .licenseExpiry(company.getLicenseExpiry() != null ? company.getLicenseExpiry() : "")
                .issuingAuthority(company.getIssuingAuthority() != null ? company.getIssuingAuthority() : "")
                .vatSstNo(company.getVatNo() != null && !company.getVatNo().isEmpty() ? company.getVatNo() : (company.getSstNo() != null ? company.getSstNo() : ""));
        }

        return ResponseEntity.ok(builder.build());
    }

    @GetMapping("/{id}/service-information")
    public ResponseEntity<ServiceInformationDTO> getServiceInformation(@PathVariable Long id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Application not found with id: " + id));

        ServiceInformationDTO dto = ServiceInformationDTO.builder()
                .serviceType(application.getType() != null ? application.getType().name() : "")
                .description("")
                .halalStandard(application.getHalalStandard() != null ? application.getHalalStandard() : "")
                .productCategories(List.of())
                .build();

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/documents")
    public ResponseEntity<UserDocumentsDto> getDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocuments(id));
    }

    @GetMapping("/{id}/payment-status")
    public ResponseEntity<ApplicationPaymentStatusDto> getPaymentStatus(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentStatus(id));
    }

    @PostMapping("/{id}/audit-report")
    public ResponseEntity<?> saveAuditReport(
            @PathVariable Long id,
            @RequestParam(value = "payload") String payloadJson,
            @RequestParam(value = "fileCount", defaultValue = "0") int fileCount,
            @RequestParam(value = "totalFileSize", defaultValue = "0") long totalFileSize,
            @RequestParam(value = "nc-evidence-", required = false) MultipartFile[] ncFiles,
            @RequestParam(value = "obs-evidence-", required = false) MultipartFile[] obsFiles,
            @RequestParam(value = "customer-evidence-", required = false) MultipartFile[] customerFiles,
            @RequestParam(value = "auditor-evidence-", required = false) MultipartFile[] auditorFiles,
            @RequestParam(value = "sharia-evidence-", required = false) MultipartFile[] shariaFiles,
            Authentication authentication) {

        try {
            String userId = (String) authentication.getPrincipal();

            log.info("[Audit Report Save] Application ID: {}, User: {}, Files: {}, Size: {}MB",
                    id, userId, fileCount, totalFileSize / 1024 / 1024);

            // Validate file size
            long maxTotalSize = 500 * 1024 * 1024; // 500MB limit
            if (totalFileSize > maxTotalSize) {
                log.warn("[Audit Report Save] File size exceeds limit: {} > {}", totalFileSize, maxTotalSize);
                return ResponseEntity.badRequest().body(Map.of("message", "Total file size exceeds 500MB limit"));
            }

            // Validate application exists
            Application application = applicationRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

            // Save audit report with files
            Map<String, Object> result = auditReportService.saveAuditReport(
                    id,
                    payloadJson,
                    Map.of(
                            "nc-evidence", ncFiles != null ? ncFiles : new MultipartFile[0],
                            "obs-evidence", obsFiles != null ? obsFiles : new MultipartFile[0],
                            "customer-evidence", customerFiles != null ? customerFiles : new MultipartFile[0],
                            "auditor-evidence", auditorFiles != null ? auditorFiles : new MultipartFile[0],
                            "sharia-evidence", shariaFiles != null ? shariaFiles : new MultipartFile[0]
                    )
            );

            log.info("[Audit Report Save] Successfully saved audit report for application {}", id);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("[Audit Report Save Error] Application ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to save audit report: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/non-conformities")
    public ResponseEntity<?> saveNonConformity(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();

            String questionId = (String) payload.get("questionId");
            String questionText = (String) payload.get("questionText");
            String category = (String) payload.get("category");

            var nc = findingsService.saveNonConformity(id, questionId, questionText, category, payload, userId);
            return ResponseEntity.ok(Map.of("success", true, "id", nc.getId()));

        } catch (Exception e) {
            log.error("[NC Save Error] Application ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to save NC: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/observations")
    public ResponseEntity<?> saveObservation(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();

            String questionId = (String) payload.get("questionId");
            String questionText = (String) payload.get("questionText");
            String category = (String) payload.get("category");

            var obs = findingsService.saveObservation(id, questionId, questionText, category, payload, userId);
            return ResponseEntity.ok(Map.of("success", true, "id", obs.getId()));

        } catch (Exception e) {
            log.error("[Observation Save Error] Application ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to save observation: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/non-conformities")
    public ResponseEntity<?> getNonConformities(@PathVariable Long id) {
        return ResponseEntity.ok(findingsService.getNonConformities(id));
    }

    @GetMapping("/{id}/observations")
    public ResponseEntity<?> getObservations(@PathVariable Long id) {
        return ResponseEntity.ok(findingsService.getObservations(id));
    }

    @DeleteMapping("/{id}/non-conformities/{questionId}")
    public ResponseEntity<?> deleteNonConformity(@PathVariable Long id, @PathVariable String questionId) {
        try {
            findingsService.deleteNonConformity(id, questionId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("[NC Delete Error] Application ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to delete NC"));
        }
    }

    @DeleteMapping("/{id}/observations/{questionId}")
    public ResponseEntity<?> deleteObservation(@PathVariable Long id, @PathVariable String questionId) {
        try {
            findingsService.deleteObservation(id, questionId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("[Observation Delete Error] Application ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to delete observation"));
        }
    }

    private String extractRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("");
    }
}
