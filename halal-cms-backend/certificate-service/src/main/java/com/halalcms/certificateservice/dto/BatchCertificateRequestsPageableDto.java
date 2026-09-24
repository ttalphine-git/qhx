package com.halalcms.certificateservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchCertificateRequestsPageableDto {
    private List<BatchCertificateRequestDto> content;
    private long totalElements;
    private int totalPages;
    private int page;
    private int size;
}
