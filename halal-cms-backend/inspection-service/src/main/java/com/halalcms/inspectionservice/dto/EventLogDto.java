package com.halalcms.inspectionservice.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventLogDto {
    private Long id;
    private Long applicationId;
    private String event;
    private String description;
    private String performedBy;
    private String performedAt;
    private String oldStatus;
    private String newStatus;
}
