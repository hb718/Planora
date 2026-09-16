document.addEventListener("DOMContentLoaded", () => {
    initialiseTimerPage();
});

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch (error) {
        console.error("Could not read current user:", error);
        return null;
    }
}

const subjectSelect = document.getElementById("subject");
const subjectTimerDisplay = document.querySelector(".large-timer");
const subjectTimerStatus = document.querySelector(".timer-status");
const subjectStartBtn = document.querySelector(".subject-timer-card .start-btn");
const subjectResetBtn = document.querySelector(".subject-timer-card .reset-btn");
const logSessionBtn = document.getElementById("log-session-btn");

const subjectTimesContainer = document.getElementById("subject-times");
const studyStats = document.querySelector(".study-stats");

const historyTabs = document.querySelectorAll(".history-tab");
const weekView = document.querySelector(".week-view");
const monthSummary = document.querySelector(".month-summary");

const pomodoroCard = document.querySelector(".pomodoro-card");
const pomodoroModes = document.querySelectorAll(".pomodoro-mode");
const pomodoroDisplay = document.querySelector(".pomodoro-timer");
const pomodoroStatus = document.querySelector(".pomodoro-status");
const pomodoroStartBtn = document.querySelector(".pomodoro-card .start-btn");
const pomodoroResetBtn = document.querySelector(".pomodoro-card .reset-btn");


let subjectSeconds = 0;
let accumulatedSeconds = 0;
let subjectStartTime = null;
let subjectInterval = null;
let subjectRunning = false;

let studySessions = [];

function formatTime(totalSeconds) {
    totalSeconds = Math.max(0, Math.floor(totalSeconds));

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
    ].join(":");
}


function formatStudyDuration(totalSeconds) {
    totalSeconds = Math.max(0, Math.floor(totalSeconds));

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

function updateSubjectTimerDisplay() {
    if (subjectTimerDisplay) {
        subjectTimerDisplay.textContent = formatTime(subjectSeconds);
    }
}


function startSubjectTimer() {

    if (!subjectSelect || !subjectSelect.value) {
        alert("Please choose a subject first.");
        return;
    }

    if (subjectRunning) {
        pauseSubjectTimer();
        return;
    }

    subjectRunning = true;
    subjectStartTime = Date.now();

    if (subjectStartBtn) {
        subjectStartBtn.innerHTML = `
            <i data-lucide="pause"></i>
            Pause
        `;
    }

    if (subjectTimerStatus) {
        subjectTimerStatus.textContent = "Studying...";
    }

    lucide.createIcons();

    subjectInterval = setInterval(() => {

        const elapsedSeconds = Math.floor(
            (Date.now() - subjectStartTime) / 1000
        );

        subjectSeconds = accumulatedSeconds + elapsedSeconds;

        updateSubjectTimerDisplay();

    }, 250);
}


function pauseSubjectTimer() {

    if (!subjectRunning) return;

    accumulatedSeconds = subjectSeconds;

    clearInterval(subjectInterval);
    subjectInterval = null;

    subjectRunning = false;

    if (subjectStartBtn) {
        subjectStartBtn.innerHTML = `
            <i data-lucide="play"></i>
            Start
        `;
    }

    if (subjectTimerStatus) {
        subjectTimerStatus.textContent = "Paused";
    }

    lucide.createIcons();
}


function resetSubjectTimer() {

    clearInterval(subjectInterval);

    subjectInterval = null;
    subjectRunning = false;
    subjectStartTime = null;
    accumulatedSeconds = 0;
    subjectSeconds = 0;

    updateSubjectTimerDisplay();

    if (subjectStartBtn) {
        subjectStartBtn.innerHTML = `
            <i data-lucide="play"></i>
            Start
        `;
    }

    if (subjectTimerStatus) {
        subjectTimerStatus.textContent = "Ready to study";
    }

    lucide.createIcons();
}

async function saveSession(subjectName, seconds) {

    const user = getCurrentUser();

    if (!user || !user.id) {
        alert("Please log in before saving study time.");
        return false;
    }

    seconds = Math.floor(Number(seconds));

    if (!subjectName || seconds <= 0) {
        return false;
    }

    const subjectId = subjectSelect ? subjectSelect.value : null;

    try {

        const response = await fetch("/api/study-sessions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: user.id,
                subject_id: subjectId || null,
                subject_name: subjectName,
                seconds: seconds,
                session_date: new Date().toISOString()
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Could not save study session."
            );
        }

        console.log("Study session saved:", data);

        await loadStudySessions();

        return true;

    } catch (error) {

        console.error("Error saving study session:", error);

        alert("Could not save your study session.");

        return false;
    }
}

