package com.halalcms.inspectionservice.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditAnswerDto {
    private Long id;
    private Long questionId;
    private String questionText;
    private String answer;
    private String finding;
    private String ncDescription;
    private String obsDescription;
    private String customerComment;
    private String auditorComment;
    private String shariaComment;
}
