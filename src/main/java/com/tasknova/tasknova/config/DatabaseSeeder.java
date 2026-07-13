package com.tasknova.tasknova.config;

import com.tasknova.tasknova.model.*;
import com.tasknova.tasknova.repository.CategoryRepository;
import com.tasknova.tasknova.repository.SubtaskRepository;
import com.tasknova.tasknova.repository.TaskRepository;
import com.tasknova.tasknova.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private SubtaskRepository subtaskRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedDatabase();
        }
    }

    private void seedDatabase() {
        User demoUser = User.builder()
                .name("Demo User")
                .email("demo@tasknova.com")
                .passwordHash(passwordEncoder.encode("Password123"))
                .avatarUrl("https://api.dicebear.com/7.x/adventurer/svg?seed=DemoUser")
                .darkMode(false)
                .build();
        userRepository.save(demoUser);

        Category work = Category.builder().user(demoUser).name("Work").colorHex("#6C5CE7").build();
        Category personal = Category.builder().user(demoUser).name("Personal").colorHex("#00B894").build();
        Category shopping = Category.builder().user(demoUser).name("Shopping").colorHex("#FDCB6E").build();
        Category health = Category.builder().user(demoUser).name("Health").colorHex("#D63031").build();

        categoryRepository.save(work);
        categoryRepository.save(personal);
        categoryRepository.save(shopping);
        categoryRepository.save(health);

        Task t1 = Task.builder()
                .user(demoUser)
                .category(work)
                .title("Complete Project Proposal")
                .description("Review the specifications and draft the initial architecture diagram.")
                .dueDate(LocalDateTime.now().plusHours(4))
                .priority(Priority.HIGH)
                .status(Status.IN_PROGRESS)
                .position(0)
                .build();
        taskRepository.save(t1);

        subtaskRepository.save(Subtask.builder().task(t1).title("Write executive summary").isCompleted(true).build());
        subtaskRepository.save(Subtask.builder().task(t1).title("Draw architectural diagrams").isCompleted(false).build());
        subtaskRepository.save(Subtask.builder().task(t1).title("Estimate timeline and milestones").isCompleted(false).build());

        Task t2 = Task.builder()
                .user(demoUser)
                .category(shopping)
                .title("Weekly grocery shopping")
                .description("Get fresh vegetables, organic milk, and eggs from the local market.")
                .dueDate(LocalDateTime.now().plusDays(1))
                .priority(Priority.MEDIUM)
                .status(Status.PENDING)
                .position(1)
                .build();
        taskRepository.save(t2);

        subtaskRepository.save(Subtask.builder().task(t2).title("Buy organic spinach & broccoli").isCompleted(false).build());
        subtaskRepository.save(Subtask.builder().task(t2).title("Get eggs & milk").isCompleted(false).build());

        Task t3 = Task.builder()
                .user(demoUser)
                .category(health)
                .title("Morning Vinyasa Flow")
                .description("30-minute full body stretch and deep breathing exercise.")
                .dueDate(LocalDateTime.now().minusDays(1))
                .priority(Priority.LOW)
                .status(Status.COMPLETED)
                .position(2)
                .build();
        taskRepository.save(t3);

        Task t4 = Task.builder()
                .user(demoUser)
                .category(work)
                .title("Debug session timeout issue")
                .description("Users report being logged out randomly after 5 minutes of inactivity.")
                .dueDate(LocalDateTime.now().minusHours(2))
                .priority(Priority.HIGH)
                .status(Status.PENDING)
                .position(3)
                .build();
        taskRepository.save(t4);

        Task t5 = Task.builder()
                .user(demoUser)
                .category(personal)
                .title("Weekend workout planner")
                .description("Plan the jogging and hiking routes for the weekend.")
                .dueDate(LocalDateTime.now().plusDays(5))
                .priority(Priority.MEDIUM)
                .status(Status.PENDING)
                .isRecurring(true)
                .recurrencePattern(RecurrencePattern.WEEKLY)
                .position(4)
                .build();
        taskRepository.save(t5);
    }
}
