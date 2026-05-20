package com.empresa.auth_service.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "employees_exchange";
    public static final String QUEUE_NAME = "auth_queue";

    @Bean
    public FanoutExchange exchange() {
        return new FanoutExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue authQueue() {
        return new Queue(QUEUE_NAME, true);
    }

    @Bean
    public Binding binding(Queue authQueue, FanoutExchange exchange) {
        return BindingBuilder.bind(authQueue).to(exchange);
    }
}
