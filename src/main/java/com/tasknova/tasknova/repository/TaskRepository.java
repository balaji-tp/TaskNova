package com.tasknova.tasknova.repository;

import com.tasknova.tasknova.model.Priority;
import com.tasknova.tasknova.model.Status;
import com.tasknova.tasknova.model.Task;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserIdOrderByPositionAsc(Long userId);
    Optional<Task> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT t FROM Task t WHERE t.user.id = :userId " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:categoryId IS NULL OR t.category.id = :categoryId) " +
           "AND (:priority IS NULL OR t.priority = :priority) " +
           "AND (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Task> filterTasks(
            @Param("userId") Long userId,
            @Param("status") Status status,
            @Param("categoryId") Long categoryId,
            @Param("priority") Priority priority,
            @Param("search") String search,
            Sort sort
    );

    List<Task> findByUserId(Long userId);
}
