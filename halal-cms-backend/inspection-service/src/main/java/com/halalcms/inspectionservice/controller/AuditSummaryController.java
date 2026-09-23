package com.halalcms.inspectionservice.controller;

import com.halalcms.inspectionservice.model.AuditReportSummary;
import com.halalcms.inspectionservice.service.AuditSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/audit-summary")
@RequiredArgsConstructor
@Slf4j
public class AuditSummaryController {

    private final AuditSummaryService auditSummaryService;

    @PostMapping("/{auditId}/draft")
    public ResponseEntity<AuditReportSummary> saveDraft(
        @PathVariable Long auditId,
        @RequestBody Map<String, String> request,
        Authentication auth
    ) {
        log.info("POST /api/audit-summary/{}/draft", auditId);
        Long userId = extractUserId(auth);
        String mainAuditorSummary = request.get("mainAuditorSummary");
        String shariaSummary = request.get("shariaSummary");

        AuditReportSummary result = auditSummaryService.saveDraft(auditId, mainAuditorSummary, shariaSummary, userId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{auditId}/submit")
    public ResponseEntity<AuditReportSummary> submitSummary(
        @PathVariable Long auditId,
        @RequestBody Map<String, Object> request,
        Authentication auth
    ) {
        log.info("POST /api/audit-summary/{}/submit", auditId);
        Long userId = extractUserId(auth);
        String mainAuditorSummary = (String) request.get("mainAuditorSummary");
        String shariaSummary = (String) request.get("shariaSummary");
        String compliedProducts = (String) request.get("compliedProducts");
        String nonCompliedProducts = (String) request.get("nonCompliedProducts");

        AuditReportSummary result = auditSummaryService.submitSummary(
            auditId, mainAuditorSummary, shariaSummary, compliedProducts, nonCompliedProducts, userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{auditId}")
    public ResponseEntity<AuditReportSummary> getAuditSummary(@PathVariable Long auditId) {
        log.info("GET /api/audit-summary/{}", auditId);
        AuditReportSummary result = auditSummaryService.getAuditSummary(auditId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{auditId}/check-ncs")
    public ResponseEntity<Map<String, Boolean>> checkNCsCleared(@PathVariable Long auditId) {
        log.info("GET /api/audit-summary/{}/check-ncs", auditId);
        boolean allCleared = auditSummaryService.areAllNCsCleared(auditId);
        return ResponseEntity.ok(Map.of("allNCsCleared", allCleared));
    }

    private Long extractUserId(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof String) {
            return Long.parseLong(auth.getPrincipal().toString());
        }
        return 1L;
    }
}
