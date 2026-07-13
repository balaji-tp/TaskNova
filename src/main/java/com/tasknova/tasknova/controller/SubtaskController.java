package com.tasknova.tasknova.controller;

import com.tasknova.tasknova.dto.SubtaskDTO;
import com.tasknova.tasknova.service.SubtaskService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/subtasks")
public class SubtaskController {

    @Autowired
    private SubtaskService subtaskService;

    @GetMapping("/{taskId}")
    public ResponseEntity<List<SubtaskDTO>> getSubtasks(Authentication authentication, @PathVariable Long taskId) {
        return ResponseEntity.ok(subtaskService.getSubtasksForTask(authentication.getName(), taskId));
    }

    @PostMapping
    public ResponseEntity<SubtaskDTO> createSubtask(Authentication authentication, @Valid @RequestBody SubtaskDTO dto) {
        return ResponseEntity.ok(subtaskService.createSubtask(authentication.getName(), dto));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<SubtaskDTO> toggleSubtask(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam(required = false) Boolean isCompleted
    ) {
        return ResponseEntity.ok(subtaskService.toggleSubtask(authentication.getName(), id, isCompleted));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubtask(Authentication authentication, @PathVariable Long id) {
        subtaskService.deleteSubtask(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
