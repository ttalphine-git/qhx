package com.halalcms.inspectionservice.service;

import com.halalcms.inspectionservice.dto.*;
import com.halalcms.inspectionservice.model.AuditPlan;
import com.halalcms.inspectionservice.model.AuditStatus;
import com.halalcms.inspectionservice.model.EventLog;
import com.halalcms.inspectionservice.repository.AuditPlanRepository;
import com.halalcms.inspectionservice.repository.AuditStatusRepository;
import com.halalcms.inspectionservice.repository.EventLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditService {

    private final AuditStatusRepository auditStatusRepository;
    private final AuditPlanRepository auditPlanRepository;
    private final EventLogRepository eventLogRepository;

    @Transactional(readOnly = true)
    public AuditStatusResponse getStatus(Long applicationId) {
        return auditStatusRepository.findByApplicationId(applicationId)
                .map(this::toStatusResponse)
                .orElseGet(() -> AuditStatusResponse.builder()
                        .applicationId(applicationId)
                        .currentPhase("SUBMITTED")
                        .f1Started(false)
                        .f1Completed(false)
                        .f2Started(false)
                        .f2Completed(false)
                        .complianceAssigned(false)
                        .certificationFinalized(false)
                        .build());
    }

    public ApplicationAuditResponse startF1(Long applicationId, String performedBy) {
        AuditStatus status = auditStatusRepository.findByApplicationId(applicationId)
                .orElseGet(() -> AuditStatus.builder()
                        .applicationId(applicationId)
                        .build());

        String oldPhase = status.getCurrentPhase();
        status.setF1Started(true);
        status.setCurrentPhase("F1_AUDIT");
        auditStatusRepository.save(status);

        AuditPlan plan = auditPlanRepository.findByApplicationId(applicationId)
                .orElseGet(() -> AuditPlan.builder()
                        .applicationId(applicationId)
                        .status("DRAFT")
                        .build());
        auditPlanRepository.save(plan);

        logEvent(applicationId, "F1_AUDIT_STARTED",
                "F1 audit phase started for application " + applicationId,
                performedBy, oldPhase, "F1_AUDIT");

        return toPlanResponse(plan);
    }

    public void finalizeCertification(Long applicationId, String performedBy) {
        AuditStatus status = auditStatusRepository.findByApplicationId(applicationId)
                .orElseGet(() -> AuditStatus.builder()
                        .applicationId(applicationId)
                        .build());

        String oldPhase = status.getCurrentPhase();
        status.setCertificationFinalized(true);
        status.setCurrentPhase("CERTIFIED");
        auditStatusRepository.save(status);

        logEvent(applicationId, "CERTIFICATION_FINALIZED",
                "Certification finalized for application " + applicationId,
                performedBy, oldPhase, "CERTIFIED");
    }

    public void rejectApplication(Long applicationId, String performedBy) {
        AuditStatus status = auditStatusRepository.findByApplicationId(applicationId)
                .orElseGet(() -> AuditStatus.builder()
                        .applicationId(applicationId)
                        .build());

        String oldPhase = status.getCurrentPhase();
        status.setCurrentPhase("REJECTED");
        auditStatusRepository.save(status);

        logEvent(applicationId, "APPLICATION_REJECTED",
                "Application " + applicationId + " has been rejected",
                performedBy, oldPhase, "REJECTED");
    }

    @Transactional(readOnly = true)
    public EventLogsPageDto getEventLogs(Long applicationId, int page, int size) {
        Page<EventLog> pageResult = eventLogRepository
                .findByApplicationIdOrderByPerformedAtDesc(applicationId, PageRequest.of(page, size));

        List<EventLogDto> content = pageResult.getContent().stream()
                .map(this::toEventLogDto)
                .collect(Collectors.toList());

        return EventLogsPageDto.builder()
                .content(content)
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .build();
    }

    private void logEvent(Long applicationId, String event, String description,
                          String performedBy, String oldStatus, String newStatus) {
        EventLog log = EventLog.builder()
                .applicationId(applicationId)
                .event(event)
                .description(description)
                .performedBy(performedBy)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .build();
        eventLogRepository.save(log);
    }

    private AuditStatusResponse toStatusResponse(AuditStatus s) {
        return AuditStatusResponse.builder()
                .applicationId(s.getApplicationId())
                .currentPhase(s.getCurrentPhase())
                .f1Started(Boolean.TRUE.equals(s.getF1Started()))
                .f1Completed(Boolean.TRUE.equals(s.getF1Completed()))
                .f2Started(Boolean.TRUE.equals(s.getF2Started()))
                .f2Completed(Boolean.TRUE.equals(s.getF2Completed()))
                .complianceAssigned(Boolean.TRUE.equals(s.getComplianceAssigned()))
                .certificationFinalized(Boolean.TRUE.equals(s.getCertificationFinalized()))
                .build();
    }

    private ApplicationAuditResponse toPlanResponse(AuditPlan p) {
        return ApplicationAuditResponse.builder()
                .id(p.getId())
                .applicationId(p.getApplicationId())
                .auditorId(p.getAuditorId())
                .auditorName(p.getAuditorName())
                .scheduledDate(p.getScheduledDate() != null ? p.getScheduledDate().toString() : null)
                .durationDays(p.getDurationDays())
                .scope(p.getScope())
                .status(p.getStatus())
                .build();
    }

    private EventLogDto toEventLogDto(EventLog e) {
        return EventLogDto.builder()
                .id(e.getId())
                .applicationId(e.getApplicationId())
                .event(e.getEvent())
                .description(e.getDescription())
                .performedBy(e.getPerformedBy())
                .performedAt(e.getPerformedAt() != null ? e.getPerformedAt().toString() : null)
                .oldStatus(e.getOldStatus())
                .newStatus(e.getNewStatus())
                .build();
    }
}