if (logSessionBtn) {

    logSessionBtn.addEventListener("click", async () => {

        if (subjectRunning) {
            pauseSubjectTimer();
        }

        if (!subjectSelect || !subjectSelect.value) {
            alert("Please choose a subject first.");
            return;
        }

        if (subjectSeconds <= 0) {
            alert("There is no study time to log yet.");
            return;
        }

        const selectedOption =
            subjectSelect.options[subjectSelect.selectedIndex];

        const subjectName = selectedOption
            ? selectedOption.textContent.trim()
            : "";

        if (!subjectName) {
            alert("Please choose a subject first.");
            return;
        }

        const secondsToLog = subjectSeconds;

        logSessionBtn.disabled = true;

        const saved = await saveSession(
            subjectName,
            secondsToLog
        );

        logSessionBtn.disabled = false;

        if (!saved) {
            return;
        }

        // Reset first so the success message is not overwritten
        resetSubjectTimer();

        if (subjectTimerStatus) {
            subjectTimerStatus.textContent =
                "Session logged successfully!";
        }
    });
}


// ========================================
// SUBJECT START BUTTON
// ========================================

if (subjectStartBtn) {

    subjectStartBtn.addEventListener("click", () => {

        if (subjectRunning) {
            pauseSubjectTimer();
        } else {
            startSubjectTimer();
        }

    });
}


if (subjectResetBtn) {

    subjectResetBtn.addEventListener("click", () => {
        resetSubjectTimer();
    });
}

async function loadSubjects() {

    const user = getCurrentUser();

    if (!user || !user.id || !subjectSelect) {
        return;
    }

    try {

        const response = await fetch(
            `/api/subjects/${user.id}`
        );

        if (!response.ok) {
            throw new Error("Could not load subjects.");
        }

        const subjects = await response.json();

        subjectSelect.innerHTML = `
            <option value="" selected disabled>
                Choose a subject
            </option>
        `;

        subjects.forEach(subject => {

            const option = document.createElement("option");

            option.value = subject.id;
            option.textContent = subject.name;

            subjectSelect.appendChild(option);
        });

    } catch (error) {

        console.error("Error loading subjects:", error);
    }
}

async function loadStudySessions() {

    const user = getCurrentUser();

    if (!user || !user.id) {
        return;
    }

    try {

        const response = await fetch(
            `/api/study-sessions/${user.id}`
        );

        if (!response.ok) {
            throw new Error("Could not load study sessions.");
        }

        studySessions = await response.json();

        updateStatistics();

    } catch (error) {

        console.error("Error loading study sessions:", error);

        studySessions = [];

        updateStatistics();
    }
}


function getSessionDate(session) {

    if (!session.session_date) {
        return new Date();
    }

    return new Date(session.session_date);
}


function updateStatistics() {

    const totalSeconds = studySessions.reduce(
        (total, session) => {
            return total + Number(session.seconds || 0);
        },
        0
    );

    const sessionCount = studySessions.length;

    const longestSession = studySessions.reduce(
        (longest, session) => {
            return Math.max(
                longest,
                Number(session.seconds || 0)
            );
        },
        0
    );


    if (studyStats) {

        const statCards =
            studyStats.querySelectorAll(".stat-card");

        if (statCards.length >= 3) {
            const totalHeading =
                statCards[0].querySelector("h3");

            if (totalHeading) {
                totalHeading.textContent =
                    formatStudyDuration(totalSeconds);
            }

            const sessionsHeading =
                statCards[1].querySelector("h3");

            if (sessionsHeading) {
                sessionsHeading.textContent =
                    sessionCount;
            }

            const longestHeading =
                statCards[2].querySelector("h3");

            if (longestHeading) {
                longestHeading.textContent =
                    formatStudyDuration(longestSession);
            }
        }
    }

    updateSubjectBreakdown();

    updateWeeklyHistory();

    updateMonthSummary();
}


