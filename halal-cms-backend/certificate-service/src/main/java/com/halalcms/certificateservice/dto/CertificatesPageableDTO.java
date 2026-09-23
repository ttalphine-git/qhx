package com.halalcms.certificateservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CertificatesPageableDTO {

    private List<CertificateDto> content;
    private long totalElements;
    private int totalPages;
    private int page;
    private int size;
}
