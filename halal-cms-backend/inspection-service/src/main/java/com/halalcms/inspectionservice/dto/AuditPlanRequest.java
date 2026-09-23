package com.halalcms.inspectionservice.dto;

import lombok.Data;

@Data
public class AuditPlanRequest {
    private String auditorId;
    private String auditorName;
    private String scheduledDate;
    private Integer durationDays;
    private String scope;
    private String status;
}
