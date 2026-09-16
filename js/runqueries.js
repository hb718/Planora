const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
    path.join(__dirname, "dev.db")
);

const queries = [

    // Query 1
    `
    SELECT
        tasks.id AS task_id,
        tasks.name AS task_name,
        tasks.category,
        tasks.completed,
        users.name AS user_name
    FROM tasks
    JOIN users
        ON tasks.user_id = users.id
    ORDER BY users.name;
    `,

    // Query 2
    `
    SELECT
        users.name AS user_name,
        tasks.name AS task_name,
        tasks.category
    FROM users
    JOIN tasks
        ON users.id = tasks.user_id
    WHERE tasks.completed = 0
    ORDER BY users.name;
    `,

    // Query 3
    `
    SELECT
        users.name AS user_name,
        COUNT(tasks.id) AS total_tasks
    FROM users
    LEFT JOIN tasks
        ON users.id = tasks.user_id
    GROUP BY users.id, users.name
    ORDER BY total_tasks DESC;
    `,

    // Query 4
    `
    SELECT
        users.name AS user_name,
        COUNT(tasks.id) AS total_tasks,
        SUM(
            CASE
                WHEN tasks.completed = 1 THEN 1
                ELSE 0
            END
        ) AS completed_tasks,
        SUM(
            CASE
                WHEN tasks.completed = 0 THEN 1
                ELSE 0
            END
        ) AS incomplete_tasks
    FROM users
    LEFT JOIN tasks
        ON users.id = tasks.user_id
    GROUP BY users.id, users.name;
    `,

    // Query 5
    `
    SELECT
        category,
        COUNT(*) AS number_of_tasks
    FROM tasks
    GROUP BY category
    ORDER BY number_of_tasks DESC;
    `,

    // Query 6
    `
    SELECT
        users.name AS user_name,
        tasks.name AS task_name,
        tasks.category
    FROM users
    JOIN tasks
        ON users.id = tasks.user_id
    WHERE tasks.completed = 1
    ORDER BY users.name;
    `,

    // Query 7
    `
    SELECT
        users.name AS user_name,
        COUNT(tasks.id) AS total_tasks,
        SUM(
            CASE
                WHEN tasks.completed = 1 THEN 1
                ELSE 0
            END
        ) AS completed_tasks,
        ROUND(
            100.0 * SUM(
                CASE
                    WHEN tasks.completed = 1 THEN 1
                    ELSE 0
                END
            ) / COUNT(tasks.id),
            1
        ) AS percentage_completed
    FROM users
    JOIN tasks
        ON users.id = tasks.user_id
    GROUP BY users.id, users.name
    ORDER BY percentage_completed DESC;
    `
];

function runQuery(number) {

    if (number >= queries.length) {

        console.log("All queries finished.");

        db.close();

        return;
    }

    console.log("\n==============================");
    console.log("QUERY " + (number + 1));
    console.log("==============================");

    db.all(
        queries[number],
        [],
        (err, rows) => {

            if (err) {

                console.error(
                    "Error:",
                    err.message
                );

            } else {

                console.table(rows);

            }

            runQuery(number + 1);
        }
    );
}

runQuery(0);