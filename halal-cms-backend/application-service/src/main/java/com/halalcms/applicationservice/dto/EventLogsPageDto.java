package com.halalcms.applicationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventLogsPageDto {
    private List<EventLogDto> content;
    private long totalElements;
    private int totalPages;
    private int page;
    private int size;
}
