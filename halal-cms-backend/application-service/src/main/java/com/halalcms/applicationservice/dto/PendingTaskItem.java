package com.halalcms.applicationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingTaskItem {
    private Long id;
    private Long applicationId;
    private String applicationNumber;
    private String companyName;
    private String taskType;
    private String status;
    private String priority;
    private String dueDate;
    private String description;
    private String assignedTo;
}
