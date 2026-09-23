package com.halalcms.inspectionservice.controller;

import com.halalcms.inspectionservice.dto.ApplicationAuditReportDto;
import com.halalcms.inspectionservice.dto.AuditReportConfigurationDto;
import com.halalcms.inspectionservice.service.AuditReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/audits")
@RequiredArgsConstructor
public class AuditReportController {

    private final AuditReportService auditReportService;

    @GetMapping("/report-configurations")
    public ResponseEntity<List<AuditReportConfigurationDto>> getConfigurations() {
        return ResponseEntity.ok(auditReportService.getConfigurations());
    }

    @PutMapping("/report-configurations")
    public ResponseEntity<List<AuditReportConfigurationDto>> saveConfigurations(
            @RequestBody List<AuditReportConfigurationDto> configurations) {
        return ResponseEntity.ok(auditReportService.saveConfigurations(configurations));
    }

    @GetMapping("/report-configurations/by-activity/{activityCategoryKey}")
    public ResponseEntity<AuditReportConfigurationDto> getByActivityCategory(@PathVariable String activityCategoryKey) {
        return ResponseEntity.ok(auditReportService.getByActivityCategory(activityCategoryKey));
    }

    @GetMapping("/reports/application/{applicationId}")
    public ResponseEntity<ApplicationAuditReportDto> getApplicationReport(
            @PathVariable Long applicationId,
            @RequestParam(required = false) String activityCategoryKey) {
        return ResponseEntity.ok(auditReportService.getReportForApplication(applicationId, activityCategoryKey));
    }

    @PutMapping("/reports/application/{applicationId}")
    public ResponseEntity<ApplicationAuditReportDto> saveApplicationReport(
            @PathVariable Long applicationId,
            @RequestBody ApplicationAuditReportDto report) {
        return ResponseEntity.ok(auditReportService.saveReportForApplication(applicationId, report));
    }
}
