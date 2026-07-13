package com.tasknova.tasknova.service;

import com.tasknova.tasknova.dto.DashboardSummaryDTO;
import com.tasknova.tasknova.dto.TaskDTO;
import com.tasknova.tasknova.model.Status;
import com.tasknova.tasknova.model.Task;
import com.tasknova.tasknova.model.User;
import com.tasknova.tasknova.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private TaskService taskService;

    public DashboardSummaryDTO getSummary(String email) {
        User user = userService.getUserByEmail(email);
        List<Task> tasks = taskRepository.findByUserId(user.getId());

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = today.atTime(LocalTime.MAX);
        LocalDateTime endOfWeek = today.plusDays(7).atTime(LocalTime.MAX);

        long totalCount = tasks.size();
        long completedCount = tasks.stream().filter(t -> t.getStatus() == Status.COMPLETED).count();

        long dueTodayCount = tasks.stream().filter(t -> t.getStatus() != Status.COMPLETED 
                && t.getDueDate() != null 
                && !t.getDueDate().isBefore(startOfToday) 
                && !t.getDueDate().isAfter(endOfToday)).count();

        long overdueCount = tasks.stream().filter(t -> t.getStatus() != Status.COMPLETED 
                && t.getDueDate() != null 
                && t.getDueDate().isBefore(now)).count();

        double completionRate = totalCount == 0 ? 0.0 : ((double) completedCount / totalCount) * 100.0;

        Map<String, Long> tasksByCategory = new HashMap<>();
        for (Task t : tasks) {
            String catName = t.getCategory() != null ? t.getCategory().getName() : "Uncategorized";
            tasksByCategory.put(catName, tasksByCategory.getOrDefault(catName, 0L) + 1);
        }

        List<TaskDTO> upcomingTasks = tasks.stream()
                .filter(t -> t.getStatus() != Status.COMPLETED 
                        && t.getDueDate() != null 
                        && !t.getDueDate().isBefore(now)
                        && !t.getDueDate().isAfter(endOfWeek))
                .sorted((t1, t2) -> t1.getDueDate().compareTo(t2.getDueDate()))
                .limit(5)
                .map(taskService::convertToDTO)
                .collect(Collectors.toList());

        return DashboardSummaryDTO.builder()
                .dueTodayCount(dueTodayCount)
                .overdueCount(overdueCount)
                .completedCount(completedCount)
                .totalCount(totalCount)
                .completionRate(Math.round(completionRate * 10.0) / 10.0)
                .tasksByCategory(tasksByCategory)
                .upcomingTasks(upcomingTasks)
                .build();
    }
}
