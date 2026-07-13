package com.tasknova.tasknova.service;

import com.tasknova.tasknova.dto.TaskDTO;
import com.tasknova.tasknova.dto.SubtaskDTO;
import com.tasknova.tasknova.model.*;
import com.tasknova.tasknova.repository.CategoryRepository;
import com.tasknova.tasknova.repository.SubtaskRepository;
import com.tasknova.tasknova.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SubtaskRepository subtaskRepository;

    @Autowired
    private UserService userService;

    public List<TaskDTO> getTasks(String email, Status status, Long categoryId, Priority priority, String search, String dueDateFilter, String sortBy) {
        User user = userService.getUserByEmail(email);

        Sort sort = Sort.by(Sort.Direction.ASC, "position");
        if (sortBy != null) {
            switch (sortBy.toLowerCase()) {
                case "due_date":
                    sort = Sort.by(Sort.Order.asc("dueDate").nullsLast());
                    break;
                case "priority":
                    sort = Sort.by(Sort.Order.desc("priority"));
                    break;
                case "date_created":
                    sort = Sort.by(Sort.Direction.DESC, "createdAt");
                    break;
                case "alphabetical":
                    sort = Sort.by(Sort.Direction.ASC, "title");
                    break;
            }
        }

        List<Task> tasks = taskRepository.filterTasks(user.getId(), status, categoryId, priority, search, sort);

        if (dueDateFilter != null && !dueDateFilter.isBlank()) {
            LocalDate today = LocalDate.now();
            LocalDateTime startOfToday = today.atStartOfDay();
            LocalDateTime endOfToday = today.atTime(LocalTime.MAX);
            LocalDateTime endOfWeek = today.plusDays(7).atTime(LocalTime.MAX);

            tasks = tasks.stream().filter(task -> {
                LocalDateTime due = task.getDueDate();
                switch (dueDateFilter.toLowerCase()) {
                    case "today":
                        return due != null && !due.isBefore(startOfToday) && !due.isAfter(endOfToday);
                    case "this_week":
                        return due != null && !due.isBefore(startOfToday) && !due.isAfter(endOfWeek);
                    case "overdue":
                        return due != null && due.isBefore(LocalDateTime.now()) && task.getStatus() != Status.COMPLETED;
                    case "no_date":
                        return due == null;
                    default:
                        return true;
                }
            }).collect(Collectors.toList());
        }

        if ("priority".equalsIgnoreCase(sortBy)) {
            tasks.sort((t1, t2) -> {
                int p1 = t1.getPriority() == Priority.HIGH ? 3 : (t1.getPriority() == Priority.MEDIUM ? 2 : 1);
                int p2 = t2.getPriority() == Priority.HIGH ? 3 : (t2.getPriority() == Priority.MEDIUM ? 2 : 1);
                return Integer.compare(p2, p1);
            });
        }

        return tasks.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public TaskDTO getTaskById(String email, Long taskId) {
        User user = userService.getUserByEmail(email);
        Task task = taskRepository.findByIdAndUserId(taskId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        return convertToDTO(task);
    }

    @Transactional
    public TaskDTO createTask(String email, TaskDTO dto) {
        User user = userService.getUserByEmail(email);

        Category category = null;
        if (dto.getCategoryId() != null) {
            category = categoryRepository.findByIdAndUserId(dto.getCategoryId(), user.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
        }

        Task task = Task.builder()
                .user(user)
                .category(category)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .dueDate(dto.getDueDate())
                .priority(dto.getPriority() != null ? dto.getPriority() : Priority.MEDIUM)
                .status(dto.getStatus() != null ? dto.getStatus() : Status.PENDING)
                .isRecurring(dto.getIsRecurring() != null ? dto.getIsRecurring() : false)
                .recurrencePattern(dto.getRecurrencePattern() != null ? dto.getRecurrencePattern() : RecurrencePattern.NONE)
                .position(dto.getPosition() != null ? dto.getPosition() : 0)
                .build();

        taskRepository.save(task);
        return convertToDTO(task);
    }

    @Transactional
    public TaskDTO updateTask(String email, Long taskId, TaskDTO dto) {
        User user = userService.getUserByEmail(email);
        Task task = taskRepository.findByIdAndUserId(taskId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        Category category = null;
        if (dto.getCategoryId() != null) {
            category = categoryRepository.findByIdAndUserId(dto.getCategoryId(), user.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
        }

        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setCategory(category);
        task.setDueDate(dto.getDueDate());
        if (dto.getPriority() != null) task.setPriority(dto.getPriority());
        if (dto.getStatus() != null) task.setStatus(dto.getStatus());
        if (dto.getIsRecurring() != null) task.setIsRecurring(dto.getIsRecurring());
        if (dto.getRecurrencePattern() != null) task.setRecurrencePattern(dto.getRecurrencePattern());
        if (dto.getPosition() != null) task.setPosition(dto.getPosition());

        taskRepository.save(task);
        return convertToDTO(task);
    }

    @Transactional
    public TaskDTO patchStatus(String email, Long taskId, Status status) {
        User user = userService.getUserByEmail(email);
        Task task = taskRepository.findByIdAndUserId(taskId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        task.setStatus(status);

        if (status == Status.COMPLETED && task.getIsRecurring() && task.getRecurrencePattern() != RecurrencePattern.NONE) {
            handleRecurrence(task);
        } else {
            taskRepository.save(task);
        }

        return convertToDTO(task);
    }

    private void handleRecurrence(Task task) {
        if (task.getDueDate() == null) {
            taskRepository.save(task);
            return;
        }

        LocalDateTime nextDueDate = task.getDueDate();
        switch (task.getRecurrencePattern()) {
            case DAILY:
                nextDueDate = nextDueDate.plusDays(1);
                break;
            case WEEKLY:
                nextDueDate = nextDueDate.plusWeeks(1);
                break;
            case MONTHLY:
                nextDueDate = nextDueDate.plusMonths(1);
                break;
            default:
                break;
        }

        Task nextTask = Task.builder()
                .user(task.getUser())
                .category(task.getCategory())
                .title(task.getTitle())
                .description(task.getDescription())
                .dueDate(nextDueDate)
                .priority(task.getPriority())
                .status(Status.PENDING)
                .isRecurring(true)
                .recurrencePattern(task.getRecurrencePattern())
                .position(task.getPosition() - 1)
                .build();
        taskRepository.save(nextTask);

        List<Subtask> subtasks = subtaskRepository.findByTaskId(task.getId());
        for (Subtask sub : subtasks) {
            Subtask nextSub = Subtask.builder()
                    .task(nextTask)
                    .title(sub.getTitle())
                    .isCompleted(false)
                    .build();
            subtaskRepository.save(nextSub);
        }

        task.setIsRecurring(false);
        task.setRecurrencePattern(RecurrencePattern.NONE);
        taskRepository.save(task);
    }

    @Transactional
    public void deleteTask(String email, Long taskId) {
        User user = userService.getUserByEmail(email);
        Task task = taskRepository.findByIdAndUserId(taskId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        taskRepository.delete(task);
    }

    @Transactional
    public void reorderTasks(String email, List<Long> taskIds) {
        User user = userService.getUserByEmail(email);
        for (int i = 0; i < taskIds.size(); i++) {
            Long taskId = taskIds.get(i);
            Task task = taskRepository.findByIdAndUserId(taskId, user.getId()).orElse(null);
            if (task != null) {
                task.setPosition(i);
                taskRepository.save(task);
            }
        }
    }

    public TaskDTO convertToDTO(Task task) {
        List<SubtaskDTO> subtaskDTOs = subtaskRepository.findByTaskId(task.getId()).stream()
                .map(sub -> SubtaskDTO.builder()
                        .id(sub.getId())
                        .taskId(task.getId())
                        .title(sub.getTitle())
                        .isCompleted(sub.getIsCompleted())
                        .build())
                .collect(Collectors.toList());

        return TaskDTO.builder()
                .id(task.getId())
                .categoryId(task.getCategory() != null ? task.getCategory().getId() : null)
                .categoryName(task.getCategory() != null ? task.getCategory().getName() : null)
                .categoryColor(task.getCategory() != null ? task.getCategory().getColorHex() : null)
                .title(task.getTitle())
                .description(task.getDescription())
                .dueDate(task.getDueDate())
                .priority(task.getPriority())
                .status(task.getStatus())
                .isRecurring(task.getIsRecurring())
                .recurrencePattern(task.getRecurrencePattern())
                .position(task.getPosition())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .subtasks(subtaskDTOs)
                .build();
    }
}
