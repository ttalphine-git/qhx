package com.halalcms.certificateservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCertificateRequest {

    @NotNull(message = "applicationId is required")
    private Long applicationId;

    @NotNull(message = "companyName is required")
    private String companyName;

    private String halalStandard;
    private String issuedBy;
}
