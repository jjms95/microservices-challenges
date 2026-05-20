package com.empresa.auth_service.controller;

import com.empresa.auth_service.dto.LoginDto;
import com.empresa.auth_service.dto.RecoverDto;
import com.empresa.auth_service.dto.ResetDto;
import com.empresa.auth_service.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import com.empresa.auth_service.model.User;
import com.empresa.auth_service.repository.UserRepository;
import com.empresa.auth_service.security.JwtUtil;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDto loginDto) {
        try {
            return ResponseEntity.ok(authService.login(loginDto));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/recover-password")
    public ResponseEntity<?> recoverPassword(@RequestBody RecoverDto recoverDto) {
        try {
            return ResponseEntity.ok(authService.recoverPassword(recoverDto.getEmail()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetDto resetDto) {
        try {
            return ResponseEntity.ok(authService.resetPassword(resetDto));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "auth-service"
        ));
    }
}
