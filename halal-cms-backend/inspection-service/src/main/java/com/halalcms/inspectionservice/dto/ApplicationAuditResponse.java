package com.halalcms.inspectionservice.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApplicationAuditResponse {
    private Long id;
    private Long applicationId;
    private String auditorId;
    private String auditorName;
    private String scheduledDate;
    private Integer durationDays;
    private String scope;
    private String status;
}
