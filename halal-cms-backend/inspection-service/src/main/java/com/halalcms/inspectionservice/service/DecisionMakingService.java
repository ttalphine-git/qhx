package com.halalcms.inspectionservice.service;

import com.halalcms.inspectionservice.model.DecisionRequest;
import com.halalcms.inspectionservice.repository.DecisionRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DecisionMakingService {

    private final DecisionRequestRepository decisionRequestRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final WorkflowLogService workflowLogService;
    private final CertificateGenerationService certificateGenerationService;

    public DecisionRequest assignDecisionRequest(Long auditId, Long applicationId, Long assignedTo, String decisionType) {
        log.info("Assigning decision request for audit {} to user {} - Type: {}", auditId, assignedTo, decisionType);

        DecisionRequest request = DecisionRequest.builder()
            .auditId(auditId)
            .applicationId(applicationId)
            .assignedTo(assignedTo)
            .decisionType(decisionType)
            .status("PENDING")
            .build();

        DecisionRequest saved = decisionRequestRepository.save(request);

        notificationService.notifyDecisionMaker(assignedTo, "DECISION_REQUEST_ASSIGNED",
            "You have a new " + decisionType + " decision request",
            "/audits/" + auditId + "/decisions");

        emailService.sendDecisionAssignmentEmail("user@hcb.com", auditId, decisionType);

        return saved;
    }

    public DecisionRequest submitDecision(Long requestId, String decision, String reasoning, String conditions, Long decidedBy) {
        log.info("Submitting decision for request {} - Decision: {}", requestId, decision);

        DecisionRequest request = decisionRequestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Decision request not found: " + requestId));

        request.setDecisionValue(decision);
        request.setDecisionText(reasoning);
        request.setConditions(conditions);
        request.setDecidedBy(decidedBy);
        request.setDecidedAt(LocalDateTime.now());
        request.setStatus("COMPLETED");

        DecisionRequest updated = decisionRequestRepository.save(request);

        workflowLogService.logDecisionMade(requestId, decision, decidedBy);

        // Check if all decisions for this audit are complete
        List<DecisionRequest> allRequests = decisionRequestRepository.findByAuditId(request.getAuditId());
        boolean allComplete = allRequests.stream().allMatch(r -> "COMPLETED".equals(r.getStatus()));

        if (allComplete) {
            // Check if all approvals - if yes, generate certificate
            boolean allApproved = allRequests.stream()
                .allMatch(r -> "APPROVED".equals(r.getDecisionValue()));

            if (allApproved) {
                notificationService.notifyAdmin("ALL_DECISIONS_APPROVED",
                    "All decisions approved for audit #" + request.getAuditId(),
                    "/audits/" + request.getAuditId() + "/certificate");

                certificateGenerationService.generateCertificate(request.getAuditId(), request.getApplicationId());
            } else {
                notificationService.notifyAdmin("SOME_DECISIONS_REJECTED",
                    "Some decisions rejected for audit #" + request.getAuditId(),
                    "/audits/" + request.getAuditId() + "/decisions");
            }
        }

        return updated;
    }

    public List<DecisionRequest> getDecisionRequestsForUser(Long userId) {
        return decisionRequestRepository.findByAssignedToAndStatus(userId, "PENDING");
    }

    public List<DecisionRequest> getAuditDecisions(Long auditId) {
        return decisionRequestRepository.findByAuditId(auditId);
    }

    public DecisionRequest getDecisionRequest(Long requestId) {
        return decisionRequestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Decision request not found: " + requestId));
    }

    public boolean areAllDecisionsComplete(Long auditId) {
        List<DecisionRequest> requests = decisionRequestRepository.findByAuditId(auditId);
        return !requests.isEmpty() && requests.stream().allMatch(r -> "COMPLETED".equals(r.getStatus()));
    }
}
