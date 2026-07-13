package com.tasknova.tasknova.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private String avatarUrl;
    private Boolean darkMode;
    private LocalDateTime createdAt;
    private String password; // Allow password changes (write-only)
}
