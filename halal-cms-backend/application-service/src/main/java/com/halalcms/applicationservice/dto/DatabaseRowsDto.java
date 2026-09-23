package com.halalcms.applicationservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class DatabaseRowsDto {
    private String database;
    private String schema;
    private String table;
    private Integer page;
    private Integer size;
    private Long totalRows;
    private List<String> columns;
    private List<Map<String, Object>> rows;
}
