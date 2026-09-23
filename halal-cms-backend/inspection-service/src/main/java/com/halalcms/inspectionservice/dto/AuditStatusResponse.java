package com.halalcms.inspectionservice.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditStatusResponse {
    private Long applicationId;
    private String currentPhase;
    private boolean f1Started;
    private boolean f1Completed;
    private boolean f2Started;
    private boolean f2Completed;
    private boolean complianceAssigned;
    private boolean certificationFinalized;
}
