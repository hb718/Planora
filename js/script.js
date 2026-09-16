/* register */

document.addEventListener("DOMContentLoaded", () => {

    const savedUser =
        localStorage.getItem("user");

    if (savedUser) {

        try {

            const user =
                JSON.parse(savedUser);

            const nameSpan =
                document.getElementById("welcome-name");

            if (nameSpan) {

                nameSpan.textContent =
                    ` ${user.name}`;

            }

        } catch (error) {

            console.error(
                "Could not read saved user:",
                error
            );

        }

    } else {

        console.log(
            "No user is currently logged in."
        );

    }

});

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document.getElementById("name").value.trim();

            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value;

            const role =
                document.getElementById("role").value;

            const messageElement =
                document.getElementById("message");

            if (
                !name ||
                !email ||
                !password ||
                !role
            ) {

                if (messageElement) {

                    messageElement.textContent =
                        "Please fill in all fields.";

                    messageElement.style.color =
                        "red";

                }

                return;
            }


            try {

                const response =
                    await fetch(
                        "/api/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name: name,
                                email: email,
                                password: password,
                                role: role
                            })
                        }
                    );

                const responseText =
                    await response.text();


                let result = {};

                try {

                    result =
                        responseText
                            ? JSON.parse(responseText)
                            : {};

                } catch (jsonError) {

                    console.error(
                        "Server returned invalid JSON:",
                        responseText
                    );

                    throw new Error(
                        `Server returned ${response.status} instead of JSON.`
                    );

                }


                if (!response.ok) {

                    if (messageElement) {

                        messageElement.textContent =
                            result.error ||
                            "Registration failed.";

                        messageElement.style.color =
                            "red";

                    }

                    return;
                }

                if (messageElement) {

                    messageElement.textContent =
                        "Account created successfully!";

                    messageElement.style.color =
                        "green";

                }

                registerForm.reset();


                setTimeout(
                    function () {

                        window.location.href =
                            "login.html";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                if (messageElement) {

                    messageElement.textContent =
                        "Could not register. Please try again.";

                    messageElement.style.color =
                        "red";

                }

            }

        }
    );

}


/* login */

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value;

            const messageElement =
                document.getElementById("message");


            if (!email || !password) {

                if (messageElement) {

                    messageElement.textContent =
                        "Please enter your email and password.";

                    messageElement.style.color =
                        "red";

                }

                return;
            }


            try {

                const response =
                    await fetch(
                        "/api/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                password: password
                            })
                        }
                    );


                const responseText =
                    await response.text();


                let result = {};

                try {

                    result =
                        responseText
                            ? JSON.parse(responseText)
                            : {};

                } catch (jsonError) {

                    console.error(
                        "Login server returned invalid JSON:",
                        responseText
                    );

                    throw new Error(
                        `Server returned ${response.status} instead of JSON.`
                    );

                }


                if (!response.ok) {

                    if (messageElement) {

                        messageElement.textContent =
                            result.error ||
                            "Login failed.";

                        messageElement.style.color =
                            "red";

                    }

                    return;
                }


                // Save user including role

                localStorage.setItem(
                    "user",
                    JSON.stringify(result.user)
                );


                console.log(
                    "Logged in user:",
                    result.user
                );

                console.log(
                    "User role:",
                    result.user.role
                );


                if (messageElement) {

                    messageElement.textContent =
                        "Login successful!";

                    messageElement.style.color =
                        "green";

                }


                setTimeout(
                    function () {

                        window.location.href =
                            "home.html";

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                if (messageElement) {

                    messageElement.textContent =
                        "Could not connect to server.";

                    messageElement.style.color =
                        "red";

                }

            }

        }
    );

}

function isAdmin() {

    const user =
        getCurrentUser();

    return (
        user &&
        user.role === "admin"
    );

}

/* password visibility */

const showPasswordToggle =
    document.getElementById(
        "showPasswordToggle"
    );

const passwordInput =
    document.getElementById(
        "password"
    );


