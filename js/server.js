const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;
app.use(express.json());

const db = new sqlite3.Database(
    path.join(__dirname, "dev.db"),
    (err) => {

        if (err) {
            console.error(
                "Database error:",
                err.message
            );
            return;
        }

        console.log(
            "Connected to the SQLite database."
        );
    }
);

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student'
        )
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`);

    db.run(`
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, name)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')),
            due_date TEXT,
            subject_id INTEGER,
            type TEXT CHECK(type IN ('Exam', 'Essay', 'Project', 'Presentation')),
            status TEXT DEFAULT 'Not Started'
                CHECK(status IN ('Not Started', 'In Progress', 'Completed')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS calendar_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            event_name TEXT NOT NULL,
            event_date TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS study_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            subject_id INTEGER,
            subject_name TEXT NOT NULL,
            seconds INTEGER NOT NULL,
            session_date TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (subject_id) REFERENCES subjects(id)
        )
    `);

});

/* register */

app.post("/api/register", (req, res) => {

    const {
        name,
        email,
        password,
        role
    } = req.body;


    if (
        !name ||
        !email ||
        !password ||
        !role
    ) {

        return res.status(400).json({
            error: "All fields are required."
        });

    }

    if (
        role !== "student" &&
        role !== "other"
    ) {

        return res.status(400).json({
            error: "Invalid account type."
        });

    }

    const sql = `
        INSERT INTO users (
            name,
            email,
            password,
            role
        )
        VALUES (?, ?, ?, ?)
    `;


    db.run(
        sql,
        [
            name,
            email,
            password,
            role
        ],
        function (err) {

            if (err) {

                if (
                    err.message.includes(
                        "UNIQUE constraint failed"
                    )
                ) {

                    return res.status(400).json({
                        error:
                            "Email already registered."
                    });

                }


                console.error(
                    "Registration database error:",
                    err.message
                );


                return res.status(500).json({
                    error:
                        "Failed to create account."
                });

            }


            res.status(201).json({

                message:
                    "Registration successful!"

            });

        }
    );

});



app.post("/api/login", (req, res) => {

    const {
        email,
        password
    } = req.body;


    if (!email || !password) {

        return res.status(400).json({
            error:
                "Email and password are required."
        });

    }


    const sql = `
        SELECT *
        FROM users
        WHERE email = ?
        AND password = ?
    `;


    db.get(
        sql,
        [
            email,
            password
        ],
        (err, row) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }


            if (!row) {

                return res.status(400).json({
                    error:
                        "Invalid email or password."
                });

            }


            res.json({

                message:
                    "Login successful!",

                user: {

                    id: row.id,

                    name: row.name,

                    email: row.email,

                    role: row.role

                }

            });

        }
    );

});

app.get("/api/tasks/:userId", (req, res) => {

    const userId =
        req.params.userId;


    const sql = `
        SELECT *
        FROM tasks
        WHERE user_id = ?
        ORDER BY id DESC
    `;


    db.all(
        sql,
        [userId],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }


            res.json(rows);

        }
    );

});

app.post("/api/tasks", (req, res) => {

    const {
        user_id,
        name,
        category
    } = req.body;


    // Check required fields

    if (
        !user_id ||
        !name ||
        !category
    ) {

        return res.status(400).json({

            error:
                "User ID, task name and category are required."

        });

    }


 const sql = `
    INSERT INTO tasks (
        user_id,
        name,
        category,
        completed,
        created_at
    )
    VALUES (?, ?, ?, 0, ?)
