package com.halalcms.certificateservice.controller;

import com.halalcms.certificateservice.dto.*;
import com.halalcms.certificateservice.service.BatchCertificateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/batch-certificates")
@RequiredArgsConstructor
public class BatchCertificateController {

    private final BatchCertificateService batchCertificateService;

    @PostMapping("/request")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BatchCertificateRequestDto> createBatchRequest(
            @Valid @RequestBody CreateBatchCertificateRequest req,
            Authentication auth) {

        String userId = auth.getName();
        String companyId = extractCompanyId(auth);

        BatchCertificateRequestDto created = batchCertificateService.createBatchCertificateRequest(
                userId,
                companyId,
                req);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/requests")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BatchCertificateRequestsPageableDto> getCustomerRequests(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {

        String userId = auth.getName();

        BatchCertificateRequestsPageableDto result =
                batchCertificateService.getCustomerBatchRequests(userId, status, page, size);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/requests/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BatchCertificateRequestDto> getBatchRequest(@PathVariable Long id) {
        BatchCertificateRequestDto result = batchCertificateService.getBatchRequest(id);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/settings")
    public ResponseEntity<BatchCertificateSettingsDto> getSettings() {
        BatchCertificateSettingsDto settings = batchCertificateService.getSettings();
        return ResponseEntity.ok(settings);
    }

    @PatchMapping("/admin/requests/{id}/approve")
    @PreAuthorize("hasAnyRole('OFFICE_ADMIN', 'OFFICE_OFFICER', 'OFFICE_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<BatchCertificateRequestDto> approveBatchRequest(
            @PathVariable Long id,
            @RequestBody ApprovalRequestDto approvalReq,
            Authentication auth) {

        String adminId = auth.getName();

        BatchCertificateRequestDto result = batchCertificateService.approveBatchRequest(
                id,
                adminId,
                approvalReq.getNotes());

        return ResponseEntity.ok(result);
    }

    @PatchMapping("/admin/requests/{id}/reject")
    @PreAuthorize("hasAnyRole('OFFICE_ADMIN', 'OFFICE_OFFICER', 'OFFICE_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<BatchCertificateRequestDto> rejectBatchRequest(
            @PathVariable Long id,
            @RequestBody RejectionRequestDto rejectionReq,
            Authentication auth) {

        String adminId = auth.getName();

        BatchCertificateRequestDto result = batchCertificateService.rejectBatchRequest(
                id,
                adminId,
                rejectionReq.getReason());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/admin/requests")
    @PreAuthorize("hasAnyRole('OFFICE_ADMIN', 'OFFICE_OFFICER', 'OFFICE_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<BatchCertificateRequestsPageableDto> getAdminRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        BatchCertificateRequestsPageableDto result =
                batchCertificateService.getAdminBatchRequests(status, companyId, page, size);

        return ResponseEntity.ok(result);
    }

    @PatchMapping("/admin/settings")
    @PreAuthorize("hasAnyRole('OFFICE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<BatchCertificateSettingsDto> updateSettings(
            @Valid @RequestBody BatchCertificateSettingsDto updateDto,
            Authentication auth) {

        String adminId = auth.getName();

        BatchCertificateSettingsDto result = batchCertificateService.updateSettings(updateDto, adminId);

        return ResponseEntity.ok(result);
    }

    private String extractCompanyId(Authentication auth) {
        Object principal = auth.getPrincipal();
        if (principal instanceof java.util.Map) {
            return ((java.util.Map<?, ?>) principal).get("companyId").toString();
        }
        return null;
    }
}