if (
    showPasswordToggle &&
    passwordInput
) {

    showPasswordToggle.addEventListener(
        "change",
        () => {

            passwordInput.type =
                showPasswordToggle.checked
                    ? "text"
                    : "password";

        }
    );

}


function getCurrentUser() {

    const user =
        localStorage.getItem("user");


    if (!user) {

        return null;

    }


    try {

        return JSON.parse(user);

    } catch (error) {

        console.error(
            "Could not read user data:",
            error
        );

        return null;

    }

}


/* log out */

const logoutBtn =
    document.getElementById(
        "logout-btn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            localStorage.removeItem("user");

            window.location.href =
                "login.html";

        }
    );

}


function isStudent() {

    const user =
        getCurrentUser();

    return (
        user &&
        user.role === "student"
    );

}


function isOther() {

    const user =
        getCurrentUser();

    return (
        user &&
        user.role === "other"
    );

}

/* todo */

const taskList =
    document.getElementById(
        "taskList"
    );


if (taskList) {

    const user =
        getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html";

    } else {

        loadTasks(user.id);

    }

    const addTaskBtn =
        document.getElementById(
            "addTaskBtn"
        );

    const taskForm =
        document.getElementById(
            "taskForm"
        );

    const saveTaskBtn =
        document.getElementById(
            "saveTaskBtn"
        );

    const cancelTaskBtn =
        document.getElementById(
            "cancelTaskBtn"
        );


    if (addTaskBtn && taskForm) {

        addTaskBtn.addEventListener(
            "click",
            function () {

                taskForm.style.display =
                    "block";

            }
        );

    }

    if (cancelTaskBtn && taskForm) {

        cancelTaskBtn.addEventListener(
            "click",
            function () {

                taskForm.style.display =
                    "none";

            }
        );

    }

    if (saveTaskBtn) {

        saveTaskBtn.addEventListener(
            "click",
            async function () {

                const taskName =
                    document
                        .getElementById("taskName")
                        .value
                        .trim();

                const category =
                    document
                        .getElementById("taskCategory")
                        .value;


                if (!taskName) {

                    alert(
                        "Please enter a task name."
                    );

                    return;

                }


                try {

                    const response =
                        await fetch(
                            "/api/tasks",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({
                                    user_id:
                                        user.id,

                                    name:
                                        taskName,

                                    category:
                                        category
                                })
                            }
                        );


                    const responseText =
                        await response.text();


                    let result = {};

                    try {

                        result =
                            responseText
                                ? JSON.parse(responseText)
                                : {};

                    } catch (jsonError) {

                        console.error(
                            "Task server returned invalid JSON:",
                            responseText
                        );

                        throw new Error(
                            "Server returned invalid JSON."
                        );

                    }


                    if (!response.ok) {

                        alert(
                            result.error ||
                            "Could not save task."
                        );

                        return;

                    }


                    document
                        .getElementById("taskName")
                        .value = "";


                    if (taskForm) {

                        taskForm.style.display =
                            "none";

                    }


                    loadTasks(user.id);


                } catch (error) {

                    console.error(
                        "Save task error:",
                        error
                    );

                    alert(
                        "Could not save task."
                    );

                }

            }
        );

    }


    async function loadTasks(userId) {

        try {

            const response =
                await fetch(
                    `/api/tasks/${userId}`
                );


            const responseText =
                await response.text();


            let tasks = [];

            try {

                tasks =
                    responseText
                        ? JSON.parse(responseText)
                        : [];

            } catch (jsonError) {

                console.error(
                    "Tasks server returned invalid JSON:",
                    responseText
                );

                return;

            }


            if (!response.ok) {

                console.error(
                    tasks.error ||
                    "Could not load tasks."
                );

                return;

            }


            taskList.innerHTML =
                "";


            if (tasks.length === 0) {

                taskList.innerHTML = `
                    <p class="no-tasks">
                        No tasks yet. Add your first task!
                    </p>
                `;

                return;

            }


            tasks.forEach(
                function (task) {

                    createTaskElement(task);

                }
            );


        } catch (error) {

            console.error(
                "Load tasks error:",
                error
            );

        }

    }

    function createTaskElement(task) {

        const taskElement =
            document.createElement("div");


        taskElement.classList.add(
            "task"
        );


        taskElement.dataset.id =
            task.id;

        taskElement.dataset.createdAt =
            task.created_at || "";


        if (task.completed === 1) {

            taskElement.classList.add(
                "completed"
            );

        }


        taskElement.innerHTML = `
            <label class="checkbox-container">

                <input
                    type="checkbox"
                    ${
                        task.completed === 1
                            ? "checked"
                            : ""
                    }
                >

                <span class="custom-checkbox"></span>

            </label>

            <div class="task-info">

                <h3>
                    ${task.name}
                </h3>

                <div class="task-details">

                    <span class="task-tag">
                        ${task.category}
                    </span>

                    <span>
                        ${
                            task.completed === 1
                                ? "Completed"
                                : "Not completed"
                        }
                    </span>

                </div>

            </div>
        `;


        const checkbox =
            taskElement.querySelector(
                'input[type="checkbox"]'
            );


        checkbox.addEventListener(
            "change",
            async function () {

                const completed =
                    this.checked;


                if (completed) {

                    taskElement.classList.add(
                        "completed"
                    );

                } else {

                    taskElement.classList.remove(
                        "completed"
                    );

                }


                try {

                    const response =
                        await fetch(
                            `/api/tasks/${task.id}`,
                            {
                                method: "PUT",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({
                                    completed:
                                        completed
                                })
                            }
                        );


                    if (!response.ok) {

                        console.error(
                            "Could not update task."
                        );

                    }

                } catch (error) {

                    console.error(
                        "Update task error:",
                        error
                    );

                }

            }
        );


        taskList.appendChild(
            taskElement
        );

    }
