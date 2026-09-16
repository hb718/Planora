const userString = localStorage.getItem('user');
const user = userString ? JSON.parse(userString) : null;
const userId = user ? user.id : null;

if (!userId) {
    alert("Please log in first!");
    window.location.href = "login.html";
}

let globalSubjects = [];
document.addEventListener("DOMContentLoaded", () => {
    loadSubjects();
    loadAssignments();
    setupEventListeners();
});

async function loadSubjects() {
    try {
        const response = await fetch(`/api/subjects/${userId}`);
        globalSubjects = await response.json();

        const subjectListContainer = document.querySelector('.subject-list');
        subjectListContainer.innerHTML =
    '<button class="subject-pill active" id="allSubjectsBtn">All</button>';

document.getElementById('allSubjectsBtn').addEventListener('click', () => {
    showAllAssignments();

    document.querySelectorAll('.subject-pill').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById('allSubjectsBtn').classList.add('active');
});
        globalSubjects.forEach(subj => {
    const btn = document.createElement('button');

    btn.className = 'subject-pill';
    btn.textContent = subj.name;

    btn.addEventListener('click', () => {
        filterBySubject(subj.id);
    });

    subjectListContainer.appendChild(btn);
});

        updateSubjectDropdowns();

    } catch (err) {
        console.error("Error loading subjects:", err);
    }
}

function updateSubjectDropdowns() {
    const dropdowns = document.querySelectorAll('select.subject-select');
    dropdowns.forEach(select => {
        const placeholder = select.options[0];
        select.innerHTML = '';
        if (placeholder) select.appendChild(placeholder);
        globalSubjects.forEach(subj => {
            const opt = document.createElement('option');
            opt.value = subj.id; 
            opt.textContent = subj.name;
            select.appendChild(opt);
        });
    });
}

async function loadAssignments() {
    try {
        const response = await fetch(`/api/assignments/${userId}`);
        const assignments = await response.json();

        assignments.sort((a, b) => {
        return new Date(a.due_date) - new Date(b.due_date);
});

        const activeTable = document.querySelector('.assignment-table:not(.completed-assignment-table)');
        const activeHeader = activeTable.querySelector('.table-header');

        activeTable.innerHTML = '';
        activeTable.appendChild(activeHeader);

        const completedTable = document.querySelector('.completed-assignment-table');
        const completedHeader = completedTable.querySelector('.table-header');

        completedTable.innerHTML = '';
        completedTable.appendChild(completedHeader);

        assignments.forEach(asg => {

            if (asg.status === 'Completed') {
                renderCompletedAssignmentRow(asg);
            } else {
                renderAssignmentRow(asg);
            }

        });

    } catch (err) {
        console.error("Error loading assignments:", err);
    }
}

function filterBySubject(subjectId, clickedButton) {
    const rows = document.querySelectorAll(
        '.assignment-table .table-row'
    );

    rows.forEach(row => {
        if (row.dataset.subjectId == subjectId) {
            row.style.display = 'grid';
        } else {
            row.style.display = 'none';
        }
    });

    document.querySelectorAll('.subject-pill').forEach(btn => {
        btn.classList.remove('active');
    });

    clickedButton.classList.add('active');
}

function showAllAssignments() {
    const rows = document.querySelectorAll(
        '.assignment-table .table-row'
    );

    rows.forEach(row => {
        row.style.display = 'grid';
    });
}

function renderAssignmentRow(asg) {
    const table = document.querySelector('.assignment-table');
    const row = document.createElement('div');
    row.className = 'table-row';
    row.dataset.subjectId = asg.subject_id;
    row.innerHTML = `
        <div class="assignment-column">
            <input type="text" value="${asg.name}" disabled>
        </div>
        <div>
            <input type="text" value="${asg.priority || 'None'}" style="width:100%; border:none; background:transparent;" disabled>
        </div>
        <div>
            <input type="date" class="date-input" value="${asg.due_date || ''}" disabled>
        </div>
        <div>
            <input type="text" value="${asg.subject_name || 'None'}" style="width:100%; border:none; background:transparent;" disabled>
        </div>
        <div>
            <input type="text" value="${asg.type || 'None'}" style="width:100%; border:none; background:transparent;" disabled>
        </div>
        <div>
            <select onchange="updateStatus(${asg.id}, this.value)">
                <option value="Not Started" ${asg.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                <option value="In Progress" ${asg.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Completed" ${asg.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
        </div>
    `;
    table.appendChild(row);
}

