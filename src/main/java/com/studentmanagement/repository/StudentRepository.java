package com.studentmanagement.repository;

import com.studentmanagement.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByNameContainingIgnoreCase(String name);
    List<Student> findByCourseContainingIgnoreCase(String course);
    List<Student> findByNameContainingIgnoreCaseAndCourseContainingIgnoreCase(String name, String course);
    Optional<Student> findByEmail(String email);
    
    // Paginated methods
    Page<Student> findByNameContainingIgnoreCase(String name, Pageable pageable);
    Page<Student> findByCourseContainingIgnoreCase(String course, Pageable pageable);
    Page<Student> findByNameContainingIgnoreCaseAndCourseContainingIgnoreCase(String name, String course, Pageable pageable);
}
