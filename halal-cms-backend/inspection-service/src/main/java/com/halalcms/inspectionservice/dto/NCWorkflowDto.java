package com.halalcms.inspectionservice.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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
    public static class SaveFindingRequest {
        private String questionId;
        private String questionText;
        private String category;
        private String description;
        private String severity;
        private List<Map<String, Object>> ncEvidence;
        private String customerComment;
        private List<Map<String, Object>> customerEvidence;
        private String auditorComment;
        private List<Map<String, Object>> auditorEvidence;
        private String shariaComment;
        private List<Map<String, Object>> shariaEvidence;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class NCWorkflowStatusResponse {
        private Long ncId;
        private String questionText;
        private String category;
        private String description;
        private String currentStatus;
        private String correctiveAction;
        private LocalDate dueDate;
        private List<NCEvidenceDto> evidenceSubmissions;
        private Integer currentIteration;
    }
}
