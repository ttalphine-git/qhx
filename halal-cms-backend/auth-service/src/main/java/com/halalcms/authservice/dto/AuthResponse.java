package com.halalcms.authservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private long expiresIn; // seconds
    private UUID userId;
    private String email;
    private String role;
    private String fullName;
}
