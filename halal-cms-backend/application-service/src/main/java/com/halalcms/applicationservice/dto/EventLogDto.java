package com.halalcms.applicationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
