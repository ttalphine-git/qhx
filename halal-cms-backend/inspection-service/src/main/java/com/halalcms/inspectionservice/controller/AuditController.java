package com.halalcms.inspectionservice.controller;

import com.halalcms.inspectionservice.dto.*;
import com.halalcms.inspectionservice.service.AuditService;
import com.halalcms.inspectionservice.service.NonConformityService;
import com.halalcms.inspectionservice.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/audits")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;
    private final NonConformityService nonConformityService;
    private final RecommendationService recommendationService;

    @GetMapping("/status/{applicationId}")
    public ResponseEntity<AuditStatusResponse> getStatus(@PathVariable Long applicationId) {
        return ResponseEntity.ok(auditService.getStatus(applicationId));
    }

    @PostMapping("/start-f1/{applicationId}")
    public ResponseEntity<ApplicationAuditResponse> startF1(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal String performedBy) {
        return ResponseEntity.ok(auditService.startF1(applicationId, performedBy));
    }

    @PostMapping("/finalize-certification/{applicationId}")
    public ResponseEntity<Void> finalizeCertification(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal String performedBy) {
        auditService.finalizeCertification(applicationId, performedBy);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reject-application/{applicationId}")
    public ResponseEntity<Void> rejectApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal String performedBy) {
        auditService.rejectApplication(applicationId, performedBy);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/non-conformities/application/{applicationId}")
    public ResponseEntity<List<NonConformityResponse>> getNonConformities(@PathVariable Long applicationId) {
        return ResponseEntity.ok(nonConformityService.getByApplication(applicationId));
    }

    @GetMapping("/recommendations/{applicationId}")
    public ResponseEntity<List<RecommendationResponse>> getRecommendations(@PathVariable Long applicationId) {
        return ResponseEntity.ok(recommendationService.getByApplication(applicationId));
    }

    @GetMapping("/eventlogs/{applicationId}")
    public ResponseEntity<EventLogsPageDto> getEventLogs(
            @PathVariable Long applicationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditService.getEventLogs(applicationId, page, size));
    }
}
