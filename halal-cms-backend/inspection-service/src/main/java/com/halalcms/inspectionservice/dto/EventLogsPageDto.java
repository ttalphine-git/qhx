package com.halalcms.inspectionservice.dto;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventLogsPageDto {
    private List<EventLogDto> content;
    private long totalElements;
    private int totalPages;
    private int page;
    private int size;
}
