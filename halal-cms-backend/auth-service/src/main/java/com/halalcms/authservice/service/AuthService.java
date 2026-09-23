package com.halalcms.authservice.service;

import com.halalcms.authservice.dto.AuthRequest;
import com.halalcms.authservice.dto.AuthResponse;
import com.halalcms.authservice.dto.EmployeeCreateRequest;
import com.halalcms.authservice.dto.LoginRequest;
import com.halalcms.authservice.model.User;
import com.halalcms.authservice.repository.UserRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository  userRepository;
    private final JwtService      jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.access-token-expiry}") private long accessExpiry;

    public AuthResponse authenticate(AuthRequest req) {
        return authenticateCredentials(req.getEmail(), req.getPassword());
    }

    public AuthResponse authenticateByLogin(LoginRequest req) {
        return authenticateCredentials(req.getEmail(), req.getPassword());
    }

    private AuthResponse authenticateCredentials(String identifier, String password) {
        User user = userRepository.findByEmail(identifier)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account disabled");
        }
        return buildResponse(user);
    }

    public AuthResponse register(AuthRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User.UserRole role = "OFFICE".equalsIgnoreCase(req.getRole())
                ? User.UserRole.OFFICE_ADMIN : User.UserRole.CUSTOMER;
        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName() != null ? req.getFullName() : req.getEmail())
                .role(role)
                .build();
        return buildResponse(userRepository.save(user));
    }

    public AuthResponse createEmployee(EmployeeCreateRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .role(mapRole(req.getRole()))
                .phone(req.getPhone())
                .jobTitle(req.getJobTitle())
                .department(req.getDepartment())
                .employmentType(req.getEmploymentType())
                .idProofNumber(req.getIdProofNumber())
                .startDate(req.getStartDate())
                .notes(req.getNotes())
                .idDocName(req.getIdDocName())
                .idDocData(req.getIdDocData())
                .photoData(req.getPhotoData())
                .build();
        return buildResponse(userRepository.save(user));
    }

    private User.UserRole mapRole(String role) {
        if (role == null) return User.UserRole.OFFICE_INSPECTOR;
        return switch (role.toUpperCase()) {
            case "ADMIN", "OFFICE_ADMIN"                     -> User.UserRole.OFFICE_ADMIN;
            case "OFFICE_REVIEWER"                           -> User.UserRole.OFFICE_REVIEWER;
            case "AUDITOR"                                   -> User.UserRole.AUDITOR;
            case "SHARIA_AUDITOR"                            -> User.UserRole.SHARIA_AUDITOR;
            case "REVIEWER"                                  -> User.UserRole.OFFICE_REVIEWER;
            case "HALAL_REVIEWER"                            -> User.UserRole.HALAL_REVIEWER;
            case "DECISION_MAKER"                            -> User.UserRole.DECISION_MAKER;
            case "FINANCE"                                   -> User.UserRole.FINANCE;
            case "AUDIT_PLANNER"                             -> User.UserRole.AUDIT_PLANNER;
            case "CERTIFICATE_CONTROLLER"                    -> User.UserRole.CERTIFICATE_CONTROLLER;
            case "QUALITY_MANAGER"                           -> User.UserRole.QUALITY_MANAGER;
            case "CUSTOMER"                                  -> User.UserRole.CUSTOMER;
            default                                          -> User.UserRole.OFFICE_INSPECTOR;
        };
    }

    public AuthResponse refresh(String bearerToken) {
        String token = bearerToken.startsWith("Bearer ") ? bearerToken.substring(7) : bearerToken;
        Claims claims = jwtService.validateAndParse(token);
        if (!"REFRESH".equals(claims.get("type"))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not a refresh token");
        }
        User user = userRepository.findById(UUID.fromString(claims.getSubject()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return AuthResponse.builder()
                .accessToken(jwtService.generateAccessToken(user))
                .refreshToken(token)
                .expiresIn(accessExpiry)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .build();
    }

    public void logout(String bearerToken) {
        // token blacklist via Redis – not yet implemented
    }

    private AuthResponse buildResponse(User user) {
        return AuthResponse.builder()
                .accessToken(jwtService.generateAccessToken(user))
                .refreshToken(jwtService.generateRefreshToken(user))
                .expiresIn(accessExpiry)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .build();
    }
}
