package br.com.cookie.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ReceitasApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReceitasApiApplication.class, args);
    }
}
