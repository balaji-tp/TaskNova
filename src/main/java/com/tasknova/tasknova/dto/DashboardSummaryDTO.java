package com.tasknova.tasknova.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO {
    private long dueTodayCount;
    private long overdueCount;
    private long completedCount;
    private long totalCount;
    private double completionRate;
    private Map<String, Long> tasksByCategory;
    private List<TaskDTO> upcomingTasks;
}
