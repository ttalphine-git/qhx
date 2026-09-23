package com.halalcms.inspectionservice.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApplicationAuditReportDto {
    private Long id;
    private Long applicationId;
    private Long configurationId;
    private String activityCategoryKey;
    private String status;
    private String generalComment;
    private LocalDateTime completedAt;
    private AuditReportConfigurationDto configuration;
    private List<AuditAnswerDto> answers;
}
