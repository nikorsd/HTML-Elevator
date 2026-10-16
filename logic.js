//window.setInterval(refresh, 1000);

let queue = []
let busy = false
let processing = false

function refresh() {
    location.reload(true)
}

// Caller accepts "cabin-panel"
function doorOpen(caller) {
    if (caller == "cabin-panel" && busy) return
    document.getElementById('door-left').style.transform = "translateX(-100%)";
    document.getElementById('door-right').style.transform = "translateX(100%)";
}

// Caller accepts "cabin-panel"
function doorClose(caller) {
    if (caller == "cabin-panel" && busy) return
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

async function addTask(level, caller) {
    // No duplicates
    if (queue.find(t => t.level === level)) return

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
    processQueue()
}

async function processQueue() {
    if (processing || queue.length === 0) return
    processing = true

    while (queue.length > 0) {
        const task = queue.shift()
        await goToFloor(task.level, task.caller)
        await new Promise(r => setTimeout(r, 6000))
    }
    processing = false
}

// Caller here is a string that accepts either "cabin-panel" or "floor-call"
async function goToFloor(level, caller) {
    if (busy) return;
    busy = true;

    const cabin = document.querySelector('.cabin');
    // Open the door and return if the cabin is already at that floor
    if ('cabin floor-' + level === cabin.className) {
        doorOpen()
        // Close the door after 3 seconds
        setTimeout(() => {doorClose()}, 3000)
        return
    }

    // Light up the pressed floor button
    const buttons = document.querySelectorAll('.elevator-button-outer');
    buttons.forEach((btn) => {
        const inner = btn.querySelector('.elevator-button-inner');
        if (inner && inner.textContent == level || btn.id.includes(String(level))) {
            // Assert that the button that was pressed was inside the cabin, if yes. Do not light the call buttons outside
            if (caller == 'cabin-panel' && btn.id) return
            btn.classList.add('lit');
        }
    })

    // We wait if the elevator wasnt called to give time for boarding
    //if (!caller.includes('floor-call')) await new Promise(r => setTimeout(r, 2000))
    if (!doorStatus()) await new Promise(r => setTimeout(r, 2000))

    // Close the door. Obviously...
    doorClose()

    // We wait if the elevator wasnt called to give time for boarding
    //if (!caller.includes('floor-call')) await new Promise(r => setTimeout(r, 2000))
    if (!doorStatus()) await new Promise(r => setTimeout(r, 2000))

    // Absolute slop... There should be better way of doing this but there isnt, classic javascript
    const currentFloor = Number(cabin.className.split('-')[cabin.className.split('-').length - 1])

    const statusDisplay = document.getElementById('cabin-status-display')
    if (currentFloor > level) {
        statusDisplay.innerHTML = "▼ " + currentFloor
    } else {
        statusDisplay.innerHTML = "▲ " + currentFloor
    }

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

    // Turn off the glow when the elevator arrives (after 3s transition)
    setTimeout(() => {
        buttons.forEach((btn) => {
            const inner = btn.querySelector('.elevator-button-inner');
            if (inner && inner.textContent == level || btn.id.includes(String(level))) {
                btn.classList.remove('lit');
            }
        });
        statusDisplay.innerHTML = "&ensp; " + level
    }, 3000)

    setTimeout(() => {
        doorOpen()
    }, 4000)

    setTimeout(() => {
        doorClose()
    }, 10000)

    busy = false;
}

function call() {
    const button = document.querySelector('.elevator-button-outer')
    button.classList.toggle('lit')
}