package br.com.cookie.api.upload;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Serve as fotos enviadas em /uploads/nome-do-arquivo. */
@Configuration
public class UploadWebConfig implements WebMvcConfigurer {

    private final String pasta;

    public UploadWebConfig(@Value("${app.uploads.pasta}") String pasta) {
        this.pasta = pasta;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String local = Path.of(pasta).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/uploads/**").addResourceLocations(local.endsWith("/") ? local : local + "/");
    }
}
