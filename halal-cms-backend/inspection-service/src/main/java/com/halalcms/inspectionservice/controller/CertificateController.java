package com.halalcms.inspectionservice.controller;

import com.halalcms.inspectionservice.service.CertificateGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
@Slf4j
public class CertificateController {

    private final CertificateGenerationService certificateGenerationService;

    @PostMapping("/generate/{auditId}")
    public ResponseEntity<Map<String, String>> generateCertificate(
        @PathVariable Long auditId,
        @RequestBody Map<String, Long> request
    ) {
        log.info("POST /api/certificates/generate/{}", auditId);
        Long applicationId = request.getOrDefault("applicationId", auditId);
        certificateGenerationService.generateCertificate(auditId, applicationId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("message", "Certificate generated successfully", "auditId", String.valueOf(auditId)));
    }

    @PostMapping("/{certificateId}/approve")
    public ResponseEntity<Map<String, String>> approveCertificate(
        @PathVariable Long certificateId,
        @RequestBody Map<String, String> request,
        Authentication auth
    ) {
        log.info("POST /api/certificates/{}/approve", certificateId);
        Long approvedBy = extractUserId(auth);
        String approvalNotes = request.get("approvalNotes");

        certificateGenerationService.approveCertificate(certificateId, approvalNotes, approvedBy);
        return ResponseEntity.ok(Map.of("message", "Certificate approved successfully"));
    }

    @PostMapping("/{certificateId}/send")
    public ResponseEntity<Map<String, String>> sendCertificate(
        @PathVariable Long certificateId,
        @RequestBody Map<String, Object> request
    ) {
        log.info("POST /api/certificates/{}/send", certificateId);
        String customerEmail = (String) request.get("customerEmail");
        Long applicationId = ((Number) request.getOrDefault("applicationId", 0L)).longValue();

        certificateGenerationService.sendCertificate(certificateId, customerEmail, applicationId);
        return ResponseEntity.ok(Map.of("message", "Certificate sent successfully"));
    }

    private Long extractUserId(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof String) {
            return Long.parseLong(auth.getPrincipal().toString());
        }
        return 1L;
    }
}
