package com.studentmanagement.service;

import com.studentmanagement.entity.Student;
import com.studentmanagement.exception.DuplicateEmailException;
import com.studentmanagement.exception.ResourceNotFoundException;
import com.studentmanagement.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {
    
    @Autowired
    private StudentRepository studentRepository;
    
    public Student addStudent(Student student) {
        Optional<Student> existingStudent = studentRepository.findByEmail(student.getEmail());
        if (existingStudent.isPresent()) {
            throw new DuplicateEmailException("Email already exists: " + student.getEmail());
        }
        return studentRepository.save(student);
    }
    
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }
    
    public Student getStudentById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
    }
    
    public Student updateStudent(Long id, Student studentDetails) {
        Student student = getStudentById(id);
        
        // Check if email is being changed and if new email already exists
        if (!student.getEmail().equals(studentDetails.getEmail())) {
            Optional<Student> existingStudent = studentRepository.findByEmail(studentDetails.getEmail());
            if (existingStudent.isPresent()) {
                throw new DuplicateEmailException("Email already exists: " + studentDetails.getEmail());
            }
        }
        
        student.setName(studentDetails.getName());
        student.setEmail(studentDetails.getEmail());
        student.setCourse(studentDetails.getCourse());
        student.setAge(studentDetails.getAge());
        return studentRepository.save(student);
    }
    
    public void deleteStudent(Long id) {
        Student student = getStudentById(id);
        studentRepository.delete(student);
    }
    
    public List<Student> searchStudents(String name, String course) {
        if (name != null && course != null) {
            return studentRepository.findByNameContainingIgnoreCaseAndCourseContainingIgnoreCase(name, course);
        } else if (name != null) {
            return studentRepository.findByNameContainingIgnoreCase(name);
        } else if (course != null) {
            return studentRepository.findByCourseContainingIgnoreCase(course);
        } else {
            return studentRepository.findAll();
        }
    }
    
    public Page<Student> getStudentsPaginated(Pageable pageable) {
        return studentRepository.findAll(pageable);
    }
    
    public Page<Student> searchStudentsPaginated(String name, String course, Pageable pageable) {
        if (name != null && course != null) {
            return studentRepository.findByNameContainingIgnoreCaseAndCourseContainingIgnoreCase(name, course, pageable);
        } else if (name != null) {
            return studentRepository.findByNameContainingIgnoreCase(name, pageable);
        } else if (course != null) {
            return studentRepository.findByCourseContainingIgnoreCase(course, pageable);
        } else {
            return studentRepository.findAll(pageable);
        }
    }
}
