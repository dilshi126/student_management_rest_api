// Use relative URL so it works with both localhost and ngrok
const API_URL = '/api/students';
let currentStudents = [];
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let usePagination = true;

// Load students on page load
document.addEventListener('DOMContentLoaded', function () {
    loadStudents();

    // Create toast container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.id = 'toastContainer';
    document.body.appendChild(toastContainer);

    // Add student form submit
    document.getElementById('addStudentForm').addEventListener('submit', function (e) {
        e.preventDefault();
        clearFormErrors('addStudentForm');
        addStudent();
    });

    // Edit student form submit
    document.getElementById('editStudentForm').addEventListener('submit', function (e) {
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
async function loadStudents(page = 0) {
    try {
        let url;
        if (usePagination) {
            const sortField = document.getElementById('sortField')?.value || 'id';
            const sortOrder = document.getElementById('sortOrder')?.value || 'asc';
            url = `${API_URL}/paginated?page=${page}&size=${pageSize}&sortBy=${sortField}&sortDir=${sortOrder}`;
        } else {
            url = API_URL;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to load students');
        }

        if (usePagination) {
            const data = await response.json();
            currentStudents = data.students;
            currentPage = data.currentPage;
            totalPages = data.totalPages;
            displayStudents(data.students);
            updateStudentCount(data.totalItems);
            updatePagination(data);
        } else {
            const students = await response.json();
            currentStudents = students;
            displayStudents(students);
            updateStudentCount(students.length);
        }

        // Clear search fields
        document.getElementById('searchName').value = '';
        document.getElementById('searchCourse').value = '';
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
async function searchStudents(page = 0) {
    const name = document.getElementById('searchName').value.trim();
    const course = document.getElementById('searchCourse').value.trim();

    if (!name && !course) {
        showToast('Please enter a name or course to search', 'warning', 'Search Required');
        return;
    }

    try {
        let url;
        if (usePagination) {
            const sortField = document.getElementById('sortField')?.value || 'id';
            const sortOrder = document.getElementById('sortOrder')?.value || 'asc';
            url = `${API_URL}/paginated/search?page=${page}&size=${pageSize}&sortBy=${sortField}&sortDir=${sortOrder}`;
            if (name) url += `&name=${encodeURIComponent(name)}`;
            if (course) url += `&course=${encodeURIComponent(course)}`;
        } else {
            url = `${API_URL}/search?`;
            if (name) url += `name=${encodeURIComponent(name)}&`;
            if (course) url += `course=${encodeURIComponent(course)}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Search failed');
        }

        if (usePagination) {
            const data = await response.json();
            currentStudents = data.students;
            currentPage = data.currentPage;
            totalPages = data.totalPages;
            displayStudents(data.students);
            updateStudentCount(data.totalItems);
            updatePagination(data);

            if (data.totalItems === 0) {
                showToast('No students found matching your search criteria', 'info', 'No Results');
            } else {
                showToast(`Found ${data.totalItems} student${data.totalItems !== 1 ? 's' : ''}`, 'success', 'Search Complete');
            }
        } else {
            const students = await response.json();
            currentStudents = students;
            displayStudents(students);
            updateStudentCount(students.length);

            if (students.length === 0) {
                showToast('No students found matching your search criteria', 'info', 'No Results');
            } else {
                showToast(`Found ${students.length} student${students.length !== 1 ? 's' : ''}`, 'success', 'Search Complete');
            }
        }
    } catch (error) {
        showToast('Unable to connect to server. Please check your connection.', 'error', 'Search Error');
    }
}

// Sort students
function sortStudents() {
    if (usePagination) {
        // Reload with new sort parameters
        const name = document.getElementById('searchName').value.trim();
        const course = document.getElementById('searchCourse').value.trim();

        if (name || course) {
            searchStudents(0);
        } else {
            loadStudents(0);
        }
    } else {
        // Client-side sorting
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
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'none';
        clearFormErrors('editStudentForm');
        document.getElementById('editStudentForm').reset();
    }
}

// Make function globally accessible for inline onclick
window.closeEditModal = closeEditModal;

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

// Pagination functions
function updatePagination(data) {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;

    let paginationHTML = '<div class="pagination">';

    // Left section - Previous button
    paginationHTML += '<div class="pagination-left">';
    paginationHTML += `
        <button class="pagination-btn pagination-nav" ${!data.hasPrevious ? 'disabled' : ''} onclick="goToPage(${data.currentPage - 1})" title="Previous Page">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Previous</span>
        </button>
    `;
    paginationHTML += '</div>';

    // Center section - Page numbers (only show if more than 1 page)
    paginationHTML += '<div class="pagination-center">';

    if (data.totalPages > 1) {
        const startPage = Math.max(0, data.currentPage - 2);
        const endPage = Math.min(data.totalPages - 1, data.currentPage + 2);

        if (startPage > 0) {
            paginationHTML += `<button class="pagination-btn" onclick="goToPage(0)">1</button>`;
            if (startPage > 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === data.currentPage ? 'active' : ''}" onclick="goToPage(${i})">
                    ${i + 1}
                </button>
            `;
        }

        if (endPage < data.totalPages - 1) {
            if (endPage < data.totalPages - 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="goToPage(${data.totalPages - 1})">${data.totalPages}</button>`;
        }
    } else {
        // Show page info when only 1 page
        paginationHTML += `<span class="pagination-info">Page 1 of 1</span>`;
    }

    paginationHTML += '</div>';

    // Right section - Next button and page size selector
    paginationHTML += '<div class="pagination-right">';
    paginationHTML += `
        <button class="pagination-btn pagination-nav" ${!data.hasNext ? 'disabled' : ''} onclick="goToPage(${data.currentPage + 1})" title="Next Page">
            <span>Next</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </button>
        <select class="page-size-selector" onchange="changePageSize(this.value)">
            <option value="5" ${pageSize === 5 ? 'selected' : ''}>5 / page</option>
            <option value="10" ${pageSize === 10 ? 'selected' : ''}>10 / page</option>
            <option value="20" ${pageSize === 20 ? 'selected' : ''}>20 / page</option>
            <option value="50" ${pageSize === 50 ? 'selected' : ''}>50 / page</option>
        </select>
    `;
    paginationHTML += '</div>';

    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
}

function goToPage(page) {
    const name = document.getElementById('searchName').value.trim();
    const course = document.getElementById('searchCourse').value.trim();

    if (name || course) {
        searchStudents(page);
    } else {
        loadStudents(page);
    }
}

function changePageSize(newSize) {
    pageSize = parseInt(newSize);
    goToPage(0);
}

function togglePagination() {
    usePagination = !usePagination;
    const toggleBtn = document.getElementById('paginationToggle');
    if (toggleBtn) {
        toggleBtn.textContent = usePagination ? 'Disable Pagination' : 'Enable Pagination';
    }
    loadStudents(0);
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('editModal');
    if (event.target == modal) {
        closeEditModal();
    }
}
