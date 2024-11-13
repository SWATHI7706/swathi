// Initial storage for users and medications
const users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = localStorage.getItem("currentUser") || null;
let medications = [];
let history = [];

// Login functionality
document.getElementById("login-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    login(username);
    this.reset();
});

function login(username) {
    if (!users[username]) {
        users[username] = { medications: [], history: [] };
    }
    currentUser = username;
    medications = users[currentUser].medications;
    history = users[currentUser].history;
    localStorage.setItem("currentUser", username);
    localStorage.setItem("users", JSON.stringify(users));
    renderMedications();
    renderHistory();
}

// Add medication
document.getElementById("medicine-form").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const name = document.getElementById("medicine-name").value;
    const dosage = document.getElementById("dosage").value;
    const frequency = document.getElementById("frequency").value;
    const time = document.getElementById("medication-time").value.split(":");
    const pillCount = parseInt(document.getElementById("pill-count").value);
    const refillThreshold = parseInt(document.getElementById("refill-threshold").value);
    
    const medication = { name, dosage, frequency, time: { hour: parseInt(time[0]), minute: parseInt(time[1]) }, taken: false, pillCount, refillThreshold };
    medications.push(medication);
    users[currentUser].medications = medications;
    localStorage.setItem("users", JSON.stringify(users));
    renderMedications();
    checkForRefill();
    setDailyReminder(medication.time, name);  // Schedule reminder
    e.target.reset();
});

// Render medications
function renderMedications() {
    const medicationsList = document.getElementById("medications");
    medicationsList.innerHTML = "";
    medications.forEach((med, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${med.name}</strong> - ${med.dosage} (${med.frequency})
            <button onclick="markAsTaken(${index})">${med.taken ? "Taken" : "Mark as Taken"}</button>
        `;
        medicationsList.appendChild(li);
    });
}

// Mark medication as taken and add to history
function markAsTaken(index) {
    const med = medications[index];
    med.taken = true;
    med.pillCount -= 1;
    history.push({ ...med, date: new Date().toLocaleString() });
    users[currentUser].history = history;
    users[currentUser].medications = medications;
    localStorage.setItem("users", JSON.stringify(users));
    renderMedications();
    renderHistory();
    checkForRefill();
}

// Render history
function renderHistory() {
    const historyList = document.getElementById("history");
    historyList.innerHTML = "";
    history.forEach(entry => {
        const li = document.createElement("li");
        li.textContent = `${entry.date} - ${entry.name} (${entry.dosage})`;
        historyList.appendChild(li);
    });
}

// Check if medication refill is needed
function checkForRefill() {
    medications.forEach(med => {
        if (med.pillCount <= med.refillThreshold) {
            alert(`Refill reminder: You need to refill ${med.name}`);
        }
    });
}

// Notification permission and reminders
if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

function setDailyReminder(time, medicationName) {
    const now = new Date();
    const reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), time.hour, time.minute);

    if (now > reminderTime) {
        reminderTime.setDate(reminderTime.getDate() + 1);  // Schedule for next day if past
    }

    const msUntilReminder = reminderTime.getTime() - now.getTime();
    setTimeout(() => {
        new Notification(`Time to take ${medicationName}`);
        setDailyReminder(time, medicationName);  // Reschedule
    }, msUntilReminder);
}

// Initialize (run on load)
if (currentUser) {
    login(currentUser);
}
// Render medications
function renderMedications() {
    const medicationsList = document.getElementById("medications");
    medicationsList.innerHTML = ""; // Clear the list before rendering

    medications.forEach((med, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${med.name}</strong> - ${med.dosage} (${med.frequency})
            <button onclick="markAsTaken(${index})">${med.taken ? "Taken" : "Mark as Taken"}</button>
            <button onclick="deleteMedication(${index})">Delete</button>  <!-- Delete button -->
        `;
        medicationsList.appendChild(li);
    });
}
// Delete medication from both medications list and history
function deleteMedication(index) {
    const confirmation = confirm("Are you sure you want to delete this medication?");
    if (confirmation) {
        const medName = medications[index].name;  // Get the name of the medication to delete
        
        // Remove the medication from the medications array
        medications.splice(index, 1);  

        // Remove related history entries (if any)
        history = history.filter(item => item.medication !== medName);

        // Update medications and history in localStorage
        users[currentUser].medications = medications;
        users[currentUser].history = history;
        localStorage.setItem("users", JSON.stringify(users));  // Update localStorage
        
        renderMedications();  // Re-render medication list
        renderHistory();      // Re-render history list
    }
}

