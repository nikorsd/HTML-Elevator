//window.setInterval(refresh, 1000); // Used for auto refreshing the page on the development phase

let queue = []
let busy = false
let processing = false
let graceTimer = null
let moving = false

function refresh() {
    location.reload(true)
}

// Caller accepts "cabin-panel"
function doorOpen(caller) {
    if (caller === "cabin-panel" && busy) return
    document.getElementById('door-left').style.transform = "translateX(-100%)";
    document.getElementById('door-right').style.transform = "translateX(100%)";
}

// Caller accepts "cabin-panel"
function doorClose(caller) {
    if (caller === "cabin-panel" && busy) return
    document.getElementById('door-left').style.transform = "translateX(0)";
    document.getElementById('door-right').style.transform = "translateX(0)";
}

// Returns true if the door is open
// Also respects door movement time
function doorStatus() {
    if (document.getElementById('door-left').style.transform == "translateX(-100%)") {
        setTimeout(() => { return true }, 1500)
    } else {
        setTimeout(() => { return false }, 1500)
    }
}

// Level in integer; target floor
// Caller accepts "floor-call" or "cabin-panel"
async function addTask(level, caller) {
    // No duplicates
    if (queue.find(t => t.level === level)) return

    // Absolute slop... There should be better way of doing this but there isnt, classic javascript
    const cabin = document.querySelector('.cabin');
    const currentFloor = Number(cabin.className.split('-')[cabin.className.split('-').length - 1])

    // Assert that the elevator isnt already on the target floor
    // If it is, open the doors and close after 3 seconds
    if (currentFloor == level) {
        doorOpen()
        // Close the door after 3 seconds
        setTimeout(() => {doorClose()}, 3000)
        return
    }

    // Light up the button before moving
    const buttons = document.querySelectorAll('.elevator-button-outer');
    buttons.forEach((btn) => {
        const inner = btn.querySelector('.elevator-button-inner');
        if (inner && inner.textContent == level || btn.id?.includes(String(level))) {
            if (caller === 'cabin-panel' && btn.id) return
            btn.classList.add('lit');
        }
    });

    queue.push({level, caller})

    // Grace period: wait 2s so more presses can accumulate before sorting + executing
    clearTimeout(graceTimer)
    graceTimer = setTimeout(() => {
        sortQueue()
        processQueue()
    }, 2000)
}

async function processQueue() {
    if (processing || queue.length === 0) return
    processing = true

    while (queue.length > 0) {
        const task = queue.shift()
        await goToFloor(task.level, task.caller)
    }
    processing = false
}

// Caller here is a string that accepts either "cabin-panel" or "floor-call"
async function goToFloor(level, caller) {
    if (busy) return;
    busy = true;

    const cabin = document.querySelector('.cabin');

    // Absolute slop... There should be better way of doing this but there isnt, classic javascript
    const currentFloor = Number(cabin.className.split('-')[cabin.className.split('-').length - 1])

    // Close the door. Obviously...
    doorClose()

    // We wait if the elevator wasnt called to give time for boarding
    if (!doorStatus()) await new Promise(r => setTimeout(r, 2000))

    const statusDisplay = document.getElementById('cabin-status-display')
    if (currentFloor > level) {
        statusDisplay.innerHTML = "▼ " + currentFloor
    } else {
        statusDisplay.innerHTML = "▲ " + currentFloor
    }

    moving = true
    cabin.classList.remove('floor-1', 'floor-2', 'floor-3');
    cabin.classList.add('floor-' + level);

    // If we are traveling 2 floors, sync up the display correctly
    if (currentFloor - level == 2) {
        setTimeout(() => {
            statusDisplay.innerHTML = "▼ " + "2"
        }, 1500)
    }
    else if (currentFloor + level == 4) {
        setTimeout(() => {
            statusDisplay.innerHTML = "▲ " + "2"
        }, 1500)
    }

    // Wait for the 3s travel
    await new Promise(r => setTimeout(r, 3000))
    moving = false

    // Turn off the glow when the elevator arrives
    const buttons = document.querySelectorAll('.elevator-button-outer');
    buttons.forEach((btn) => {
        const inner = btn.querySelector('.elevator-button-inner');
        if (inner && inner.textContent == level || btn.id.includes(String(level))) {
            btn.classList.remove('lit');
        }
    });
    // Update the status display
    statusDisplay.innerHTML = "&ensp; " + level

    // Wait 1 more second, then open the doors (4s mark)
    await new Promise(r => setTimeout(r, 1000))
    doorOpen()

    // Wait 6 more seconds, then close the doors and release the elevator (10s mark)
    await new Promise(r => setTimeout(r, 6000))
    doorClose()
    busy = false
}

function call() {
    const button = document.querySelector('.elevator-button-outer')
    button.classList.toggle('lit')
}

// AI wrote this
// Was too lazy to think the logic for this
function sortQueue() {
    if (queue.length === 0) return
    const cabin = document.querySelector('.cabin')
    const currentFloor = Number(cabin.className.split('-')[cabin.className.split('-').length - 1])

    const firstTask = queue[0]
    const goingUp = firstTask.level >= currentFloor

    queue.sort((a, b) => {
        const aInDirection = goingUp ? a.level >= currentFloor : a.level <= currentFloor
        const bInDirection = goingUp ? b.level >= currentFloor : b.level <= currentFloor

        if (aInDirection && !bInDirection) return -1
        if (!aInDirection && bInDirection) return 1

        if (goingUp) return a.level - b.level
        return b.level - a.level
    })
}