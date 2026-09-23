package com.halalcms.inspectionservice.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NCEvidenceDto {
    private Long id;
    private Long ncId;
    private Integer submissionNumber;
    private String evidenceText;
    private List<String> evidenceFiles;
    private Long submittedBy;
    private LocalDateTime submittedAt;
    private String auditorReviewStatus;
    private String auditorFeedback;
    private Long reviewedBy;
    private LocalDateTime reviewedAt;
}
