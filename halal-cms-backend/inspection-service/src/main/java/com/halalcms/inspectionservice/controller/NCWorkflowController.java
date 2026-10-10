package com.halalcms.inspectionservice.controller;

import com.halalcms.inspectionservice.dto.NCEvidenceDto;
import com.halalcms.inspectionservice.dto.NCWorkflowDto;
import com.halalcms.inspectionservice.model.NonConformity;
import com.halalcms.inspectionservice.service.NCWorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nc")
@RequiredArgsConstructor
@Slf4j
public class NCWorkflowController {

    private final NCWorkflowService ncWorkflowService;

    @PostMapping("/application/{applicationId}/findings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NonConformity> saveFinding(
        @PathVariable Long applicationId,
        @RequestBody NCWorkflowDto.SaveFindingRequest request,
        Authentication auth
    ) {
        log.info("POST /api/nc/application/{}/findings - User authenticated, saving NC finding", applicationId);
        Long userId = extractUserId(auth);
        NonConformity result = ncWorkflowService.saveFinding(applicationId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/{ncId}/customer-response")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NonConformity> submitCorrectiveAction(
        @PathVariable Long ncId,
        @RequestBody NCWorkflowDto.SubmitCorrectiveActionRequest request,
        Authentication auth
    ) {
        log.info("POST /api/nc/{}/customer-response - User authenticated, submitting corrective action", ncId);
        Long customerId = extractUserId(auth);
        NonConformity result = ncWorkflowService.submitCorrectiveAction(ncId, request, customerId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{ncId}/evidence")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NCEvidenceDto> submitEvidence(
        @PathVariable Long ncId,
        @RequestBody NCWorkflowDto.SubmitEvidenceRequest request,
        Authentication auth
    ) {
        log.info("POST /api/nc/{}/evidence - User authenticated, submitting evidence", ncId);
        Long customerId = extractUserId(auth);
        NCEvidenceDto result = ncWorkflowService.submitEvidence(ncId, request, customerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/{ncId}/auditor-review")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NCEvidenceDto> reviewEvidence(
        @PathVariable Long ncId,
        @RequestBody NCWorkflowDto.AuditorReviewRequest request,
        Authentication auth
    ) {
        log.info("POST /api/nc/{}/auditor-review - User authenticated, reviewing evidence", ncId);
        Long auditorId = extractUserId(auth);
        NCEvidenceDto result = ncWorkflowService.reviewEvidence(ncId, request, auditorId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{ncId}/status")
    public ResponseEntity<NCWorkflowDto.NCWorkflowStatusResponse> getNCStatus(@PathVariable Long ncId) {
        log.info("GET /api/nc/{}/status", ncId);
        NCWorkflowDto.NCWorkflowStatusResponse result = ncWorkflowService.getNCWorkflowStatus(ncId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<List<NCWorkflowDto.NCWorkflowStatusResponse>> getApplicationNCWorkflows(
        @PathVariable Long applicationId
    ) {
        log.info("GET /api/nc/application/{}", applicationId);
        List<NCWorkflowDto.NCWorkflowStatusResponse> result = ncWorkflowService.getApplicationNCWorkflows(applicationId);
        return ResponseEntity.ok(result);
    }

    private Long extractUserId(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof String) {
            return Long.parseLong(auth.getPrincipal().toString());
        }
        return 1L; // Default for development
    }
}
