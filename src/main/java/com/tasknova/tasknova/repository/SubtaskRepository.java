package com.tasknova.tasknova.repository;

import com.tasknova.tasknova.model.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, Long> {
    List<Subtask> findByTaskId(Long taskId);
    List<Subtask> findByTaskIdAndTaskUserId(Long taskId, Long userId);
    Optional<Subtask> findByIdAndTaskUserId(Long id, Long userId);
}
