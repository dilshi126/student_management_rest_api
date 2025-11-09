# Student Management REST API

A simple Student Management REST API built with Spring Boot 3+, Spring Data JPA, and H2 Database.

## Features

- Add Student (POST)
- Get All Students (GET)
- Get Student By ID (GET)
- Update Student (PUT)
- Delete Student (DELETE)
- **Pagination Support** (Backend & Frontend)
  - Server-side pagination with Spring Data
  - Client-side pagination toggle
  - Configurable page size (5, 10, 20, 50)
  - Page navigation with Previous/Next buttons
  - Direct page number selection
- Search & Filter with pagination
- Sorting with pagination support
- Field validation (email format, age > 18, not null, unique email)
- Service Layer architecture
- Global Exception Handling
- Modern responsive UI with toast notifications
- Swagger UI documentation

## Technologies Used

- Spring Boot 3.2.0
- Spring Data JPA
- PostgreSQL Database
- Spring Validation
- Swagger/OpenAPI 3

## Student Entity

Fields:
- `id` (Long) - Auto-generated
- `name` (String) - Required
- `email` (String) - Required, valid email format, unique
- `course` (String) - Required
- `age` (Integer) - Required, must be > 18

## Setup & Run

### Prerequisites
- Java 17 or higher
- Maven 3.6+

### Steps to Run

1. Clone the repository
```bash
git clone <repository-url>
cd student-api
```

2. Build the project
```bash
mvn clean install
```

3. Run the application
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

## API Endpoints

### Pagination Support

The API now supports both paginated and non-paginated endpoints for better performance with large datasets.

### 1. Add Student
**POST** `/api/students`

Request Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "course": "Computer Science",
  "age": 20
}
```

Response: `201 CREATED`

### 2. Get All Students
**GET** `/api/students`

Response: `200 OK`
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "course": "Computer Science",
    "age": 20
  }
]
```

### 3. Get Student By ID
**GET** `/api/students/{id}`

Response: `200 OK` or `404 NOT FOUND`

### 4. Update Student
**PUT** `/api/students/{id}`

Request Body:
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "course": "Data Science",
  "age": 21
}
```

Response: `200 OK` or `404 NOT FOUND`

### 5. Delete Student
**DELETE** `/api/students/{id}`

Response: `204 NO CONTENT` or `404 NOT FOUND`

### 6. Get Students (Paginated)
**GET** `/api/students/paginated?page=0&size=10&sortBy=id&sortDir=asc`

Query Parameters:
- `page` (optional, default: 0) - Page number (0-indexed)
- `size` (optional, default: 10) - Number of items per page
- `sortBy` (optional, default: id) - Field to sort by (id, name, email, course, age)
- `sortDir` (optional, default: asc) - Sort direction (asc or desc)

Response: `200 OK`
```json
{
  "students": [...],
  "currentPage": 0,
  "totalItems": 50,
  "totalPages": 5,
  "pageSize": 10,
  "hasNext": true,
  "hasPrevious": false
}
```

### 7. Search Students (Paginated)
**GET** `/api/students/paginated/search?name=John&course=CS&page=0&size=10&sortBy=name&sortDir=asc`

Query Parameters:
- `name` (optional) - Search by name (case-insensitive, partial match)
- `course` (optional) - Search by course (case-insensitive, partial match)
- `page` (optional, default: 0) - Page number
- `size` (optional, default: 10) - Items per page
- `sortBy` (optional, default: id) - Sort field
- `sortDir` (optional, default: asc) - Sort direction

Response: Same as paginated endpoint

## Database Setup

### PostgreSQL Installation

1. **Install PostgreSQL:**
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql`
   - Windows: Download from https://www.postgresql.org/download/

2. **Start PostgreSQL:**
   - macOS: `brew services start postgresql`
   - Ubuntu: `sudo service postgresql start`
   - Windows: Start from Services

3. **Create Database:**
```bash
psql -U postgres
CREATE DATABASE studentdb;
\q
```

4. **Update credentials in `application.properties` if needed:**
```properties
spring.datasource.username=postgres
spring.datasource.password=your_password
```

## Testing with Postman

1. Import the API endpoints into Postman
2. Set the base URL to `http://localhost:8080`
3. Test each endpoint with sample data

### Sample Postman Tests:

**Add Student:**
- Method: POST
- URL: `http://localhost:8080/api/students`
- Body (JSON):
```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "course": "Mathematics",
  "age": 22
}
```

**Get All Students:**
- Method: GET
- URL: `http://localhost:8080/api/students`

**Get Student By ID:**
- Method: GET
- URL: `http://localhost:8080/api/students/1`

**Update Student:**
- Method: PUT
- URL: `http://localhost:8080/api/students/1`
- Body (JSON):
```json
{
  "name": "Alice Updated",
  "email": "alice.updated@example.com",
  "course": "Physics",
  "age": 23
}
```

**Delete Student:**
- Method: DELETE
- URL: `http://localhost:8080/api/students/1`

## Swagger UI

Access Swagger UI at: `http://localhost:8080/swagger-ui.html`

This provides interactive API documentation where you can test all endpoints directly from the browser.

## PostgreSQL Database Access

You can access the PostgreSQL database using:
- **pgAdmin**: GUI tool for PostgreSQL
- **psql**: Command-line tool
  ```bash
  psql -U postgres -d studentdb
  ```
- **DBeaver**: Universal database tool

## Error Handling

The API returns proper HTTP status codes:
- `200 OK` - Successful GET/PUT
- `201 CREATED` - Successful POST
- `204 NO CONTENT` - Successful DELETE
- `400 BAD REQUEST` - Validation errors (invalid format, missing fields)
- `404 NOT FOUND` - Resource not found
- `409 CONFLICT` - Duplicate email address
- `500 INTERNAL SERVER ERROR` - Server errors

### Error Response Format

**Validation Errors (400):**
```json
{
  "timestamp": "2024-11-08T10:30:00",
  "status": 400,
  "error": "Validation Failed",
  "errors": {
    "email": "Email should be valid",
    "age": "Age must be greater than 18"
  },
  "path": "/api/students"
}
```

**Duplicate Email (409):**
```json
{
  "timestamp": "2024-11-08T10:30:00",
  "status": 409,
  "error": "Duplicate Email",
  "message": "Email already exists: john@example.com",
  "path": "/api/students"
}
```

**Resource Not Found (404):**
```json
{
  "timestamp": "2024-11-08T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Student not found with id: 1",
  "path": "/api/students/1"
}
```

## Validation Rules

- **Name**: Cannot be blank
  - Error: "Name is required"
- **Email**: Must be valid email format, cannot be blank, must be unique
  - Error: "Email is required"
  - Error: "Email should be valid"
  - Error: "Email already exists: [email]" (409 Conflict)
- **Course**: Cannot be blank
  - Error: "Course is required"
- **Age**: Must be greater than 18
  - Error: "Age is required"
  - Error: "Age must be greater than 18"

## Project Structure

```
src/
├── main/
│   ├── java/com/studentmanagement/
│   │   ├── StudentManagementApplication.java
│   │   ├── controller/
│   │   │   └── StudentController.java
│   │   ├── entity/
│   │   │   └── Student.java
│   │   ├── repository/
│   │   │   └── StudentRepository.java
│   │   ├── service/
│   │   │   └── StudentService.java
│   │   └── exception/
│   │       ├── ResourceNotFoundException.java
│   │       ├── ErrorResponse.java
│   │       └── GlobalExceptionHandler.java
│   └── resources/
│       └── application.properties
└── test/
```

## Author

[Your Name]

## License

This project is open source and available under the MIT License.
