package com.halalcms.inspectionservice.service;

import com.halalcms.inspectionservice.dto.ApplicationAuditResponse;
import com.halalcms.inspectionservice.dto.AuditPlanRequest;
import com.halalcms.inspectionservice.model.AuditPlan;
import com.halalcms.inspectionservice.repository.AuditPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditPlanService {

    private final AuditPlanRepository auditPlanRepository;

    @Transactional(readOnly = true)
    public ApplicationAuditResponse getByApplication(Long applicationId) {
        return auditPlanRepository.findByApplicationId(applicationId)
                .map(this::toResponse)
                .orElseGet(() -> ApplicationAuditResponse.builder()
                        .applicationId(applicationId)
                        .status("DRAFT")
                        .build());
    }

    public ApplicationAuditResponse saveForApplication(Long applicationId, AuditPlanRequest req) {
        AuditPlan plan = auditPlanRepository.findByApplicationId(applicationId)
                .orElseGet(() -> AuditPlan.builder().applicationId(applicationId).build());

        plan.setAuditorId(req.getAuditorId());
        plan.setAuditorName(req.getAuditorName());
        plan.setScheduledDate(parseDate(req.getScheduledDate()));
        plan.setDurationDays(req.getDurationDays());
        plan.setScope(req.getScope());
        plan.setStatus(req.getStatus() != null && !req.getStatus().isBlank() ? req.getStatus() : "DRAFT");

        return toResponse(auditPlanRepository.save(plan));
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        return LocalDate.parse(value);
    }

    private ApplicationAuditResponse toResponse(AuditPlan p) {
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
}
