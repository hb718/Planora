 const dateElement =
        document.getElementById("current-date");

    const today = new Date();

    dateElement.textContent =
        today.toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });

    // LOAD LOGGED-IN USER


    const savedUser =
        localStorage.getItem("user");


    if (savedUser) {

        const user =
            JSON.parse(savedUser);


        // Name
        document.getElementById(
            "profile-name"
        ).textContent = user.name;


        // Email
        document.getElementById(
            "profile-email"
        ).textContent = user.email;


        // Create initials
        const nameParts =
            user.name.trim().split(" ");


        let initials = "";


        if (nameParts.length >= 2) {

            initials =
                nameParts[0].charAt(0) +
                nameParts[nameParts.length - 1].charAt(0);

        } else {

            initials =
                nameParts[0].substring(0, 2);

        }


        document.getElementById(
            "profile-avatar"
        ).textContent =
            initials.toUpperCase();

    } else {

        // No user is logged in

        document.getElementById(
            "profile-name"
        ).textContent =
            "Not logged in";


        document.getElementById(
            "profile-email"
        ).textContent =
            "Please log in";


        document.getElementById(
            "profile-avatar"
        ).textContent =
            "?";

    }
// ========================================
// MINI TO-DO LIST
// ========================================

async function loadMiniTodos(userId) {
    const todoList = document.getElementById("mini-todo-list");

    if (!todoList) {
        return;
    }

    try {
        const response = await fetch(`/api/tasks/${userId}`);
        const tasks = await response.json();

        if (!response.ok) {
            todoList.innerHTML = `
                <p class="mini-empty">
                    Could not load tasks.
                </p>
            `;
            return;
        }

        // Only show incomplete tasks
        const incompleteTasks = tasks.filter(
            task => task.completed === 0
        );

        // Only show 3
        const miniTasks = incompleteTasks.slice(0, 3);

        if (miniTasks.length === 0) {
            todoList.innerHTML = `
                <p class="mini-empty">
                    No tasks to do!
                </p>
            `;
            return;
        }

        todoList.innerHTML = "";

        miniTasks.forEach(task => {
            const taskElement = document.createElement("div");

            taskElement.className = "mini-item";

            taskElement.innerHTML = `
                <div class="mini-item-main">
                    <strong>${task.name}</strong>
                    <span>${task.category}</span>
                </div>
            `;

            todoList.appendChild(taskElement);
        });

    } catch (error) {
        console.error("Error loading mini to-do list:", error);

        todoList.innerHTML = `
            <p class="mini-empty">
                Could not connect to server.
            </p>
        `;
    }
}


// ========================================
// MINI ASSIGNMENTS
// ========================================

async function loadMiniAssignments(userId) {
    const assignmentList =
        document.getElementById("mini-assignment-list");

    if (!assignmentList) {
        return;
    }

    try {
        const response =
            await fetch(`/api/assignments/${userId}`);

        const assignments =
            await response.json();

        if (!response.ok) {
            assignmentList.innerHTML = `
                <p class="mini-empty">
                    Could not load assignments.
                </p>
            `;
            return;
        }
        const activeAssignments =
            assignments.filter(
                assignment =>
                    assignment.status !== "Completed"
            );

        activeAssignments.sort((a, b) => {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;

            return new Date(a.due_date) -
                   new Date(b.due_date);
        });

        const miniAssignments =
            activeAssignments.slice(0, 3);

        if (miniAssignments.length === 0) {
            assignmentList.innerHTML = `
                <p class="mini-empty">
                    No upcoming assignments!
                </p>
            `;
            return;
        }

        assignmentList.innerHTML = "";

        miniAssignments.forEach(assignment => {
            const assignmentElement =
                document.createElement("div");

            assignmentElement.className = "mini-item";

            assignmentElement.innerHTML = `
                <div class="mini-item-main">
                    <strong>${assignment.name}</strong>

                    <span>
                        ${assignment.subject_name || "No subject"}
                    </span>
                </div>

                <div class="mini-date">
                    ${
                        assignment.due_date
                            ? new Date(
                                assignment.due_date
                              ).toLocaleDateString(
                                "en-AU",
                                {
                                    day: "numeric",
                                    month: "short"
                                }
                              )
                            : "No date"
                    }
                </div>
            `;

            assignmentList.appendChild(
                assignmentElement
            );
        });

    } catch (error) {
        console.error(
            "Error loading mini assignments:",
            error
        );

        assignmentList.innerHTML = `
            <p class="mini-empty">
                Could not connect to server.
            </p>
        `;
    }
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const savedUser =
            localStorage.getItem("user");

        if (!savedUser) {
            return;
        }

        const user =
            JSON.parse(savedUser);

        loadMiniTodos(user.id);
        loadMiniAssignments(user.id);
    }
);

/* statistics */

async function loadAccountStats(userId) {
    try {
        // Get tasks
        const taskResponse =
            await fetch(`/api/tasks/${userId}`);

        const tasks =
            await taskResponse.json();

        if (!taskResponse.ok) {
            console.error("Could not load tasks.");
            return;
        }


        // Get assignments
        const assignmentResponse =
            await fetch(`/api/assignments/${userId}`);

        const assignments =
            await assignmentResponse.json();

        if (!assignmentResponse.ok) {
            console.error("Could not load assignments.");
            return;
        }


        // Count incomplete tasks
        const incompleteTasks =
            tasks.filter(
                task => task.completed === 0
            ).length;


        // Count incomplete assignments
        const incompleteAssignments =
            assignments.filter(
                assignment =>
                    assignment.status !== "Completed"
            ).length;


        // Count completed tasks
        const completedTasks =
            tasks.filter(
                task => task.completed === 1
            ).length;


        // Count completed assignments
        const completedAssignments =
            assignments.filter(
                assignment =>
                    assignment.status === "Completed"
            ).length;


        // Total completed
        const totalCompleted =
            completedTasks +
            completedAssignments;


        // Put numbers onto the page
        document.getElementById(
            "todo-count"
        ).textContent = incompleteTasks;


        document.getElementById(
            "assignment-count"
        ).textContent = incompleteAssignments;


        document.getElementById(
            "completed-count"
        ).textContent = totalCompleted;

    } catch (error) {
        console.error(
            "Error loading account statistics:",
            error
        );
    }
}


/* load statistics */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const savedUser =
            localStorage.getItem("user");

        if (!savedUser) {
            return;
        }

        const user =
            JSON.parse(savedUser);

        loadAccountStats(user.id);
    }
)
