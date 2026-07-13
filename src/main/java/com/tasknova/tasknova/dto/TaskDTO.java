package com.tasknova.tasknova.dto;

import com.tasknova.tasknova.model.Priority;
import com.tasknova.tasknova.model.Status;
import com.tasknova.tasknova.model.RecurrencePattern;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private Long id;
    
    private Long categoryId;
    private String categoryName;
    private String categoryColor;

    @NotBlank(message = "Task title is required")
    private String title;

    private String description;
    private LocalDateTime dueDate;
    private Priority priority;
    private Status status;
    private Boolean isRecurring;
    private RecurrencePattern recurrencePattern;
    private Integer position;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<SubtaskDTO> subtasks;
}