function updateSubjectBreakdown() {

    if (!subjectTimesContainer) {
        return;
    }

    if (studySessions.length === 0) {

        subjectTimesContainer.innerHTML = `
            <p class="empty-state">
                No study sessions yet.
            </p>
        `;

        return;
    }


    const subjectTotals = {};


    studySessions.forEach(session => {

        const name =
            session.subject_name || "Unknown Subject";

        const seconds =
            Number(session.seconds || 0);

        if (!subjectTotals[name]) {
            subjectTotals[name] = 0;
        }

        subjectTotals[name] += seconds;
    });


    const sortedSubjects =
        Object.entries(subjectTotals)
            .sort((a, b) => b[1] - a[1]);


    const totalSeconds =
        Object.values(subjectTotals)
            .reduce((sum, seconds) => sum + seconds, 0);


    subjectTimesContainer.innerHTML = "";


    sortedSubjects.forEach(([subject, seconds]) => {

        const percentage =
            totalSeconds > 0
                ? Math.round((seconds / totalSeconds) * 100)
                : 0;


        const row =
            document.createElement("div");

        row.className = "subject-time-row";


        row.innerHTML = `
            <div class="subject-time-info">
                <span class="subject-time-name">
                    ${escapeHtml(subject)}
                </span>

                <span class="subject-time-value">
                    ${formatStudyDuration(seconds)}
                </span>
            </div>

            <div class="subject-time-bar">
                <div
                    class="subject-time-progress"
                    style="width: ${percentage}%;">
                </div>
            </div>
        `;


        subjectTimesContainer.appendChild(row);
    });
}


// ========================================
// WEEK HISTORY
// ========================================

function updateWeeklyHistory() {

    if (!weekView) {
        return;
    }

    const now = new Date();

    // Monday of current week
    const monday = new Date(now);

    const currentDay = monday.getDay();

    const daysFromMonday =
        currentDay === 0
            ? 6
            : currentDay - 1;

    monday.setDate(
        monday.getDate() - daysFromMonday
    );

    monday.setHours(0, 0, 0, 0);


    const dailyTotals = [
        0, 0, 0, 0, 0, 0, 0
    ];


    studySessions.forEach(session => {

        const date = getSessionDate(session);

        const day = new Date(date);

        day.setHours(0, 0, 0, 0);


        const difference =
            Math.floor(
                (day - monday) /
                (1000 * 60 * 60 * 24)
            );


        if (difference >= 0 && difference < 7) {

            dailyTotals[difference] +=
                Number(session.seconds || 0);
        }
    });


    const maxSeconds =
        Math.max(...dailyTotals, 1);


    const dayNames = [
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
        "SAT",
        "SUN"
    ];


    weekView.innerHTML = "";


    dailyTotals.forEach((seconds, index) => {

        const percentage =
            Math.round(
                (seconds / maxSeconds) * 100
            );


        const column =
            document.createElement("div");

        column.className = "day-column";


        column.innerHTML = `
            <span class="day-name">
                ${dayNames[index]}
            </span>

            <div class="day-bar">
                <div
                    class="day-progress"
                    style="height: ${percentage}%;">
                </div>
            </div>

            <span class="day-time">
                ${formatStudyDuration(seconds)}
            </span>
        `;


        weekView.appendChild(column);
    });
}


// ========================================
// MONTH SUMMARY
// ========================================

