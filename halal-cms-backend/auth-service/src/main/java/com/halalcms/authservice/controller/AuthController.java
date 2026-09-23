package com.halalcms.authservice.controller;

import com.halalcms.authservice.dto.AuthRequest;
import com.halalcms.authservice.dto.AuthResponse;
import com.halalcms.authservice.dto.EmployeeCreateRequest;
import com.halalcms.authservice.dto.LoginRequest;
import com.halalcms.authservice.repository.UserRepository;
import com.halalcms.authservice.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService    authService;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.authenticateByLogin(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestHeader("Authorization") String bearerToken) {
        return ResponseEntity.ok(authService.refresh(bearerToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String bearerToken) {
        authService.logout(bearerToken);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/employees")
    public ResponseEntity<AuthResponse> createEmployee(@Valid @RequestBody EmployeeCreateRequest req) {
        return ResponseEntity.status(201).body(authService.createEmployee(req));
    }

    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@RequestParam String email) {
        return ResponseEntity.ok(Map.of("exists", userRepository.existsByEmail(email)));
    }
}
