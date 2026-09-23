package com.halalcms.inspectionservice.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NCWorkflowDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SubmitCorrectiveActionRequest {
        private String correctiveAction;
        private LocalDate dueDate;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SubmitEvidenceRequest {
        private String evidenceText;
        private List<String> evidenceFiles;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AuditorReviewRequest {
        private String decision;
        private String feedback;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class NCWorkflowStatusResponse {
        private Long ncId;
        private String currentStatus;
        private String correctiveAction;
        private LocalDate dueDate;
        private List<NCEvidenceDto> evidenceSubmissions;
        private Integer currentIteration;
    }
}
