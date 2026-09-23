package com.halalcms.inspectionservice.controller;

import com.halalcms.inspectionservice.dto.ApplicationAuditResponse;
import com.halalcms.inspectionservice.dto.AuditPlanRequest;
import com.halalcms.inspectionservice.service.AuditPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/audit-plans")
@RequiredArgsConstructor
public class AuditPlanController {

    private final AuditPlanService auditPlanService;

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<ApplicationAuditResponse> getByApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(auditPlanService.getByApplication(applicationId));
    }

    @PutMapping("/application/{applicationId}")
    public ResponseEntity<ApplicationAuditResponse> saveForApplication(
            @PathVariable Long applicationId,
            @RequestBody AuditPlanRequest req) {
        return ResponseEntity.ok(auditPlanService.saveForApplication(applicationId, req));
    }
}