function isSameDay(date1, date2) {

    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );

}

function isThisWeek(date) {
    const today = new Date();

    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;

    startOfWeek.setDate(
        startOfWeek.getDate() - daysFromMonday
    );
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(
        endOfWeek.getDate() + 7
    );
    endOfWeek.setHours(0, 0, 0, 0);

    return (
        date >= startOfWeek &&
        date < endOfWeek
    );
}

/* filter buttons */

    const filterButtons =
        document.querySelectorAll(
            ".filter-btn"
        );


    filterButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    filterButtons.forEach(
                        function (btn) {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );


                    this.classList.add(
                        "active"
                    );


                    const filter =
                        this.dataset.filter;


                    const tasks =
                        document.querySelectorAll(
                            ".task"
                        );


                    tasks.forEach(
                        function (task) {

                            const checkbox =
                                task.querySelector(
                                    'input[type="checkbox"]'
                                );


                            if (filter === "all") {

    if (checkbox.checked) {

        task.style.display =
            "none";

    } else {

        task.style.display =
            "flex";

    }

} else if (filter === "completed") {

                                if (
                                    checkbox.checked
                                ) {

                                    task.style.display =
                                        "flex";

                                } else {

                                    task.style.display =
                                        "none";

                                }

                           } else if (
    filter === "today"
) {

    const createdAt =
        task.dataset.createdAt;

    const taskDate =
        new Date(createdAt);

    if (
        createdAt &&
        !Number.isNaN(taskDate.getTime()) &&
        isSameDay(
            taskDate,
            new Date()
        )
    ) {

        task.style.display =
            "flex";

    } else {

        task.style.display =
            "none";

    }

        } else if (
            filter === "week"
        ) {

            const createdAt =
                task.dataset.createdAt;

            const taskDate =
                new Date(createdAt);

            if (
                createdAt &&
                !Number.isNaN(taskDate.getTime()) &&
                isThisWeek(taskDate)
            ) {

                task.style.display =
                    "flex";

            } else {

                task.style.display =
                    "none";

            }

        }

                        }
                    );

                }
            );

        }
    );

}