function updateMonthSummary() {

    if (!monthSummary) {
        return;
    }

    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();


    // ------------------------------------
    // THIS MONTH
    // ------------------------------------

    let monthlyTotal = 0;


    // Daily totals for best day
    const dailyTotals = {};


    studySessions.forEach(session => {

        const date = getSessionDate(session);

        if (
            date.getFullYear() === currentYear &&
            date.getMonth() === currentMonth
        ) {

            const seconds =
                Number(session.seconds || 0);

            monthlyTotal += seconds;


            const dateKey =
                `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;


            if (!dailyTotals[dateKey]) {
                dailyTotals[dateKey] = {
                    seconds: 0,
                    date: date
                };
            }

            dailyTotals[dateKey].seconds += seconds;
        }
    });


    // ------------------------------------
    // DAILY AVERAGE
    // ------------------------------------

    const daysElapsed =
        now.getDate();

    const dailyAverage =
        daysElapsed > 0
            ? Math.floor(monthlyTotal / daysElapsed)
            : 0;


    // ------------------------------------
    // BEST DAY
    // ------------------------------------

    let bestDay = null;

    Object.values(dailyTotals).forEach(day => {

        if (
            !bestDay ||
            day.seconds > bestDay.seconds
        ) {
            bestDay = day;
        }
    });


    let bestDayText = "No data";

    if (bestDay) {

        bestDayText =
            bestDay.date.toLocaleDateString(
                "en-US",
                {
                    weekday: "long"
                }
            );
    }


    // ------------------------------------
    // UPDATE HTML
    // ------------------------------------

    const summaryItems =
        monthSummary.querySelectorAll(
            ".month-summary-item"
        );


    if (summaryItems.length >= 3) {

        // This month
        const monthValue =
            summaryItems[0].querySelector("strong");

        if (monthValue) {
            monthValue.textContent =
                formatStudyDuration(monthlyTotal);
        }


        // Daily average
        const averageValue =
            summaryItems[1].querySelector("strong");

        if (averageValue) {
            averageValue.textContent =
                formatStudyDuration(dailyAverage);
        }


        // Best day
        const bestDayValue =
            summaryItems[2].querySelector("strong");

        if (bestDayValue) {
            bestDayValue.textContent =
                bestDayText;
        }
    }
}


// ========================================
// HISTORY TABS
// ========================================

historyTabs.forEach((tab, index) => {

    tab.addEventListener("click", () => {

        historyTabs.forEach(otherTab => {
            otherTab.classList.remove("active");
        });

        tab.classList.add("active");


        if (index === 0) {

            // Week
            if (weekView) {
                weekView.style.display = "";
            }

            if (monthSummary) {
                monthSummary.style.display = "";
            }

            updateWeeklyHistory();

        } else {

            // Month
            if (weekView) {
                weekView.style.display = "none";
            }

            if (monthSummary) {
                monthSummary.style.display = "";
            }

            updateMonthSummary();
        }
    });
});


// ========================================
// POMODORO
// ========================================

let pomodoroSeconds = 25 * 60;
let pomodoroInterval = null;
let pomodoroRunning = false;

let currentPomodoroMode = "focus";


// Durations
const pomodoroDurations = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
};


// ========================================
// POMODORO DISPLAY
// ========================================

function updatePomodoroDisplay() {

    if (!pomodoroDisplay) {
        return;
    }

    const minutes =
        Math.floor(pomodoroSeconds / 60);

    const seconds =
        pomodoroSeconds % 60;


    pomodoroDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


// ========================================
// CHANGE POMODORO MODE
// ========================================

function setPomodoroMode(mode) {

    currentPomodoroMode = mode;

    pomodoroSeconds =
        pomodoroDurations[mode];


    pomodoroRunning = false;

    clearInterval(pomodoroInterval);

    pomodoroInterval = null;


    if (pomodoroStartBtn) {

        pomodoroStartBtn.innerHTML = `
            <i data-lucide="play"></i>
            Start
        `;
    }


    if (pomodoroStatus) {

        if (mode === "focus") {
            pomodoroStatus.textContent =
                "Time to focus";
        }

        if (mode === "short") {
            pomodoroStatus.textContent =
                "Take a short break";
        }

        if (mode === "long") {
            pomodoroStatus.textContent =
                "Take a long break";
        }
    }


    updatePomodoroDisplay();

    lucide.createIcons();
}


// ========================================
// POMODORO BUTTONS
// ========================================

pomodoroModes.forEach((button, index) => {

    button.addEventListener("click", () => {

        pomodoroModes.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");


        if (index === 0) {
            setPomodoroMode("focus");
        }

        if (index === 1) {
            setPomodoroMode("short");
        }

        if (index === 2) {
            setPomodoroMode("long");
        }
    });
});


// ========================================
// START / PAUSE POMODORO
// ========================================

if (pomodoroStartBtn) {

    pomodoroStartBtn.addEventListener("click", () => {

        if (pomodoroRunning) {

            pomodoroRunning = false;

            clearInterval(pomodoroInterval);

            pomodoroInterval = null;


            pomodoroStartBtn.innerHTML = `
                <i data-lucide="play"></i>
                Start
            `;


            if (pomodoroStatus) {
                pomodoroStatus.textContent = "Paused";
            }

            lucide.createIcons();

            return;
        }


        pomodoroRunning = true;


        pomodoroStartBtn.innerHTML = `
            <i data-lucide="pause"></i>
            Pause
        `;


        if (pomodoroStatus) {
            pomodoroStatus.textContent = "Focus time...";
        }


        lucide.createIcons();


        pomodoroInterval = setInterval(async () => {

            pomodoroSeconds--;

            updatePomodoroDisplay();


            if (pomodoroSeconds <= 0) {

                clearInterval(pomodoroInterval);

                pomodoroInterval = null;

                pomodoroRunning = false;


                pomodoroStartBtn.innerHTML = `
                    <i data-lucide="play"></i>
                    Start
                `;


                // Automatically save completed focus sessions
                if (currentPomodoroMode === "focus") {

                    const user = getCurrentUser();

                    if (
                        user &&
                        user.id &&
                        subjectSelect &&
                        subjectSelect.value
                    ) {

                        const selectedOption =
                            subjectSelect.options[
                                subjectSelect.selectedIndex
                            ];

                        const subjectName =
                            selectedOption
                                ? selectedOption.textContent.trim()
                                : "";


                        if (subjectName) {

                            await saveSession(
                                subjectName,
                                25 * 60
                            );

                            if (pomodoroStatus) {
                                pomodoroStatus.textContent =
                                    "Focus session complete!";
                            }
                        }

                    } else {

                        if (pomodoroStatus) {
                            pomodoroStatus.textContent =
                                "Focus complete — choose a subject next time to log it.";
                        }
                    }

                } else {

                    if (pomodoroStatus) {
                        pomodoroStatus.textContent =
                            "Break complete!";
                    }
                }


                lucide.createIcons();
            }

        }, 1000);
    });
}


// ========================================
// RESET POMODORO
// ========================================

if (pomodoroResetBtn) {

    pomodoroResetBtn.addEventListener("click", () => {

        clearInterval(pomodoroInterval);

        pomodoroInterval = null;

        pomodoroRunning = false;

        pomodoroSeconds =
            pomodoroDurations[currentPomodoroMode];


        updatePomodoroDisplay();


        if (pomodoroStartBtn) {

            pomodoroStartBtn.innerHTML = `
                <i data-lucide="play"></i>
                Start
            `;
        }


        if (pomodoroStatus) {

            if (currentPomodoroMode === "focus") {
                pomodoroStatus.textContent =
                    "Time to focus";
            } else if (currentPomodoroMode === "short") {
                pomodoroStatus.textContent =
                    "Take a short break";
            } else {
                pomodoroStatus.textContent =
                    "Take a long break";
            }
        }


        lucide.createIcons();
    });
}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ========================================
// INITIALISE TIMER PAGE
// ========================================

async function initialiseTimerPage() {

    updateSubjectTimerDisplay();

    updatePomodoroDisplay();

    await loadSubjects();

    await loadStudySessions();

    lucide.createIcons();
}