function renderCompletedAssignmentRow(asg) {
    const table = document.querySelector('.completed-assignment-table');

    const row = document.createElement('div');

    row.className = 'table-row completed-row';

    row.dataset.subjectId = asg.subject_id;

    row.innerHTML = `
        <div class="assignment-column">
            <input 
                type="text" 
                value="${asg.name}" 
                disabled
            >
        </div>

        <div>
            <input 
                type="text" 
                value="${asg.priority || 'None'}"
                style="width:100%; border:none; background:transparent;"
                disabled
            >
        </div>

        <div>
            <input 
                type="date"
                class="date-input"
                value="${asg.due_date || ''}"
                disabled
            >
        </div>

        <div>
            <input 
                type="text"
                value="${asg.subject_name || 'None'}"
                style="width:100%; border:none; background:transparent;"
                disabled
            >
        </div>

        <div>
            <input 
                type="text"
                value="${asg.type || 'None'}"
                style="width:100%; border:none; background:transparent;"
                disabled
            >
        </div>

        <div>
            <select onchange="updateStatus(${asg.id}, this.value)">
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed" selected>Completed</option>
            </select>
        </div>
    `;

    table.appendChild(row);
}


function setupEventListeners() {

    document.querySelector('.add-subject-btn').addEventListener('click', () => {
        appendEditableSubjectForm();
    });


    document.querySelector('.add-assignment-btn').addEventListener('click', () => {
        appendEditableRow();
    });
}

function appendEditableSubjectForm() {
    const subjectListContainer = document.querySelector('.subject-list');
    
    if (document.querySelector('.new-subject-form-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'new-subject-form-wrapper';
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '5px';

    wrapper.innerHTML = `
        <input type="text" class="new-subject-name" placeholder="New subject..." style="padding: 6px 12px; border-radius: 20px; border: 1px solid #ccc;">
        <button onclick="saveNewSubject(this)" style="padding: 6px 12px; border-radius: 20px; cursor: pointer; background: #222; color: #fff; border: none;">Save</button>
    `;
    
    subjectListContainer.appendChild(wrapper);
    wrapper.querySelector('.new-subject-name').focus();
}

async function saveNewSubject(buttonElt) {
    const wrapper = buttonElt.closest('.new-subject-form-wrapper');
    const subjectNameInput = wrapper.querySelector('.new-subject-name');
    const subjectName = subjectNameInput.value.trim();

    if (!subjectName) {
        alert("Please enter a subject name.");
        return;
    }

    try {
        const response = await fetch('/api/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, name: subjectName })
        });

        const data = await response.json();
        if (response.ok) {
            loadSubjects();
        } else {
            alert(data.error || "Failed to add subject to database.");
        }
    } catch (err) {
        console.error("Error creating subject:", err);
    }
}

function appendEditableRow() {
    const table = document.querySelector('.assignment-table');
    const row = document.createElement('div');
    row.className = 'table-row new-row-form';

    let subjectOptions = globalSubjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    row.innerHTML = `
        <div class="assignment-column"><input type="text" class="new-name" placeholder="Assignment name..."></div>
        <div>
            <select class="new-priority">
                <option selected disabled>Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
            </select>
        </div>
        <div><input type="date" class="date-input new-date"></div>
        <div>
            <select class="new-subject">
                <option selected disabled>Subject</option>
                ${subjectOptions}
            </select>
        </div>
        <div>
            <select class="new-type">
                <option selected disabled>Type</option>
                <option value="Exam">Exam</option>
                <option value="Essay">Essay</option>
                <option value="Project">Project</option>
                <option value="Presentation">Presentation</option>
            </select>
        </div>
        <!-- UPDATED: Wrapped buttons together and added the cancel trigger -->
        <div style="display: flex; gap: 5px;">
            <button onclick="saveNewAssignment(this)">Save</button>
            <button class="cancel-assignment-btn" style="background: #e0e0e0; color: #333; border: none; cursor: pointer; padding: 4px 8px; border-radius: 4px;">Cancel</button>
        </div>
    `;
    table.appendChild(row);
    row.querySelector('.cancel-assignment-btn').addEventListener('click', () => {
        row.remove();
    });
}

async function saveNewAssignment(buttonElt) {
const row = buttonElt.closest('.table-row');


const name = row.querySelector('.new-name').value.trim();
const priority = row.querySelector('.new-priority').value;
const dueDate = row.querySelector('.new-date').value;
const subjectId = row.querySelector('.new-subject').value;
const type = row.querySelector('.new-type').value;

if (!name) {
    alert("Please provide an assignment name.");
    return;
}

if (!priority) {
    alert("Please select a priority.");
    return;
}

if (!type) {
    alert("Please select an assignment type.");
    return;
}

const payload = {
    user_id: parseInt(userId, 10),
    name: name,
    priority: priority,
    due_date: dueDate || null,
    subject_id: subjectId ? parseInt(subjectId, 10) : null,
    type: type,
    status: "Not Started"
};

console.log("Saving assignment:", payload);

try {
    const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
        console.log("Assignment saved:", data);
        loadAssignments();
    } else {
        console.error("Save failed:", data);
        alert(data.error || "Save error encountered.");
    }
} catch (err) {
    console.error("Error saving assignment:", err);
    alert("Could not connect to the server.");
}

}


async function updateStatus(assignmentId, newStatus) {
    try {
        const response = await fetch(`/api/assignments/${assignmentId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Failed to update status.");
            return;
        }

        console.log("Status saved:", newStatus);
        loadAssignments();

    } catch (err) {
        console.error("Error updating assignment status:", err);
    }
}