/* music */

let youtubePlayer;


function onYouTubeIframeAPIReady() {

    youtubePlayer =
        new YT.Player(
            "youtube-player",
            {
                height: "1",
                width: "1",

                videoId:
                    "BTYAsjAVa3I",

                playerVars: {
                    start: 13
                }
            }
        );

}


const musicButton =
    document.getElementById(
        "music-play-btn"
    );


if (musicButton) {

    musicButton.addEventListener(
        "click",
        () => {

            if (!youtubePlayer) {

                return;

            }


            const state =
                youtubePlayer.getPlayerState();


            if (
                state ===
                YT.PlayerState.PLAYING
            ) {

                youtubePlayer.pauseVideo();

                musicButton.textContent =
                    "▶";

            } else {

                youtubePlayer.playVideo();

                musicButton.textContent =
                    "❚❚";

            }

        }
    );

}


let playlistPlayer;

let currentPlaylistIndex = 0;

const studyPlaylist = [

    {
        title: "Rainy Ambience",
        videoId: "mnFy62qe5N0"
    },

    {
        title: "Cozy Winter",
        videoId: "_tV5LEBDs7w"
    },

    {
        title: "Jazz Lofi",
        videoId: "CBSlu_VMS9U"
    },

    {
        title: "Chill Lofi Hip Hop",
        videoId: "aWV6uv8Que0"
    },

    {
        title: "Cafe Lofi Beats",
        videoId: "Y9mRoCerrpY"
    },

    {
        title: "Cozy Vibes",
        videoId: "0QVYoS4MuIs"
    },

    {
        title: "Minecraft Ambience",
        videoId: "CoR0v-pHmmU"
    },

    {
        title: "Rainy Ambience",
        videoId: "vCTRNKPJr40"
    },

    {
        title: "Night Ambience",
        videoId: "2AH5t_o7lmg"
    },

    {
        title: "Blissful Dreams",
        videoId: "ldDtjQkLsss"
    },

    {
        title: "Nostalgia",
        videoId: "AXEkvwCAANo"
    }

];


function initializeSecondMusicPlayer() {

    if (!document.getElementById("playlist-youtube-player")) {
        return;
    }

    playlistPlayer = new YT.Player(
        "playlist-youtube-player",
        {
            height: "1",
            width: "1",

            videoId:
                studyPlaylist[currentPlaylistIndex].videoId,

            playerVars: {
                start: 0
            },

            events: {
                onReady: playlistPlayerReady,
                onStateChange: playlistPlayerStateChange
            }
        }
    );
}


if (window.YT && YT.Player) {

    initializeSecondMusicPlayer();

} else {

    const waitForYouTube =
        setInterval(
            () => {

                if (
                    window.YT &&
                    YT.Player
                ) {

                    clearInterval(
                        waitForYouTube
                    );

                    initializeSecondMusicPlayer();

                }

            },
            100
        );

}



function playlistPlayerReady() {

    updatePlaylistTitle();

    createPlaylistButtons();
}

const playlistPlayButton =
    document.getElementById("playlist-play");

if (playlistPlayButton) {

    playlistPlayButton.addEventListener(
        "click",
        () => {

            if (!playlistPlayer) {
                return;
            }

            const state =
                playlistPlayer.getPlayerState();

            if (
                state === YT.PlayerState.PLAYING
            ) {

                playlistPlayer.pauseVideo();

                playlistPlayButton.textContent =
                    "▶";

            } else {

                playlistPlayer.playVideo();

                playlistPlayButton.textContent =
                    "❚❚";
            }
        }
    );
}



const playlistNextButton =
    document.getElementById("playlist-next");

if (playlistNextButton) {

    playlistNextButton.addEventListener(
        "click",
        () => {

            playNextSong();

        }
    );
}


