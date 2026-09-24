package com.halalcms.certificateservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchCertificateTemplateDto {
    private Long id;
    private String name;
    private Integer version;
    private Boolean isDefault;
    private String templateJson;
    private Integer pageCount;
    private Integer pageWidth;
    private Integer pageHeight;
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
}
