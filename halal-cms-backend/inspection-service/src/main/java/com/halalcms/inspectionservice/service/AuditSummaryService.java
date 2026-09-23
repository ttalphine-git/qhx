package com.halalcms.inspectionservice.service;

import com.halalcms.inspectionservice.model.AuditReportSummary;
import com.halalcms.inspectionservice.repository.AuditReportSummaryRepository;
import com.halalcms.inspectionservice.repository.NonConformityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuditSummaryService {

    private final AuditReportSummaryRepository auditReportSummaryRepository;
    private final NonConformityRepository nonConformityRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final WorkflowLogService workflowLogService;

    public AuditReportSummary saveDraft(Long auditId, String mainAuditorSummary, String shariaSummary, Long userId) {
        log.info("Saving audit summary draft for audit {}", auditId);

        Optional<AuditReportSummary> existing = auditReportSummaryRepository.findByAuditId(auditId);

        AuditReportSummary summary = existing.orElseGet(() -> AuditReportSummary.builder()
            .auditId(auditId)
            .build());

        summary.setMainAuditorSummary(mainAuditorSummary);
        summary.setShariaSummary(shariaSummary);
        summary.setStatus("DRAFT");

        return auditReportSummaryRepository.save(summary);
    }

    public AuditReportSummary submitSummary(Long auditId, String mainAuditorSummary, String shariaSummary,
                                            String compliedProductsJson, String nonCompliedProductsJson, Long submittedBy) {
        log.info("Submitting audit summary for audit {}", auditId);

        Optional<AuditReportSummary> existing = auditReportSummaryRepository.findByAuditId(auditId);

        AuditReportSummary summary = existing.orElseGet(() -> AuditReportSummary.builder()
            .auditId(auditId)
            .build());

        summary.setMainAuditorSummary(mainAuditorSummary);
        summary.setShariaSummary(shariaSummary);
        summary.setCompliedProducts(compliedProductsJson);
        summary.setNonCompliedProducts(nonCompliedProductsJson);
        summary.setSubmittedBy(submittedBy);
        summary.setSubmittedAt(LocalDateTime.now());
        summary.setStatus("SUBMITTED");

        AuditReportSummary saved = auditReportSummaryRepository.save(summary);

        workflowLogService.logAuditSummarySubmitted(auditId, submittedBy);

        notificationService.notifyAdmin("AUDIT_SUMMARY_SUBMITTED",
            "Audit #" + auditId + " summary submitted",
            "/audits/" + auditId + "/summary");

        emailService.sendEmail("admin@hcb.com", "Audit Summary Submitted", "AUDIT_SUMMARY_SUBMITTED", auditId);

        return saved;
    }

    public AuditReportSummary getAuditSummary(Long auditId) {
        return auditReportSummaryRepository.findByAuditId(auditId)
            .orElseThrow(() -> new RuntimeException("Audit summary not found for audit: " + auditId));
    }

    public boolean isAuditSummarySubmitted(Long auditId) {
        return auditReportSummaryRepository.findByAuditId(auditId)
            .map(s -> "SUBMITTED".equals(s.getStatus()))
            .orElse(false);
    }

    public boolean areAllNCsCleared(Long auditId) {
        long totalNCs = nonConformityRepository.countByApplicationId(auditId);
        if (totalNCs == 0) return true;

        long clearedNCs = nonConformityRepository.countByApplicationIdAndIsCleared(auditId, true);
        return totalNCs == clearedNCs;
    }
}
