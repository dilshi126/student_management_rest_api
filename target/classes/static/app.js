const API_URL = 'http://localhost:8080/api/students';
let currentStudents = [];

// Load students on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStudents();
    
    // Create toast container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.id = 'toastContainer';
    document.body.appendChild(toastContainer);
    
    // Add student form submit
    document.getElementById('addStudentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        clearFormErrors('addStudentForm');
        addStudent();
    });
    
    // Edit student form submit
    document.getElementById('editStudentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        clearFormErrors('editStudentForm');
        updateStudent();
    });
});

// Show toast notification
function showToast(message, type = 'info', title = null) {
    const toastContainer = document.getElementById('toastContainer');
    
    // Set default titles based on type
    if (!title) {
        const titles = {
            success: '✓ Success',
            error: '✗ Error',
            info: 'ℹ Information',
            warning: '⚠ Warning'
        };
        title = titles[type] || 'Notification';
    }
    
    // Get icon based on type
    const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ',
        warning: '⚠'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Show inline field error
function showFieldError(formId, fieldName, errorMessage) {
    const form = document.getElementById(formId);
    const input = form.querySelector(`#${fieldName}`);
    
    if (!input) return;
    
    const formGroup = input.closest('.form-group');
    formGroup.classList.add('has-error');
    
    // Remove existing error message
    const existingError = formGroup.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = errorMessage;
    formGroup.appendChild(errorDiv);
}

// Clear all form errors
function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    const errorGroups = form.querySelectorAll('.form-group.has-error');
    
    errorGroups.forEach(group => {
        group.classList.remove('has-error');
        const errorMsg = group.querySelector('.field-error');
        if (errorMsg) errorMsg.remove();
    });
}

// Handle validation errors
function handleValidationErrors(errors, formId) {
    let errorCount = 0;
    const errorMessages = [];
    
    for (const [field, message] of Object.entries(errors)) {
        errorCount++;
        errorMessages.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${message}`);
        showFieldError(formId, field, message);
    }
    
    // Show toast with summary
    if (errorCount === 1) {
        showToast(errorMessages[0], 'error', 'Validation Error');
    } else {
        showToast(`Please fix ${errorCount} validation errors in the form`, 'error', 'Validation Failed');
    }
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
        showToast('Unable to connect to server. Please check your connection.', 'error', 'Connection Error');
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
            showToast(`${name} has been added successfully!`, 'success', 'Student Added');
            document.getElementById('addStudentForm').reset();
            clearFormErrors('addStudentForm');
            loadStudents();
        } else {
            const error = await response.json();
            if (error.errors) {
                // Handle validation errors (field-specific)
                handleValidationErrors(error.errors, 'addStudentForm');
            } else if (response.status === 409) {
                // Handle duplicate email (conflict)
                showFieldError('addStudentForm', 'email', 'This email is already registered');
                showToast(error.message || 'Email already exists. Please use a different email address.', 'error', 'Duplicate Email');
            } else {
                showToast(error.message || 'Failed to add student', 'error', 'Error');
            }
        }
    } catch (error) {
        showToast('Unable to connect to server. Please check your connection.', 'error', 'Network Error');
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
        showToast('Please enter a name or course to search', 'warning', 'Search Required');
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
            showToast('No students found matching your search criteria', 'info', 'No Results');
        } else {
            showToast(`Found ${students.length} student${students.length !== 1 ? 's' : ''}`, 'success', 'Search Complete');
        }
    } catch (error) {
        showToast('Unable to connect to server. Please check your connection.', 'error', 'Search Error');
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
                showToast('Student not found. The record may have been deleted.', 'error', 'Not Found');
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
        showToast('Unable to load student data. Please try again.', 'error', 'Load Error');
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
    let hasError = false;
    
    if (!name) {
        showFieldError('editStudentForm', 'editName', 'Name is required');
        hasError = true;
    }
    
    if (!email) {
        showFieldError('editStudentForm', 'editEmail', 'Email is required');
        hasError = true;
    } else if (!validateEmail(email)) {
        showFieldError('editStudentForm', 'editEmail', 'Please enter a valid email address');
        hasError = true;
    }
    
    if (!course) {
        showFieldError('editStudentForm', 'editCourse', 'Course is required');
        hasError = true;
    }
    
    if (!age || age <= 18) {
        showFieldError('editStudentForm', 'editAge', 'Age must be greater than 18');
        hasError = true;
    }
    
    if (hasError) {
        showToast('Please fill in all required fields correctly', 'error', 'Validation Error');
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
            showToast(`${name}'s information has been updated successfully!`, 'success', 'Student Updated');
            closeEditModal();
            loadStudents();
        } else {
            const error = await response.json();
            if (error.errors) {
                // Handle validation errors (field-specific)
                const mappedErrors = {};
                for (const [field, message] of Object.entries(error.errors)) {
                    mappedErrors['edit' + field.charAt(0).toUpperCase() + field.slice(1)] = message;
                }
                handleValidationErrors(mappedErrors, 'editStudentForm');
            } else if (response.status === 409) {
                // Handle duplicate email (conflict)
                showFieldError('editStudentForm', 'editEmail', 'This email is already registered');
                showToast(error.message || 'Email already exists. Please use a different email address.', 'error', 'Duplicate Email');
            } else {
                showToast(error.message || 'Failed to update student', 'error', 'Update Error');
            }
        }
    } catch (error) {
        showToast('Unable to connect to server. Please check your connection.', 'error', 'Network Error');
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
            showToast('Student has been deleted successfully', 'success', 'Student Deleted');
            loadStudents();
        } else if (response.status === 404) {
            showToast('Student not found. The record may have already been deleted.', 'error', 'Not Found');
            loadStudents();
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to delete student', 'error', 'Delete Error');
        }
    } catch (error) {
        showToast('Unable to connect to server. Please check your connection.', 'error', 'Network Error');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target == modal) {
        closeEditModal();
    }
}
