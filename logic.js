//window.setInterval(refresh, 1000);

function refresh() {
    location.reload(true)
}

function doorOpen() {
    document.getElementById('door-left').style.transform = "translateX(-100%)";
    document.getElementById('door-right').style.transform = "translateX(100%)";
}

function doorClose() {
    document.getElementById('door-left').style.transform = "translateX(0)";
    document.getElementById('door-right').style.transform = "translateX(0)";
}

function goToFloor(level) {
    const cabin = document.querySelector('.cabin');
    cabin.classList.remove('floor-1', 'floor-2', 'floor-3');
    cabin.classList.add('floor-' + level);
}