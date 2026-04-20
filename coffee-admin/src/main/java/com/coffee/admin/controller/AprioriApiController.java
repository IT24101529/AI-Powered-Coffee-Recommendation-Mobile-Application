package com.coffee.admin.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/apriori")
public class AprioriApiController {

    @GetMapping("/results")
    public ResponseEntity<String> getResults() {
        try {
            ClassPathResource res = new ClassPathResource("static/apriori_results.json");
            String json = new String(res.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            return ResponseEntity.ok().header("Content-Type","application/json").body(json);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("{\"error\":\"Run apriori_engine.py first.\"}");
        }
    }

    @PostMapping("/run")
    public ResponseEntity<Map<String,String>> run() {
        try {
            String path = new ClassPathResource("static/apriori_engine.py").getFile().getAbsolutePath();
            ProcessBuilder pb = new ProcessBuilder("python3", path);
            pb.redirectErrorStream(true);
            Process p = pb.start();
            String out = new String(p.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            int exit = p.waitFor();
            if (exit == 0) return ResponseEntity.ok(Map.of("status","success","message","Apriori completed."));
            return ResponseEntity.internalServerError().body(Map.of("status","error","message",out));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("status","error","message",e.getMessage()));
        }
    }
}
