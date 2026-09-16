
const daysContainer = document.getElementById('days-container');
const monthYear = document.getElementById('month-year');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const eventModal = document.getElementById('event-modal');
const closeModal = document.querySelector('.close');
const saveEventBtn = document.getElementById('save-event');
const eventNameInput = document.getElementById('event-name');
const eventDateInput = document.getElementById('event-date');

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

let events = {};

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];


function getCurrentUser() {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
        return null;
    }

    try {
        return JSON.parse(savedUser);
    } catch (error) {
        console.error("Could not read saved user:", error);
        return null;
    }
}

async function loadEvents() {
    const user = getCurrentUser();

    if (!user) {
        console.log("No user logged in.");
        generateCalendar(currentMonth, currentYear);
        return;
    }

    try {
        const response = await fetch(`/api/calendar-events/${user.id}`);
        const savedEvents = await response.json();

        if (!response.ok) {
            console.error("Could not load calendar events.");
            generateCalendar(currentMonth, currentYear);
            return;
        }
        events = {};

        savedEvents.forEach(event => {
            events[event.event_date] = event.event_name;
        });

        generateCalendar(currentMonth, currentYear);

    } catch (error) {
        console.error("Error loading calendar events:", error);
        generateCalendar(currentMonth, currentYear);
    }
}


function generateCalendar(month, year) {
    daysContainer.innerHTML = '';
    monthYear.innerText = `${months[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        daysContainer.appendChild(emptyDiv);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.innerText = day;
        const dateKey =
            `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (events[dateKey]) {
            const eventDiv = document.createElement('div');

            eventDiv.classList.add('event');
            eventDiv.innerText = events[dateKey];

            dayDiv.appendChild(eventDiv);
        }

        dayDiv.addEventListener('click', () => openEventModal(day));

        daysContainer.appendChild(dayDiv);
    }
}

function openEventModal(day) {
    eventModal.style.display = 'flex';

    eventDateInput.value =
        `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    eventNameInput.value = '';
    eventNameInput.focus();
}

closeModal.addEventListener('click', () => {
    eventModal.style.display = 'none';
});

saveEventBtn.addEventListener('click', async () => {
    const eventName = eventNameInput.value.trim();
    const eventDate = eventDateInput.value;

    const user = getCurrentUser();

    if (!user) {
        alert("Please log in before adding a calendar event.");
        return;
    }

    if (!eventName || !eventDate) {
        alert("Please enter an event name.");
        return;
    }

    try {
        const response = await fetch("/api/calendar-events", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: user.id,
                event_name: eventName,
                event_date: eventDate
            })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error || "Could not save event.");
            return;
        }

        events[eventDate] = eventName;

        generateCalendar(currentMonth, currentYear);

        eventModal.style.display = 'none';

        eventNameInput.value = '';

    } catch (error) {
        console.error("Error saving calendar event:", error);
        alert("Could not connect to the server.");
    }
});


prevBtn.addEventListener('click', () => {
    currentMonth--;

    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }

    generateCalendar(currentMonth, currentYear);
});

nextBtn.addEventListener('click', () => {
    currentMonth++;

    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }

    generateCalendar(currentMonth, currentYear);
});


loadEvents();