function playNextSong() {

    if (!playlistPlayer) {
        return;
    }

    currentPlaylistIndex++;

    if (
        currentPlaylistIndex >=
        studyPlaylist.length
    ) {

        currentPlaylistIndex = 0;

    }

    playlistPlayer.loadVideoById(
        studyPlaylist[currentPlaylistIndex].videoId
    );

    updatePlaylistTitle();

    updateActivePlaylistItem();

}

const playlistPrevButton =
    document.getElementById("playlist-prev");

if (playlistPrevButton) {

    playlistPrevButton.addEventListener(
        "click",
        () => {

            if (!playlistPlayer) {
                return;
            }

            currentPlaylistIndex--;

            if (
                currentPlaylistIndex < 0
            ) {

                currentPlaylistIndex =
                    studyPlaylist.length - 1;

            }

            playlistPlayer.loadVideoById(
                studyPlaylist[currentPlaylistIndex].videoId
            );

            updatePlaylistTitle();

            updateActivePlaylistItem();

        }
    );
}

function updatePlaylistTitle() {

    const title =
        document.getElementById(
            "playlist-song-title"
        );

    if (!title) {
        return;
    }

    title.textContent =
        studyPlaylist[currentPlaylistIndex].title;
}

function createPlaylistButtons() {

    const playlist =
        document.getElementById(
            "playlist-list"
        );

    if (!playlist) {
        return;
    }

    playlist.innerHTML = "";

    studyPlaylist.forEach(
        (song, index) => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "playlist-song";

            button.dataset.index =
                index;

            button.textContent =
                song.title;

            button.addEventListener(
                "click",
                () => {

                    playSong(index);

                }
            );

            playlist.appendChild(button);

        }
    );

    updateActivePlaylistItem();
}

function playSong(index) {

    if (!playlistPlayer) {
        return;
    }

    currentPlaylistIndex =
        index;

    playlistPlayer.loadVideoById(
        studyPlaylist[index].videoId
    );

    updatePlaylistTitle();

    updateActivePlaylistItem();

}

function updateActivePlaylistItem() {

    const buttons =
        document.querySelectorAll(
            ".playlist-song"
        );

    buttons.forEach(
        (button, index) => {

            if (
                index ===
                currentPlaylistIndex
            ) {

                button.classList.add(
                    "active"
                );

            } else {

                button.classList.remove(
                    "active"
                );

            }

        }
    );
}

function playlistPlayerStateChange(event) {

    if (
        event.data ===
        YT.PlayerState.ENDED
    ) {

        playNextSong();

    }

    if (
        event.data ===
        YT.PlayerState.PLAYING
    ) {

        if (playlistPlayButton) {

            playlistPlayButton.textContent =
                "❚❚";

        }

    }

    if (
        event.data ===
        YT.PlayerState.PAUSED
    ) {

        if (playlistPlayButton) {

            playlistPlayButton.textContent =
                "▶";

        }

    }

}

/* hours studied */


async function updateHoursStudied() {

    const hoursElement =
        document.getElementById(
            "hours-studied"
        );


    if (!hoursElement) {

        return;

    }


    const user =
        getCurrentUser();


    if (!user) {

        hoursElement.textContent =
            "0.0h";

        return;

    }


    try {

        const response =
            await fetch(
                `/api/study-sessions/${user.id}`
            );


        const responseText =
            await response.text();


        let sessions = [];

        try {

            sessions =
                responseText
                    ? JSON.parse(responseText)
                    : [];

        } catch (jsonError) {

            console.error(
                "Study sessions server returned invalid JSON:",
                responseText
            );

            return;

        }


        if (!response.ok) {

            console.error(
                sessions.error ||
                "Could not load study sessions."
            );

            return;

        }


        const totalSeconds =
            sessions.reduce(
                (total, session) => {

                    const seconds =
                        Number(session.seconds) || 0;

                    return total + seconds;

                },
                0
            );


        const totalHours =
            totalSeconds / 3600;


        hoursElement.textContent =
            totalHours.toFixed(1) + "h";


    } catch (error) {

        console.error(
            "Error loading study hours:",
            error
        );

    }

}


updateHoursStudied();

