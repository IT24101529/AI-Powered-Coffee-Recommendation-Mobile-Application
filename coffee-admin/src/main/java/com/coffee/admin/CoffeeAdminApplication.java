package com.coffee.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CoffeeAdminApplication {
    public static void main(String[] args) {
        SpringApplication.run(CoffeeAdminApplication.class, args);
    }
}
