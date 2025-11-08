const API_URL = 'http://localhost:8080/api/students';
let currentStudents = [];

// Load students on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStudents();
    
    // Add student form submit
    document.getElementById('addStudentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addStudent();
    });
    
    // Edit student form submit
    document.getElementById('editStudentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateStudent();
    });
});

// Show message
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Load all students
async function loadStudents() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to load students');
        }
        const students = await response.json();
        currentStudents = students;
        displayStudents(students);
        updateStudentCount(students.length);
        
        // Clear search fields
        document.getElementById('searchName').value = '';
        document.getElementById('searchCourse').value = '';
        document.getElementById('sortField').value = '';
    } catch (error) {
        showMessage('Error loading students: Unable to connect to server', 'error');
        displayStudents([]);
        updateStudentCount(0);
    }
}

// Update student count
function updateStudentCount(count) {
    const countElement = document.getElementById('studentCount');
    countElement.textContent = `${count} student${count !== 1 ? 's' : ''}`;
}

// Display students
function displayStudents(students) {
    const studentsList = document.getElementById('studentsList');
    
    if (students.length === 0) {
        studentsList.innerHTML = '<div class="empty-state">No students found</div>';
        return;
    }
    
    studentsList.innerHTML = `
        <div class="table-container">
            <table class="students-table">
                <thead>
                    <tr>
                        <th>Avatar</th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Course</th>
                        <th>Age</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(student => `
                        <tr>
                            <td>
                                <div class="table-avatar">${student.name.charAt(0).toUpperCase()}</div>
                            </td>
                            <td><span class="student-id-badge">${student.id}</span></td>
                            <td><strong>${student.name}</strong></td>
                            <td>${student.email}</td>
                            <td><span class="course-badge">${student.course}</span></td>
                            <td>${student.age}</td>
                            <td>
                                <div class="table-actions">
                                    <button onclick="openEditModal(${student.id})" class="btn-icon btn-edit" title="Edit">
                                        Edit
                                    </button>
                                    <button onclick="deleteStudent(${student.id})" class="btn-icon btn-danger" title="Delete">
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Add student
async function addStudent() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const course = document.getElementById('course').value.trim();
    const age = document.getElementById('age').value;
    
    // Client-side validation
    if (!name) {
        showMessage('Name is required', 'error');
        return;
    }
    
    if (!email) {
        showMessage('Email is required', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (!course) {
        showMessage('Course is required', 'error');
        return;
    }
    
    if (!age || age <= 18) {
        showMessage('Age must be greater than 18', 'error');
        return;
    }
    
    const student = {
        name: name,
        email: email,
        course: course,
        age: parseInt(age)
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(student)
        });
        
        if (response.ok) {
            showMessage('Student added successfully!', 'success');
            document.getElementById('addStudentForm').reset();
            loadStudents();
        } else {
            const error = await response.json();
            if (error.errors) {
                // Handle validation errors
                const errorMessages = Object.entries(error.errors)
                    .map(([field, message]) => `${field}: ${message}`)
                    .join(', ');
                showMessage('Validation Error: ' + errorMessages, 'error');
            } else {
                showMessage('Error: ' + (error.message || 'Failed to add student'), 'error');
            }
        }
    } catch (error) {
        showMessage('Network error: Unable to connect to server', 'error');
    }
}

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Search students
async function searchStudents() {
    const name = document.getElementById('searchName').value.trim();
    const course = document.getElementById('searchCourse').value.trim();
    
    if (!name && !course) {
        showMessage('Please enter a search term', 'error');
        return;
    }
    
    let url = `${API_URL}/search?`;
    if (name) url += `name=${encodeURIComponent(name)}&`;
    if (course) url += `course=${encodeURIComponent(course)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Search failed');
        }
        const students = await response.json();
        currentStudents = students;
        displayStudents(students);
        updateStudentCount(students.length);
        
        if (students.length === 0) {
            showMessage('No students found matching your search', 'info');
        }
    } catch (error) {
        showMessage('Error searching students: Unable to connect to server', 'error');
    }
}

// Sort students
function sortStudents() {
    const sortField = document.getElementById('sortField').value;
    const sortOrder = document.getElementById('sortOrder').value;
    
    if (!sortField) {
        displayStudents(currentStudents);
        return;
    }
    
    const sortedStudents = [...currentStudents].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        // Handle string comparison
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    displayStudents(sortedStudents);
}

// Open edit modal
async function openEditModal(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                showMessage('Error: Student not found', 'error');
                loadStudents();
                return;
            }
            throw new Error('Failed to load student');
        }
        const student = await response.json();
        
        document.getElementById('editId').value = student.id;
        document.getElementById('editName').value = student.name;
        document.getElementById('editEmail').value = student.email;
        document.getElementById('editCourse').value = student.course;
        document.getElementById('editAge').value = student.age;
        
        document.getElementById('editModal').style.display = 'block';
    } catch (error) {
        showMessage('Error loading student: Unable to connect to server', 'error');
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Update student
async function updateStudent() {
    const id = document.getElementById('editId').value;
    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const course = document.getElementById('editCourse').value.trim();
    const age = document.getElementById('editAge').value;
    
    // Client-side validation
    if (!name) {
        showMessage('Name is required', 'error');
        return;
    }
    
    if (!email) {
        showMessage('Email is required', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (!course) {
        showMessage('Course is required', 'error');
        return;
    }
    
    if (!age || age <= 18) {
        showMessage('Age must be greater than 18', 'error');
        return;
    }
    
    const student = {
        name: name,
        email: email,
        course: course,
        age: parseInt(age)
    };
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(student)
        });
        
        if (response.ok) {
            showMessage('Student updated successfully!', 'success');
            closeEditModal();
            loadStudents();
        } else {
            const error = await response.json();
            if (error.errors) {
                // Handle validation errors
                const errorMessages = Object.entries(error.errors)
                    .map(([field, message]) => `${field}: ${message}`)
                    .join(', ');
                showMessage('Validation Error: ' + errorMessages, 'error');
            } else {
                showMessage('Error: ' + (error.message || 'Failed to update student'), 'error');
            }
        }
    } catch (error) {
        showMessage('Network error: Unable to connect to server', 'error');
    }
}

// Delete student
async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Student deleted successfully!', 'success');
            loadStudents();
        } else if (response.status === 404) {
            showMessage('Error: Student not found', 'error');
            loadStudents();
        } else {
            const error = await response.json();
            showMessage('Error: ' + (error.message || 'Failed to delete student'), 'error');
        }
    } catch (error) {
        showMessage('Network error: Unable to connect to server', 'error');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target == modal) {
        closeEditModal();
    }
}
