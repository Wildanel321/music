// Get DOM elements
const audioFileInput = document.getElementById('audioFile');
const songTitle = document.getElementById('songTitle');
const songDuration = document.getElementById('songDuration');
const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');
const progressBar = document.getElementById('progressBar');
const currentTime = document.getElementById('currentTime');
const totalTime = document.getElementById('totalTime');
const volumeSlider = document.getElementById('volumeSlider');
const visualizer = document.getElementById('visualizer');
const changeThemeBtn = document.getElementById('changeThemeBtn');
const lowSlider = document.getElementById('lowSlider');
const midSlider = document.getElementById('midSlider');
const highSlider = document.getElementById('highSlider');

// Audio context and analyzer for visualizer
let audioContext;
let analyser;
let dataArray;
let bufferLength;
let animationId;

// Equalizer filters
let lowFilter;
let midFilter;
let highFilter;

// Audio element
let audio = new Audio();

// Canvas context
const canvas = visualizer;
const canvasCtx = canvas.getContext('2d');

// Theme colors
let currentTheme = 0;
const themes = [
    { primary: '#00d4ff', secondary: '#0099cc', accent: '#667eea' },
    { primary: '#ff6b6b', secondary: '#ee5a24', accent: '#764ba2' },
    { primary: '#a8e6cf', secondary: '#ffd3a5', accent: '#667eea' }
];

// Initialize audio context
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // Create equalizer filters
        lowFilter = audioContext.createBiquadFilter();
        lowFilter.type = 'lowshelf';
        lowFilter.frequency.value = 320;
        lowFilter.gain.value = 0;

        midFilter = audioContext.createBiquadFilter();
        midFilter.type = 'peaking';
        midFilter.frequency.value = 1000;
        midFilter.Q.value = 0.707;
        midFilter.gain.value = 0;

        highFilter = audioContext.createBiquadFilter();
        highFilter.type = 'highshelf';
        highFilter.frequency.value = 3200;
        highFilter.gain.value = 0;
    }
}

// Load audio file
audioFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const fileURL = URL.createObjectURL(file);
        audio.src = fileURL;
        songTitle.textContent = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension

        audio.addEventListener('loadedmetadata', function() {
            const duration = formatTime(audio.duration);
            songDuration.textContent = `Duration: ${duration}`;
            totalTime.textContent = duration;
            progressBar.max = audio.duration;
        });

        // Connect to audio context for visualizer and equalizer
        initAudioContext();
        const source = audioContext.createMediaElementSource(audio);
        source.connect(lowFilter);
        lowFilter.connect(midFilter);
        midFilter.connect(highFilter);
        highFilter.connect(analyser);
        analyser.connect(audioContext.destination);

        // Start visualizer
        drawVisualizer();
    }
});

// Play/Pause button
playPauseBtn.addEventListener('click', function() {
    if (audio.paused) {
        audio.play();
        playPauseBtn.textContent = 'Pause';
    } else {
        audio.pause();
        playPauseBtn.textContent = 'Play';
    }
});

// Stop button
stopBtn.addEventListener('click', function() {
    audio.pause();
    audio.currentTime = 0;
    playPauseBtn.textContent = 'Play';
    progressBar.value = 0;
    currentTime.textContent = '00:00';
});

// Update progress bar and time
audio.addEventListener('timeupdate', function() {
    progressBar.value = audio.currentTime;
    currentTime.textContent = formatTime(audio.currentTime);
});

// Seek functionality
progressBar.addEventListener('input', function() {
    audio.currentTime = progressBar.value;
});

// Volume control
volumeSlider.addEventListener('input', function() {
    audio.volume = volumeSlider.value / 100;
});

// Equalizer controls
lowSlider.addEventListener('input', function() {
    lowFilter.gain.value = parseFloat(lowSlider.value);
});

midSlider.addEventListener('input', function() {
    midFilter.gain.value = parseFloat(midSlider.value);
});

highSlider.addEventListener('input', function() {
    highFilter.gain.value = parseFloat(highSlider.value);
});

// Format time to MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Visualizer function
function drawVisualizer() {
    animationId = requestAnimationFrame(drawVisualizer);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = 'rgba(15, 15, 35, 0.1)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = canvasCtx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, themes[currentTheme].primary);
        gradient.addColorStop(1, themes[currentTheme].secondary);

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
    }
}

// Change theme
changeThemeBtn.addEventListener('click', function() {
    currentTheme = (currentTheme + 1) % themes.length;
    updateTheme();
});

// Update theme colors
function updateTheme() {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', themes[currentTheme].primary);
    root.style.setProperty('--secondary-color', themes[currentTheme].secondary);
    root.style.setProperty('--accent-color', themes[currentTheme].accent);

    // Update CSS variables for dynamic styling
    document.body.style.setProperty('--glow-color', themes[currentTheme].primary);
}

// Initialize theme
updateTheme();

// Handle window resize for responsive canvas
window.addEventListener('resize', function() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
});

// Initial canvas size
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
