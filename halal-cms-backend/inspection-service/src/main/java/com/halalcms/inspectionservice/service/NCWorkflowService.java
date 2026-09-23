package com.halalcms.inspectionservice.service;

import com.halalcms.inspectionservice.dto.NCEvidenceDto;
import com.halalcms.inspectionservice.dto.NCWorkflowDto;
import com.halalcms.inspectionservice.model.NCEvidence;
import com.halalcms.inspectionservice.model.NonConformity;
import com.halalcms.inspectionservice.repository.NCEvidenceRepository;
import com.halalcms.inspectionservice.repository.NonConformityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NCWorkflowService {

    private final NonConformityRepository nonConformityRepository;
    private final NCEvidenceRepository ncEvidenceRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final WorkflowLogService workflowLogService;

    public NonConformity submitCorrectiveAction(Long ncId, NCWorkflowDto.SubmitCorrectiveActionRequest request, Long customerId) {
        log.info("Customer {} submitting corrective action for NC {}", customerId, ncId);

        NonConformity nc = nonConformityRepository.findById(ncId)
            .orElseThrow(() -> new RuntimeException("NC not found: " + ncId));

        nc.setCustomerCorrectiveAction(request.getCorrectiveAction());
        nc.setCustomerDueDate(request.getDueDate());
        nc.setStatus("PENDING_EVIDENCE");
        NonConformity updated = nonConformityRepository.save(nc);

        workflowLogService.logAction(
            nc.getApplicationId(),
            "NC",
            ncId,
            "CORRECTIVE_ACTION_SUBMITTED",
            "Customer submitted corrective action with due date: " + request.getDueDate(),
            customerId
        );

        notificationService.notifyAuditor(
            nc.getAuditorId(),
            "NC_CORRECTIVE_ACTION_SUBMITTED",
            "NC #" + ncId + " has corrective action submitted",
            "/audits/" + nc.getApplicationId() + "/ncs/" + ncId
        );

        emailService.sendEmail(
            "auditor@hcb.com",
            "NC Corrective Action Submitted",
            "NC_CORRECTIVE_ACTION_SUBMITTED",
            ncId
        );

        return updated;
    }

    public NCEvidenceDto submitEvidence(Long ncId, NCWorkflowDto.SubmitEvidenceRequest request, Long customerId) {
        log.info("Customer {} submitting evidence for NC {}", customerId, ncId);

        NonConformity nc = nonConformityRepository.findById(ncId)
            .orElseThrow(() -> new RuntimeException("NC not found: " + ncId));

        Integer nextSubmissionNumber = ncEvidenceRepository.findMaxSubmissionNumber(ncId)
            .map(max -> max + 1)
            .orElse(1);

        NCEvidence evidence = NCEvidence.builder()
            .ncId(ncId)
            .submissionNumber(nextSubmissionNumber)
            .evidenceText(request.getEvidenceText())
            .evidenceFiles(convertFilesToJson(request.getEvidenceFiles()))
            .submittedBy(customerId)
            .auditorReviewStatus("PENDING")
            .build();

        NCEvidence saved = ncEvidenceRepository.save(evidence);

        nc.setStatus("PENDING_AUDITOR_REVIEW");
        nonConformityRepository.save(nc);

        workflowLogService.logAction(
            nc.getApplicationId(),
            "NC_EVIDENCE",
            saved.getId(),
            "EVIDENCE_SUBMITTED",
            "Evidence submission #" + nextSubmissionNumber,
            customerId
        );

        notificationService.notifyAuditor(
            nc.getAuditorId(),
            "NC_EVIDENCE_SUBMITTED",
            "Evidence submitted for NC #" + ncId,
            "/audits/" + nc.getApplicationId() + "/ncs/" + ncId
        );

        emailService.sendEmail(
            "auditor@hcb.com",
            "NC Evidence Submitted",
            "NC_EVIDENCE_SUBMITTED",
            ncId
        );

        return mapToDto(saved);
    }

    public NCEvidenceDto reviewEvidence(Long ncId, NCWorkflowDto.AuditorReviewRequest request, Long auditorId) {
        log.info("Auditor {} reviewing evidence for NC {}", auditorId, ncId);

        NonConformity nc = nonConformityRepository.findById(ncId)
            .orElseThrow(() -> new RuntimeException("NC not found: " + ncId));

        List<NCEvidence> allEvidence = ncEvidenceRepository.findByNcIdOrderBySubmissionNumberDesc(ncId);
        if (allEvidence.isEmpty()) {
            throw new RuntimeException("No evidence found for NC: " + ncId);
        }

        NCEvidence latestEvidence = allEvidence.get(0);
        latestEvidence.setAuditorReviewStatus(request.getDecision());
        latestEvidence.setAuditorFeedback(request.getFeedback());
        latestEvidence.setReviewedBy(auditorId);
        latestEvidence.setReviewedAt(LocalDateTime.now());

        NCEvidence updated = ncEvidenceRepository.save(latestEvidence);

        if ("APPROVED".equals(request.getDecision())) {
            nc.setStatus("APPROVED");
            nc.setIsCleared(true);
            nc.setClearedAt(LocalDateTime.now());

            notificationService.notifyCustomer(
                nc.getApplicationId(),
                "NC_APPROVED",
                "NC #" + ncId + " approved!",
                "/applications/" + nc.getApplicationId() + "/ncs"
            );

            emailService.sendEmail(
                "customer@factory.com",
                "NC Approved",
                "NC_APPROVED",
                ncId
            );
        } else if ("REJECTED".equals(request.getDecision())) {
            nc.setStatus("REJECTED");

            notificationService.notifyCustomer(
                nc.getApplicationId(),
                "NC_REJECTED",
                "NC #" + ncId + " requires resubmission",
                "/applications/" + nc.getApplicationId() + "/ncs"
            );

            emailService.sendEmail(
                "customer@factory.com",
                "NC Rejected - Resubmission Required",
                "NC_REJECTED",
                ncId
            );
        }

        nonConformityRepository.save(nc);

        workflowLogService.logAction(
            nc.getApplicationId(),
            "NC_EVIDENCE",
            updated.getId(),
            "EVIDENCE_REVIEWED",
            "Decision: " + request.getDecision() + ". Feedback: " + request.getFeedback(),
            auditorId
        );

        return mapToDto(updated);
    }

    public NCWorkflowDto.NCWorkflowStatusResponse getNCWorkflowStatus(Long ncId) {
        NonConformity nc = nonConformityRepository.findById(ncId)
            .orElseThrow(() -> new RuntimeException("NC not found: " + ncId));

        List<NCEvidence> evidenceList = ncEvidenceRepository.findByNcIdOrderBySubmissionNumberDesc(ncId);

        return NCWorkflowDto.NCWorkflowStatusResponse.builder()
            .ncId(ncId)
            .currentStatus(nc.getStatus())
            .correctiveAction(nc.getCustomerCorrectiveAction())
            .dueDate(nc.getCustomerDueDate())
            .evidenceSubmissions(evidenceList.stream().map(this::mapToDto).collect(Collectors.toList()))
            .currentIteration(evidenceList.isEmpty() ? 0 : evidenceList.get(0).getSubmissionNumber())
            .build();
    }

    public List<NCWorkflowDto.NCWorkflowStatusResponse> getApplicationNCWorkflows(Long applicationId) {
        List<NonConformity> ncs = nonConformityRepository.findByApplicationId(applicationId);
        return ncs.stream()
            .map(nc -> getNCWorkflowStatus(nc.getId()))
            .collect(Collectors.toList());
    }

    private NCEvidenceDto mapToDto(NCEvidence evidence) {
        return NCEvidenceDto.builder()
            .id(evidence.getId())
            .ncId(evidence.getNcId())
            .submissionNumber(evidence.getSubmissionNumber())
            .evidenceText(evidence.getEvidenceText())
            .auditorReviewStatus(evidence.getAuditorReviewStatus())
            .auditorFeedback(evidence.getAuditorFeedback())
            .submittedAt(evidence.getSubmittedAt())
            .reviewedAt(evidence.getReviewedAt())
            .build();
    }

    private String convertFilesToJson(List<String> files) {
        if (files == null || files.isEmpty()) {
            return "[]";
        }
        return files.toString();
    }
}
