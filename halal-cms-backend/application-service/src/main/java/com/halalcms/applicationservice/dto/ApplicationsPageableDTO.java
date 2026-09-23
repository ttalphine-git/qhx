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
public class ApplicationsPageableDTO {
    private List<ApplicationResponseDTO> content;
    private long totalElements;
    private int totalPages;
    private int page;
    private int size;
}
