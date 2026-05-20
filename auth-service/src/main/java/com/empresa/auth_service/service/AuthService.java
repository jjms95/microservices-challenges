package com.empresa.auth_service.service;

import com.empresa.auth_service.dto.LoginDto;
import com.empresa.auth_service.dto.ResetDto;
import com.empresa.auth_service.model.User;
import com.empresa.auth_service.repository.UserRepository;
import com.empresa.auth_service.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public Map<String, String> login(LoginDto loginDto) {
        User user = userRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials or inactive user"));

        if (!user.isActive()) {
            throw new RuntimeException("Invalid credentials or inactive user");
        }

        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            throw new RuntimeException("Please reset your password before logging in");
        }

        if (!passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole());

        String token = jwtUtil.generateToken(user.getId(), claims, 3600000); // 1h

        Map<String, String> response = new HashMap<>();
        response.put("access_token", token);
        return response;
    }

    public Map<String, String> recoverPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found or inactive"));

        if (!user.isActive()) throw new RuntimeException("User not found or inactive");

        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "RESET_PASSWORD");
        String resetToken = jwtUtil.generateToken(user.getId(), claims, 900000); // 15m

        // Emit event user.recovered
        String payload = "{\"pattern\":\"user.recovered\",\"data\":{\"email\":\"" + email + "\",\"token\":\"" + resetToken + "\"}}";
        rabbitTemplate.convertAndSend("employees_exchange", "", payload);
        logger.info("Emitted user.recovered for " + email);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Recovery email simulated");
        return response;
    }

    public Map<String, String> resetPassword(ResetDto resetDto) {
        try {
            Claims claims = jwtUtil.validateToken(resetDto.getToken());
            if (!"RESET_PASSWORD".equals(claims.get("type"))) {
                throw new RuntimeException("Invalid token type");
            }

            User user = userRepository.findById(claims.getSubject())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setPassword(passwordEncoder.encode(resetDto.getNewPassword()));
            userRepository.save(user);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Password updated successfully");
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Invalid or expired token");
        }
    }

    @RabbitListener(queues = "auth_queue")
    public void receiveMessage(String message) {
        logger.info("Received event: " + message);
        try {
            // Very naive JSON parsing without Jackson overhead just for event pattern
            if (message.contains("\"pattern\":\"employee.created\"")) {
                String email = extractJsonStringValue(message, "email");
                handleEmployeeCreated(email);
            } else if (message.contains("\"pattern\":\"employee.deleted\"")) {
                String email = extractJsonStringValue(message, "email");
                handleEmployeeDeleted(email);
            }
        } catch (Exception e) {
            logger.error("Error processing event", e);
        }
    }

    private void handleEmployeeCreated(String email) {
        Optional<User> existing = userRepository.findByEmail(email);
        User user;
        if (existing.isPresent()) {
            user = existing.get();
        } else {
            user = new User();
            user.setEmail(email);
            user.setRole("USER");
            user.setActive(true);
            user = userRepository.save(user);
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "RESET_PASSWORD");
        String resetToken = jwtUtil.generateToken(user.getId(), claims, 7200000); // 2h

        String payload = "{\"pattern\":\"user.created\",\"data\":{\"email\":\"" + email + "\",\"token\":\"" + resetToken + "\"}}";
        rabbitTemplate.convertAndSend("employees_exchange", "", payload);
        logger.info("Created user " + email + " from employee and emitted user.created");
    }

    private void handleEmployeeDeleted(String email) {
        Optional<User> existing = userRepository.findByEmail(email);
        existing.ifPresent(user -> {
            user.setActive(false);
            userRepository.save(user);
            logger.info("Deactivated user " + email + " from employee deleted");
        });
    }

    private String extractJsonStringValue(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start == -1) return null;
        start += search.length();
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }
}
