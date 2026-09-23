package com.halalcms.inspectionservice.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecommendationResponse {
    private Long id;
    private Long applicationId;
    private String text;
    private String priority;
    private String createdAt;
    private String createdBy;
}
