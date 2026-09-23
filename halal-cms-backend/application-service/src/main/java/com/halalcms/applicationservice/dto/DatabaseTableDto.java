package com.halalcms.applicationservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DatabaseTableDto {
    private String database;
    private String schema;
    private String name;
    private String type;
    private Long estimatedRows;
    private List<DatabaseColumnDto> columns;
}
