package com.coffee.admin.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionUpdateRequest {
    private String status;
    private String outcome;
    private String adminNotes;
}
