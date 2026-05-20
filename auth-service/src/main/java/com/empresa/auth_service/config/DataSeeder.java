package com.empresa.auth_service.config;

import com.empresa.auth_service.model.User;
import com.empresa.auth_service.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            logger.info("Seeding default users...");

            User admin = new User();
            admin.setEmail("admin@empresa.com");
            admin.setPassword(passwordEncoder.encode("Admin123!"));
            admin.setRole("ADMIN");
            admin.setActive(true);
            userRepository.save(admin);

            User user = new User();
            user.setEmail("usuario@empresa.com");
            user.setPassword(passwordEncoder.encode("User123!"));
            user.setRole("USER");
            user.setActive(true);
            userRepository.save(user);

            User inactive = new User();
            inactive.setEmail("exempleado@empresa.com");
            inactive.setPassword(passwordEncoder.encode("Inactive123!"));
            inactive.setRole("USER");
            inactive.setActive(false);
            userRepository.save(inactive);

            logger.info("Default users seeded successfully.");
        }
    }
}
