package com.halalcms.inspectionservice.dto;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditReportConfigurationDto {
    private Long id;
    private String name;
    private String reportTitle;
    private String appliesTo;
    private List<String> activityCategoryKeys;
    private String riskLevel;
    private String formCode;
    private String revision;
    private List<String> stages;
    private Boolean active;
    private Integer sortOrder;
    private List<AuditQuestionDto> questions;
}
