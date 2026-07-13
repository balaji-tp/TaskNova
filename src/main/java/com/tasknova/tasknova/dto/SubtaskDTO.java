package com.tasknova.tasknova.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubtaskDTO {
    private Long id;
    private Long taskId;

    @NotBlank(message = "Subtask title is required")
    private String title;

    private Boolean isCompleted;
}
