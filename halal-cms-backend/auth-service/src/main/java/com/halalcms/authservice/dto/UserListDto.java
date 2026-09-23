package com.halalcms.authservice.dto;

import com.halalcms.authservice.model.User;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserListDto {

    private String id;
    private String email;
    private String name;
    private String role;
    private String status;
    private Instant createdAt;
    private String phone;
    private String jobTitle;
    private String department;
    private String employmentType;
    private String idProofNumber;
    private String notes;
    private String idDocName;
    private String idDocData;
    private String photoData;

    public static UserListDto from(User u) {
        return UserListDto.builder()
                .id(u.getId().toString())
                .email(u.getEmail())
                .name(u.getFullName())
                .role(u.getRole().name())
                .status(u.isEnabled() ? "ACTIVE" : "SUSPENDED")
                .createdAt(u.getCreatedAt())
                .phone(u.getPhone())
                .jobTitle(u.getJobTitle())
                .department(u.getDepartment())
                .employmentType(u.getEmploymentType())
                .idProofNumber(u.getIdProofNumber())
                .notes(u.getNotes())
                .idDocName(u.getIdDocName())
                .idDocData(u.getIdDocData())
                .photoData(u.getPhotoData())
                .build();
    }
}
