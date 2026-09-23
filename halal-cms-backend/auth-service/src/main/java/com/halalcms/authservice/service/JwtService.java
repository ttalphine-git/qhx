package com.halalcms.authservice.service;

import com.halalcms.authservice.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    @Value("${jwt.secret}") private String secret;
    @Value("${jwt.access-token-expiry}") private long accessExpiry;
    @Value("${jwt.refresh-token-expiry}") private long refreshExpiry;

    public String generateAccessToken(User user) {
        return build(user, accessExpiry, "ACCESS");
    }

    public String generateRefreshToken(User user) {
        return build(user, refreshExpiry, "REFRESH");
    }

    private String build(User user, long expirySeconds, String type) {
        var now = new Date();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("role",     user.getRole().name())
                .claim("email",    user.getEmail())
                .claim("fullName", user.getFullName())
                .claim("type",     type)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirySeconds * 1000))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    public Claims validateAndParse(String token) {
        return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(validateAndParse(token).getSubject());
    }
}
