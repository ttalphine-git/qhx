package com.halalcms.applicationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDocumentDto {
    private Long id;
    private String filename;
    private String description;
    private String uploadedAt;
    private String url;
}
