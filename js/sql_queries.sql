-- ============================================
-- QUERY 1
-- Show every task with the name of its user
-- ============================================

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


-- ============================================
-- QUERY 2
-- Show all incomplete tasks and who they belong to
-- ============================================

SELECT
    users.name AS user_name,
    tasks.name AS task_name,
    tasks.category
FROM users
JOIN tasks
    ON users.id = tasks.user_id
WHERE tasks.completed = 0
ORDER BY users.name, tasks.category;


-- ============================================
-- QUERY 3
-- Count how many tasks each user has
-- ============================================

SELECT
    users.name AS user_name,
    COUNT(tasks.id) AS total_tasks
FROM users
LEFT JOIN tasks
    ON users.id = tasks.user_id
GROUP BY users.id, users.name
ORDER BY total_tasks DESC;


-- ============================================
-- QUERY 4
-- Count completed and incomplete tasks for each user
-- ============================================

SELECT
    users.name AS user_name,

    COUNT(tasks.id) AS total_tasks,

    SUM(
        CASE
            WHEN tasks.completed = 1
            THEN 1
            ELSE 0
        END
    ) AS completed_tasks,

    SUM(
        CASE
            WHEN tasks.completed = 0
            THEN 1
            ELSE 0
        END
    ) AS incomplete_tasks

FROM users

LEFT JOIN tasks
    ON users.id = tasks.user_id

GROUP BY users.id, users.name
ORDER BY users.name;


-- ============================================
-- QUERY 5
-- Show tasks grouped by category
-- ============================================

SELECT
    category,
    COUNT(*) AS number_of_tasks
FROM tasks
GROUP BY category
ORDER BY number_of_tasks DESC;


-- ============================================
-- QUERY 6
-- Show completed tasks with the user who completed them
-- ============================================

SELECT
    users.name AS user_name,
    tasks.name AS task_name,
    tasks.category
FROM users
JOIN tasks
    ON users.id = tasks.user_id
WHERE tasks.completed = 1
ORDER BY users.name;

-- ============================================
-- QUERY 7
-- Calculate the percentage of tasks completed
-- by each user
-- ============================================

SELECT
    users.name AS user_name,

    COUNT(tasks.id) AS total_tasks,

    SUM(
        CASE
            WHEN tasks.completed = 1
            THEN 1
            ELSE 0
        END
    ) AS completed_tasks,

    ROUND(
        100.0 * SUM(
            CASE
                WHEN tasks.completed = 1
                THEN 1
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