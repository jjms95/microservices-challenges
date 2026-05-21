package com.empresa.auth_service.config;

import io.micrometer.tracing.Tracer;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class BeanChecker {
    private static final Logger logger = LoggerFactory.getLogger(BeanChecker.class);

    @Autowired
    private ApplicationContext context;

    @PostConstruct
    public void check() {
        try {
            Tracer tracer = context.getBean(Tracer.class);
            logger.info("TRACER IS PRESENT: {}", tracer.getClass().getName());
        } catch (Exception e) {
            logger.error("TRACER IS MISSING: {}", e.getMessage());
        }
    }
}
