package com.halalcms.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AuthRequest {

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 8, max = 128)
    private String password;

    // Only required for registration
    private String fullName;
    private String companyName;
    private String role; // "OFFICE" or "CUSTOMER" – validated server-side
}
