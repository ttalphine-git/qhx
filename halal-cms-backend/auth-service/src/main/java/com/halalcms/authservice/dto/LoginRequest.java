package com.halalcms.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank
    private String email; // accepts email or username

    @NotBlank
    private String password;
}
