package com.halalcms.applicationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponseDTO {
    private Long id;
    private String applicationNumber;
    private String status;
    private String type;
    private String companyName;
    private String createdAt;
    private String updatedAt;
    private String submittedAt;
    private String userId;
    private String assignedAuditorId;
    private String assignedAuditorName;
    private String halalStandard;
    private String country;
    private Integer productCount;
    private String payloadJson;
}
