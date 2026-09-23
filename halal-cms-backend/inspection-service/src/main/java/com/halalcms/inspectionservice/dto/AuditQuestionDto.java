package com.halalcms.inspectionservice.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditQuestionDto {
    private Long id;
    private String questionText;
    private Integer sortOrder;
}
