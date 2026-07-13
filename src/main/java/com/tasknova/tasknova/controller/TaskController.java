package com.tasknova.tasknova.controller;

import com.tasknova.tasknova.dto.TaskDTO;
import com.tasknova.tasknova.model.Priority;
import com.tasknova.tasknova.model.Status;
import com.tasknova.tasknova.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @GetMapping
    public ResponseEntity<List<TaskDTO>> getTasks(
            Authentication authentication,
            @RequestParam(required = false) Status status,
            @RequestParam(required = false) Long category,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String dueDate,
            @RequestParam(required = false) String sort
    ) {
        return ResponseEntity.ok(taskService.getTasks(
                authentication.getName(), status, category, priority, search, dueDate, sort
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getTaskById(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(authentication.getName(), id));
    }

    @PostMapping
    public ResponseEntity<TaskDTO> createTask(Authentication authentication, @Valid @RequestBody TaskDTO dto) {
        return ResponseEntity.ok(taskService.createTask(authentication.getName(), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> updateTask(Authentication authentication, @PathVariable Long id, @Valid @RequestBody TaskDTO dto) {
        return ResponseEntity.ok(taskService.updateTask(authentication.getName(), id, dto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskDTO> patchStatus(Authentication authentication, @PathVariable Long id, @RequestParam Status status) {
        return ResponseEntity.ok(taskService.patchStatus(authentication.getName(), id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(Authentication authentication, @PathVariable Long id) {
        taskService.deleteTask(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/reorder")
    public ResponseEntity<Void> reorderTasks(Authentication authentication, @RequestBody List<Long> taskIds) {
        taskService.reorderTasks(authentication.getName(), taskIds);
        return ResponseEntity.ok().build();
    }
}
