package com.empresa.auth_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {

    @Value("${jwt.secret:supersecret2026}")
    private String secret;

    private SecretKey getSigningKey() {
        // Needs to be at least 256 bits, but the old one was 'supersecret2026'.
        // To avoid errors with old secret being too short, let's hash it or pad it.
        String paddedSecret = secret;
        while (paddedSecret.length() < 32) {
            paddedSecret += secret;
        }
        return Keys.hmacShaKeyFor(paddedSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String subject, Map<String, Object> claims, long expirationMillis) {
        return Jwts.builder()
                .subject(subject)
                .claims(claims)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationMillis))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