`;


    db.run(
        sql,
        [
            user_id,
            name,
            category,
            new Date().toISOString()

        ],
        function (err) {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }


            res.json({

                message:
                    "Task added successfully!",

                task: {

                    id: this.lastID,

                    user_id: user_id,

                    name: name,

                    category: category,

                    completed: 0,
                    created_at: new Date().toISOString()

                }

            });

        }
    );

});


// ========================================
// UPDATE TASK
// ========================================

app.put("/api/tasks/:id", (req, res) => {

    const taskId =
        req.params.id;

    const {
        completed
    } = req.body;


    const sql = `
        UPDATE tasks
        SET completed = ?
        WHERE id = ?
    `;


    db.run(
        sql,
        [
            completed ? 1 : 0,
            taskId
        ],
        function (err) {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }


            res.json({

                message:
                    "Task updated successfully!"

            });

        }
    );

});

app.get("/api/subjects/:userId", (req, res) => {
    const userId = req.params.userId;

    const sql = `
        SELECT *
        FROM subjects
        WHERE user_id = ?
        ORDER BY name ASC
    `;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.post("/api/tasks", (req, res) => {
    const {
        user_id,
        name,
        category
    } = req.body;

    if (
        !user_id ||
        !name ||
        !category
    ) {
        return res.status(400).json({
            error:
                "User ID, task name and category are required."
        });
    }

    const sql = `
        INSERT INTO tasks (
            user_id,
            name,
            category,
            completed,
            created_at
        )
        VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
    `;

    db.run(
        sql,
        [
            user_id,
            name,
            category
        ],
        function (err) {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            db.get(
                "SELECT * FROM tasks WHERE id = ?",
                [this.lastID],
                (err, task) => {
                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.json({
                        message:
                            "Task added successfully!",
                        task: task
                    });
                }
            );
        }
    );
});


app.post("/api/study-sessions", (req, res) => {
    console.log("POST /api/study-sessions");
    console.log("Body:", req.body);

    const {
        user_id,
        subject_id,
        subject_name,
        seconds,
        session_date
    } = req.body;

    const userId = Number(user_id);
    const studySeconds = Math.floor(Number(seconds));

    if (!Number.isFinite(userId) || userId <= 0) {
        return res.status(400).json({
            success: false,
            error: "Invalid user ID."
        });
    }

    if (!subject_name || !String(subject_name).trim()) {
        return res.status(400).json({
            success: false,
            error: "Subject is required."
        });
    }

    if (!Number.isFinite(studySeconds) || studySeconds <= 0) {
        return res.status(400).json({
            success: false,
            error: "Study time must be greater than 0."
        });
    }

    const sql = `
        INSERT INTO study_sessions (
            user_id,
            subject_id,
            subject_name,
            seconds,
            session_date
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    const date =
        session_date || new Date().toISOString();

    db.run(
        sql,
        [
            userId,
            subject_id ? Number(subject_id) : null,
            String(subject_name).trim(),
            studySeconds,
            date
        ],
        function (err) {
            if (err) {
                console.error(
                    "DATABASE ERROR:",
                    err.message
                );

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            console.log(
                `Study session saved. ID: ${this.lastID}`
            );

            res.status(201).json({
                success: true,
                message: "Study session saved successfully.",
                session: {
                    id: this.lastID,
                    user_id: userId,
                    subject_id: subject_id
                        ? Number(subject_id)
                        : null,
                    subject_name: String(
                        subject_name
                    ).trim(),
                    seconds: studySeconds,
                    session_date: date
                }
            });
        }
    );
});


app.get("/api/study-sessions/:userId", (req, res) => {

    const userId = req.params.userId;

    const sql = `
        SELECT
            id,
            user_id,
            subject_id,
            subject_name,
            seconds,
            session_date
        FROM study_sessions
        WHERE user_id = ?
        ORDER BY session_date DESC
    `;

    db.all(
        sql,
        [userId],
        (err, rows) => {

            if (err) {
                console.error(
                    "Error loading study sessions:",
                    err.message
                );

                return res.status(500).json({
                    error: "Failed to load study sessions."
                });
            }

            res.json(rows);
        }
    );
});

app.post("/api/assignments", (req, res) => {
    const { user_id, name, priority, due_date, subject_id, type, status } = req.body;

    if (!user_id || !name) {
        return res.status(400).json({ error: "User ID and assignment name are required." });
    }

    const sql = `
        INSERT INTO assignments (user_id, name, priority, due_date, subject_id, type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql, 
        [user_id, name, priority || null, due_date || null, subject_id || null, type || null, status || 'Not Started'], 
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                message: "Assignment saved successfully!",
                assignment: {
                    id: this.lastID,
                    user_id,
                    name,
                    priority,
                    due_date,
                    subject_id,
                    type,
                    status
                }
            });
        }
    );
});


app.get('/api/assignments/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = `
        SELECT a.*, s.name AS subject_name 
        FROM assignments a
        LEFT JOIN subjects s ON a.subject_id = s.id
        WHERE a.user_id = ?
    `;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error("Database fetch failure:", err.message);
            return res.status(500).json({ error: "Failed to retrieve assignments from database." });
        }
        res.json(rows);
    });
});

app.put("/api/assignments/:id/status", (req, res) => {
    const assignmentId = req.params.id;
    const { status } = req.body;

    const validStatuses = [
        "Not Started",
        "In Progress",
        "Completed"
    ];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            error: "Invalid status."
        });
    }

    const sql = `
        UPDATE assignments
        SET status = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [status, assignmentId],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: "Assignment status updated successfully!"
            });
        }
    );
});

app.get("/api/calendar-events/:userId", (req, res) => {
    const userId = req.params.userId;

    db.all(
        `SELECT * FROM calendar_events
         WHERE user_id = ?
         ORDER BY event_date ASC`,
        [userId],
        (err, rows) => {
            if (err) {
                console.error("Error loading calendar events:", err);
                return res.status(500).json({ error: "Failed to load events" });
            }

            res.json(rows);
        }
    );
});

app.post("/api/calendar-events", (req, res) => {
    const { user_id, event_name, event_date } = req.body;

    if (!user_id || !event_name || !event_date) {
        return res.status(400).json({
            error: "User ID, event name and event date are required"
        });
    }

    db.run(
        `INSERT INTO calendar_events (user_id, event_name, event_date)
         VALUES (?, ?, ?)`,
        [user_id, event_name, event_date],
        function (err) {
            if (err) {
                console.error("Error saving calendar event:", err);
                return res.status(500).json({
                    error: "Failed to save event"
                });
            }

            res.json({
                message: "Event saved successfully",
                event: {
                    id: this.lastID,
                    user_id,
                    event_name,
                    event_date
                }
            });
        }
    );
});

app.use(
    express.static(
        path.join(__dirname, "..")
    )
);


app.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

    }
);
