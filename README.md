# TaskNova — Plan smarter. Do more.

TaskNova is a responsive, modern, and aesthetically clean task manager built with **Spring Boot (Java 17)** and a premium **Single Page Application (SPA) frontend**.

---

## Features

- **JWT Authentication**: Secure login/registration with hashed passwords using BCrypt.
- **Task Management**: CRUD, priority levels, tag associations, status transitions, and in-app toasts.
- **Productivity Dashboard**: Today/overdue counts, an interactive completion progress ring, and task category breakdowns drawn directly on an HTML5 canvas.
- **Interactions**: Drag-and-drop task card reordering and column updates in the Kanban Board view.
- **Checklist Subtasks**: Multi-step checklist creation and progress bars inside tasks.
- **Theme Preferences**: Sleek light/dark mode toggling, stored directly in the database.
- **Seeded Demo Environment**: Auto-seeded demo account on startup if the database is blank.

---

## Technical Stack

- **Backend**: Spring Boot 3.3.1, Spring Data JPA, Spring Security, JWT (JJWT), Jakarta validation.
- **Database**:
  - **Development (`dev`)**: In-memory H2 database (runs instantly out-of-the-box).
  - **Production (`prod`)**: MySQL 8.x.
- **Frontend**: HTML5, CSS3 (Glassmorphic variables, flex/grid layouts), Vanilla ES6 JavaScript (No compilation lag, zero dependencies).
- **Build Tool**: Maven Wrapper (`mvnw.cmd` included).

---

## Setup & Running Guide

### Prerequisites
- **Java Development Kit (JDK)**: Version 17 or higher. Ensure `java -version` is available.
- **MySQL Server (Optional)**: Needed only to run the `prod` profile.

---

### Step 1: Quick Run (Development Profile)

TaskNova supports an in-memory database runtime for testing and previewing features immediately.

1. Open a terminal in the project directory.
2. Run the boot server:
   ```cmd
   .\mvnw spring-boot:run
   ```
3. Once the logs show `Started TasknovaApplication`, open your browser and navigate to:
   ```
   http://localhost:8080/
   ```
4. Log in using the automatically seeded demo credentials:
   - **Email**: `demo@tasknova.com`
   - **Password**: `Password123`

---

### Step 2: Configure & Run in Production (MySQL Profile)

To persist tasks permanently using your local MySQL server:

1. Create a MySQL database called `tasknova`:
   ```sql
   CREATE DATABASE tasknova;
   ```
   *(Optionally run the full [schema.sql](schema.sql) script if you wish to pre-create tables; otherwise Hibernate will create them on start).*

2. Open the production properties file: [src/main/resources/application-prod.properties](src/main/resources/application-prod.properties).
3. Update the password to match your local MySQL configuration:
   ```properties
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   ```

4. Enable the production profile by updating the active profile in [src/main/resources/application.properties](src/main/resources/application.properties):
   ```properties
   spring.profiles.active=prod
   ```

5. Start the application:
   ```cmd
   .\mvnw spring-boot:run
   ```

---

## Development & Test Commands

- **Run Tests**:
  ```cmd
  .\mvnw clean test
  ```
- **H2 Database Console**:
  When running the `dev` profile, you can view and query the in-memory database by visiting:
  `http://localhost:8080/h2-console`
  - **JDBC URL**: `jdbc:h2:mem:tasknovadb`
  - **Username**: `sa`
  - **Password**: *(Leave blank)*
