package com.halalcms.applicationservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DatabaseColumnDto {
    private String name;
    private String type;
    private boolean nullable;
    private String defaultValue;
    private boolean primaryKey;
    private Integer ordinalPosition;
}
