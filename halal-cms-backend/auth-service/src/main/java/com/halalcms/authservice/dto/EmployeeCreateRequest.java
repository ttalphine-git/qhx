package com.halalcms.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EmployeeCreateRequest {

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 8, max = 128)
    private String password;

    @NotBlank
    private String fullName;

    private String role; // ADMIN, AUDITOR, REVIEWER, OFFICER, etc.

    private String employmentType; // OWN | OUTSOURCE

    private String phone;
    private String jobTitle;
    private String department;
    private String idProofNumber;
    private String startDate;
    private String notes;
    private String idDocName;
    private String idDocData;
    private String photoData;
}
