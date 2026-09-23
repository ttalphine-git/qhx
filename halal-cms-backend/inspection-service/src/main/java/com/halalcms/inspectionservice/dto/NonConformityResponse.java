package com.halalcms.inspectionservice.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NonConformityResponse {
    private Long id;
    private Long applicationId;
    private String category;
    private String description;
    private String severity;
    private String status;
    private String createdAt;
    private String updatedAt;
    private String resolvedAt;
}
