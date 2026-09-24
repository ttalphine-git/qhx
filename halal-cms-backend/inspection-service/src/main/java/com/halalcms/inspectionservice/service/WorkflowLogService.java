package com.halalcms.inspectionservice.service;

import com.halalcms.inspectionservice.model.WorkflowLog;
import com.halalcms.inspectionservice.repository.WorkflowLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WorkflowLogService {

    private final WorkflowLogRepository workflowLogRepository;
    private final ObjectMapper objectMapper;

    public void logAction(Long applicationId, String entityType, Long entityId, String action, String description, Long performedBy) {
        logAction(applicationId, entityType, entityId, action, description, performedBy, null, null);
    }

    public void logAction(Long applicationId, String entityType, Long entityId, String action, String description,
                         Long performedBy, String oldStatus, String newStatus) {
        WorkflowLog workflowLog = WorkflowLog.builder()
            .applicationId(applicationId)
            .entityType(entityType)
            .entityId(entityId)
            .actionType(action)
            .actionDescription(description)
            .performedByUserId(performedBy != null ? String.valueOf(performedBy) : null)
            .oldStatus(oldStatus)
            .newStatus(newStatus)
            .createdAt(LocalDateTime.now())
            .build();

        workflowLogRepository.save(workflowLog);
        log.debug("Workflow action logged - App: {}, Entity: {}, Action: {} by User: {}",
            applicationId, entityType, action, performedBy);
    }

    public void logNCStatusChange(Long ncId, String oldStatus, String newStatus, Long performedBy) {
        logAction(null, "NC", ncId, "STATUS_CHANGED",
            "Status changed from " + oldStatus + " to " + newStatus, performedBy, oldStatus, newStatus);
        log.info("NC status changed from {} to {} for NC: {}", oldStatus, newStatus, ncId);
    }

    public void logEvidenceReview(Long evidenceId, String decision, String feedback, Long auditorId) {
        String description = "Decision: " + decision + (feedback != null ? " - Feedback: " + feedback : "");
        logAction(null, "NC_EVIDENCE", evidenceId, "EVIDENCE_REVIEWED", description, auditorId);
        log.info("Evidence reviewed - Evidence: {}, Decision: {}, Auditor: {}", evidenceId, decision, auditorId);
    }

    public void logAuditSummarySubmitted(Long auditId, Long submittedBy) {
        logAction(null, "AUDIT", auditId, "SUMMARY_SUBMITTED",
            "Audit summary submitted", submittedBy, "DRAFT", "SUBMITTED");
        log.info("Audit summary submitted - Audit: {}, Submitted By: {}", auditId, submittedBy);
    }

    public void logDecisionMade(Long requestId, String decision, Long decidedBy) {
        logAction(null, "DECISION_REQUEST", requestId, "DECISION_MADE",
            "Decision: " + decision, decidedBy, "PENDING", decision);
        log.info("Decision made - Request: {}, Decision: {}, Decided By: {}", requestId, decision, decidedBy);
    }

    public void logCertificateApproved(Long certificateId, Long approvedBy) {
        logAction(null, "CERTIFICATE", certificateId, "APPROVED",
            "Certificate approved for issuance", approvedBy, "GENERATED", "APPROVED");
        log.info("Certificate approved - Certificate: {}, Approved By: {}", certificateId, approvedBy);
    }

    public void logCertificateSent(Long certificateId, String email) {
        logAction(null, "CERTIFICATE", certificateId, "SENT",
            "Certificate sent to: " + email, null, "APPROVED", "SENT");
        log.info("Certificate sent - Certificate: {}, Email: {}", certificateId, email);
    }

    public void logNCEvidenceSubmitted(Long ncId, Long evidenceId, Long submittedBy) {
        String description = "Evidence submitted for NC - Evidence ID: " + evidenceId;
        logAction(null, "NC", ncId, "EVIDENCE_SUBMITTED", description, submittedBy, "PENDING_CUSTOMER_ACTION", "PENDING_EVIDENCE");
        log.info("NC evidence submitted - NC: {}, Evidence: {}, Submitted By: {}", ncId, evidenceId, submittedBy);
    }

    public void logAuditStarted(Long auditId, Long applicationId, Long startedBy) {
        logAction(applicationId, "AUDIT", auditId, "STARTED", "Audit started", startedBy, "SCHEDULED", "IN_PROGRESS");
        log.info("Audit started - Application: {}, Audit: {}, Started By: {}", applicationId, auditId, startedBy);
    }

    public void logAuditCompleted(Long auditId, Long applicationId, Long completedBy) {
        logAction(applicationId, "AUDIT", auditId, "COMPLETED", "Audit completed", completedBy, "IN_PROGRESS", "COMPLETED");
        log.info("Audit completed - Application: {}, Audit: {}, Completed By: {}", applicationId, auditId, completedBy);
    }
}
