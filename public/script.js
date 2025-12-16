// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadContent = document.getElementById('upload-content');
const loadingState = document.getElementById('loading-state');
const resultState = document.getElementById('result-state');
const fileName = document.getElementById('file-name');
const videoOutput = document.getElementById('output-video');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');
const errorState = document.getElementById('error-state');
const errorText = document.getElementById('error-text');
const retryBtn = document.getElementById('retry-btn');

const selectedFileInfo = document.getElementById('selected-file-info');
const sendBtn = document.getElementById('send-btn');
let selectedFile = null;

// Drag and Drop Events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropZone.classList.add('drag-over');
}

function unhighlight(e) {
    dropZone.classList.remove('drag-over');
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

fileInput.addEventListener('change', function () {
    handleFiles(this.files);
});

// Main Actions
function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('video/')) {
            // Updated Flow: Select first, then Send.
            selectedFile = file;
            fileName.textContent = `الملف المحدد: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            selectedFileInfo.classList.remove('hidden');
            addLog(`File selected: ${file.name}`);
        } else {
            showError('يرجى تحميل ملف فيديو صالح.');
        }
    }
}

sendBtn.addEventListener('click', () => {
    if (selectedFile) {
        uploadFile(selectedFile);
    }
});

// Slider Logic
const qualitySlider = document.getElementById('quality-slider');
const qualityDisplay = document.getElementById('quality-display');

const resolutions = ["1280x720", "1920x1080", "3840x2160"];
const resolutionLabels = ["720p", "1080p", "4K"];

qualitySlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    qualityDisplay.textContent = resolutionLabels[val];
    qualityDisplay.style.transform = "scale(1.1)";
    setTimeout(() => qualityDisplay.style.transform = "scale(1)", 200);
});

// Logs Logic (Inline)
const logsToggle = document.getElementById('logs-toggle-inline');
const logsContentDiv = document.getElementById('logs-content-inline');
const logsChevron = document.getElementById('logs-chevron');

logsToggle.addEventListener('click', () => {
    if (logsContentDiv.style.display === 'none') {
        logsContentDiv.style.display = 'block';
        logsChevron.classList.remove('fa-chevron-down');
        logsChevron.classList.add('fa-chevron-up');
    } else {
        logsContentDiv.style.display = 'none';
        logsChevron.classList.remove('fa-chevron-up');
        logsChevron.classList.add('fa-chevron-down');
    }
});

function addLog(message) {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
    entry.style.padding = "2px 0";
    entry.textContent = `[${time}] ${message}`;
    logsContentDiv.appendChild(entry);
    logsContentDiv.scrollTop = logsContentDiv.scrollHeight;
    console.log(`[Log] ${message}`);
}

async function uploadFile(file) {
    // UI Update
    uploadContent.classList.add('hidden');
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');

    addLog(`Starting upload for file: ${file.name}`);

    // Get Resolution
    const sliderVal = parseInt(qualitySlider.value);
    const resolution = resolutions[sliderVal];
    addLog(`Selected Target Resolution: ${resolution} (${resolutionLabels[sliderVal]})`);

    // Prepare Data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_resolution', resolution);

    try {
        const apiUrl = '/api/upscale';
        addLog(`Sending POST request to ${apiUrl}...`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        });

        addLog(`Response received. Status: ${response.status} ${response.statusText}`);

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            var data = await response.json();
            if (!response.ok) {
                addLog(`Server returned error: ${data.detail}`);
                if (response.status === 401 || (data.detail && data.detail.includes("401"))) {
                    throw new Error("خطأ في المفاتيح: تأكد من إضافة RUNPOD_API_KEY في إعدادات Vercel.");
                }
                throw new Error(data.detail || 'فشل التحميل');
            }
        } else {
            const textHTML = await response.text();
            console.error("Non-JSON Response:", textHTML);
            const snippet = textHTML.substring(0, 200).replace(/</g, "&lt;");
            addLog(`Non-JSON Error received: ${snippet}`);
            throw new Error(`خطأ في السيرفر (${response.status}): ${snippet}...`);
        }

        addLog("Processing response data...");
        if (data.url) {
            addLog(`Success! Video URL URL: ${data.url}`);
            showResult(data.url);
        } else if (data.output) {
            if (typeof data.output === 'string' && data.output.startsWith('http')) {
                showResult(data.output);
            } else {
                showResultUrlOrRaw(data.output);
            }
        } else {
            addLog("Error: Invalid response structure.");
            throw new Error('استجابة غير صالحة من السيرفر');
        }

    } catch (error) {
        console.error('Error:', error);
        addLog(`EXCEPTION: ${error.message}`);
        showError(error.message);
        // Expand logs on error
        logsContentDiv.style.display = 'block';
        logsChevron.classList.remove('fa-chevron-down');
        logsChevron.classList.add('fa-chevron-up');
    }
}

function showResultUrlOrRaw(output) {
    if (typeof output === 'object') {
        showError("مخرجات معقدة: " + JSON.stringify(output));
    } else {
        showError("المخرجات: " + output);
    }
}

function showResult(url) {
    loadingState.classList.add('hidden');
    resultState.classList.remove('hidden');
    videoOutput.src = url;
    downloadBtn.href = url;
}

function showError(msg) {
    loadingState.classList.add('hidden');
    uploadContent.classList.add('hidden');
    resultState.classList.add('hidden');
    errorState.classList.remove('hidden');
    errorText.innerHTML = msg;
}


function resetUI() {
    resultState.classList.add('hidden');
    errorState.classList.add('hidden');
    uploadContent.classList.remove('hidden');
    selectedFileInfo.classList.add('hidden'); // Hide selected file info
    fileInput.value = ''; // Reset input
    selectedFile = null;
    videoOutput.src = '';
    logsContentDiv.innerHTML = '';
    // logsContentDiv.style.display = 'none'; // Keep logs open if they were open? Or close? User preference.
}

resetBtn.addEventListener('click', resetUI);
retryBtn.addEventListener('click', resetUI);
