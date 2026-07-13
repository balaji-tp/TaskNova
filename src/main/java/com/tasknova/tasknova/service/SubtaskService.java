package com.tasknova.tasknova.service;

import com.tasknova.tasknova.dto.SubtaskDTO;
import com.tasknova.tasknova.model.Subtask;
import com.tasknova.tasknova.model.Task;
import com.tasknova.tasknova.model.User;
import com.tasknova.tasknova.repository.SubtaskRepository;
import com.tasknova.tasknova.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubtaskService {

    @Autowired
    private SubtaskRepository subtaskRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserService userService;

    public List<SubtaskDTO> getSubtasksForTask(String email, Long taskId) {
        User user = userService.getUserByEmail(email);
        taskRepository.findByIdAndUserId(taskId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        return subtaskRepository.findByTaskId(taskId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public SubtaskDTO createSubtask(String email, SubtaskDTO dto) {
        User user = userService.getUserByEmail(email);
        Task task = taskRepository.findByIdAndUserId(dto.getTaskId(), user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        Subtask subtask = Subtask.builder()
                .task(task)
                .title(dto.getTitle())
                .isCompleted(dto.getIsCompleted() != null ? dto.getIsCompleted() : false)
                .build();

        subtaskRepository.save(subtask);
        return convertToDTO(subtask);
    }

    @Transactional
    public SubtaskDTO toggleSubtask(String email, Long subtaskId, Boolean isCompleted) {
        User user = userService.getUserByEmail(email);
        Subtask subtask = subtaskRepository.findByIdAndTaskUserId(subtaskId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subtask not found"));

        if (isCompleted != null) {
            subtask.setIsCompleted(isCompleted);
        } else {
            subtask.setIsCompleted(!subtask.getIsCompleted());
        }

        subtaskRepository.save(subtask);
        return convertToDTO(subtask);
    }

    @Transactional
    public void deleteSubtask(String email, Long subtaskId) {
        User user = userService.getUserByEmail(email);
        Subtask subtask = subtaskRepository.findByIdAndTaskUserId(subtaskId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subtask not found"));

        subtaskRepository.delete(subtask);
    }

    public SubtaskDTO convertToDTO(Subtask subtask) {
        return SubtaskDTO.builder()
                .id(subtask.getId())
                .taskId(subtask.getTask().getId())
                .title(subtask.getTitle())
                .isCompleted(subtask.getIsCompleted())
                .build();
    }
}
