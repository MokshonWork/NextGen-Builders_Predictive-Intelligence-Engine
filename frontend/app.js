// FutureSight AI - Interactive Frontend Controller

// Configuration & Global State
let API_URL = 'http://localhost:8502'; // Background Flask Port
let sessionId = generateSessionId();
let uploadedFile = null;
let currentDataset = null; // Store current active dataset details
let isCustomLoaded = false;

// SVGs and Elements
document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Theme Management
    initTheme();

    // Sidebar Collapse
    initSidebar();

    // File Upload Setup
    initFileUpload();

    // Forecast Controls
    initForecastControls();

    // Architecture SVG Setup
    initArchitectureDiagram();
    
    // Check if there's any query parameter specifying API port
    const urlParams = new URLSearchParams(window.location.search);
    const portParam = urlParams.get('api_port');
    if (portParam) {
        API_URL = `http://localhost:${portParam}`;
        console.log("Custom API Port set to:", API_URL);
    }
});

// Helper: Session ID Generator
function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// ----------------------------------------------------
// Tab / Page Switching Logic
// ----------------------------------------------------
window.switchTab = function(tabName) {
    // Update breadcrumb current page
    const breadcrumbCurrent = document.getElementById("current-page-title");
    breadcrumbCurrent.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);

    // Update active nav links
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        if (link.getAttribute("data-tab") === tabName) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Toggle active sections
    const sections = document.querySelectorAll(".page-section");
    sections.forEach(sec => {
        sec.classList.remove("active");
    });
    
    const targetSection = document.getElementById(`page-${tabName}`);
    if (targetSection) {
        targetSection.classList.add("active");
        
        // Relayout plotly charts if page changes (Plotly requires layout updates when container visibility changes)
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }
};

// Bind sidebar navigation events
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = link.getAttribute("data-tab");
        switchTab(tab);
    });
});

// ----------------------------------------------------
// Theme Management
// ----------------------------------------------------
function initTheme() {
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    const darkBtn = document.getElementById("setting-theme-dark");
    const lightBtn = document.getElementById("setting-theme-light");

    // Fetch theme from localStorage or default to dark
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);

    themeToggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "light" ? "dark" : "light";
        setTheme(newTheme);
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    
    // Update settings buttons
    const darkBtn = document.getElementById("setting-theme-dark");
    const lightBtn = document.getElementById("setting-theme-light");
    
    if (darkBtn && lightBtn) {
        if (theme === "dark") {
            darkBtn.classList.add("active");
            lightBtn.classList.remove("active");
        } else {
            lightBtn.classList.add("active");
            darkBtn.classList.remove("active");
        }
    }
    
    // Trigger plotly redraws if graphs exist
    if (currentDataset) {
        setTimeout(() => {
            renderCharts(currentDataset);
        }, 100);
    }
}

window.setThemeMode = function(mode) {
    setTheme(mode);
};

// ----------------------------------------------------
// Sidebar Handling
// ----------------------------------------------------
function initSidebar() {
    const sidebar = document.getElementById("sidebar");
    const collapseBtn = document.getElementById("collapse-sidebar-btn");
    const expandBtn = document.getElementById("expand-sidebar-btn");

    collapseBtn.addEventListener("click", () => {
        sidebar.classList.add("collapsed");
        expandBtn.classList.remove("hidden");
        // Relayout charts
        setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 300);
    });

    expandBtn.addEventListener("click", () => {
        sidebar.classList.remove("collapsed");
        expandBtn.classList.add("hidden");
        // Relayout charts
        setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 300);
    });
}

// ----------------------------------------------------
// File Upload & CSV Parsing
// ----------------------------------------------------
function initFileUpload() {
    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("file-input");
    const progressWrapper = document.getElementById("upload-progress-wrapper");
    const progressFill = document.getElementById("upload-progress-bar-fill");
    const progressPercent = document.getElementById("upload-progress-percent");
    const validationPanel = document.getElementById("validation-report-panel");
    const previewPanel = document.getElementById("dataset-preview-panel");

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    // Handle selected files
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        handleFiles(files);
    });

    // Reset button
    document.getElementById("reset-upload-btn").addEventListener("click", () => {
        uploadedFile = null;
        fileInput.value = "";
        progressWrapper.classList.add("hidden");
        validationPanel.classList.add("hidden");
        previewPanel.classList.add("hidden");
        dropArea.classList.remove("hidden");
        
        // Disable custom dataset choice
        const customOpt = document.getElementById("dataset-custom-option");
        customOpt.disabled = true;
        
        const selector = document.getElementById("dataset-selector");
        if (selector.value === "custom") {
            selector.value = "sales";
        }
        isCustomLoaded = false;
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleFiles(files) {
    if (files.length === 0) return;
    const file = files[0];
    
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        alert("Please upload a valid CSV dataset file.");
        return;
    }
    
    uploadedFile = file;
    simulateUploadProgress(file);
}

function simulateUploadProgress(file) {
    const dropArea = document.getElementById("drop-area");
    const progressWrapper = document.getElementById("upload-progress-wrapper");
    const progressFill = document.getElementById("upload-progress-bar-fill");
    const progressPercent = document.getElementById("upload-progress-percent");

    dropArea.classList.add("hidden");
    progressWrapper.classList.remove("hidden");
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressFill.style.width = `${progress}%`;
        progressPercent.textContent = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            // Submit to Backend Flask API for processing
            uploadToBackend(file);
        }
    }, 100);
}

async function uploadToBackend(file) {
    const validationPanel = document.getElementById("validation-report-panel");
    const previewPanel = document.getElementById("dataset-preview-panel");
    const messagesContainer = document.getElementById("validation-messages-container");
    const statusBadge = document.getElementById("validation-status-badge");
    const cleaningStats = document.getElementById("cleaning-stats-wrapper");
    const proceedBtn = document.getElementById("proceed-forecast-btn");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);

    try {
        const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server returned code ${response.status}`);
        }

        const data = await response.json();
        
        validationPanel.classList.remove("hidden");
        messagesContainer.innerHTML = "";
        
        if (data.is_valid) {
            statusBadge.textContent = "VALID";
            statusBadge.className = "badge badge-success";
            proceedBtn.classList.remove("hidden");
            
            // Show cleaning report
            cleaningStats.classList.remove("hidden");
            document.getElementById("clean-stat-dup").textContent = data.clean_log.duplicates_removed;
            document.getElementById("clean-stat-null").textContent = data.clean_log.nulls_filled;
            document.getElementById("clean-stat-outlier").textContent = data.clean_log.outliers_capped;
            document.getElementById("clean-stat-total").textContent = data.clean_log.final_row_count;
            
            // Display preview table
            previewPanel.classList.remove("hidden");
            document.getElementById("preview-metadata-badge").textContent = `Freq: ${data.detected_frequency} | Count: ${data.clean_log.final_row_count} rows`;
            populatePreviewTable(data.preview_data);
            
            // Success Message
            messagesContainer.innerHTML = `
                <div class="validation-msg success">
                    <i data-lucide="check-circle-2"></i>
                    <div>
                        <strong>Dataset schema verified successfully!</strong> Found required columns 'Date' and 'Value'. Frequency detected as ${data.detected_frequency}.
                    </div>
                </div>
            `;
            
            // Enable Custom Option on Forecast Selector
            const customOpt = document.getElementById("dataset-custom-option");
            customOpt.disabled = false;
            
            // Auto Select custom dataset
            const selector = document.getElementById("dataset-selector");
            selector.value = "custom";
            isCustomLoaded = true;

        } else {
            statusBadge.textContent = "INVALID";
            statusBadge.className = "badge badge-error";
            proceedBtn.classList.add("hidden");
            cleaningStats.classList.add("hidden");
            previewPanel.classList.add("hidden");
            
            // Populate errors
            data.errors.forEach(err => {
                const errDiv = document.createElement("div");
                errDiv.className = "validation-msg error";
                errDiv.innerHTML = `
                    <i data-lucide="alert-triangle"></i>
                    <div><strong>Error:</strong> ${err}</div>
                `;
                messagesContainer.appendChild(errDiv);
            });
        }
        
        // Add warnings if any
        if (data.warnings && data.warnings.length > 0) {
            data.warnings.forEach(warn => {
                const warnDiv = document.createElement("div");
                warnDiv.className = "validation-msg warning";
                warnDiv.innerHTML = `
                    <i data-lucide="alert-circle"></i>
                    <div><strong>Warning:</strong> ${warn}</div>
                `;
                messagesContainer.appendChild(warnDiv);
            });
        }

        lucide.createIcons();

    } catch (e) {
        console.error(e);
        statusBadge.textContent = "ERROR";
        statusBadge.className = "badge badge-error";
        messagesContainer.innerHTML = `
            <div class="validation-msg error">
                <i data-lucide="x-circle"></i>
                <div>
                    <strong>Connection Failed!</strong> Backend predictive service did not respond. Check connection to host: ${API_URL}.
                </div>
            </div>
        `;
        lucide.createIcons();
    }
}

function populatePreviewTable(rows) {
    const tbody = document.getElementById("preview-table-body");
    tbody.innerHTML = "";
    
    rows.forEach(r => {
        const tr = document.createElement("tr");
        const d = new Date(r.Date);
        const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
        const valStr = typeof r.Value === 'number' ? r.Value.toFixed(2) : r.Value;
        
        tr.innerHTML = `
            <td>${dateStr}</td>
            <td>${valStr}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ----------------------------------------------------
// Forecast Controls & Execution
// ----------------------------------------------------
function initForecastControls() {
    const horizonSlider = document.getElementById("forecast-horizon-slider");
    const scenarioSlider = document.getElementById("scenario-slider");
    const horizonDisplay = document.getElementById("horizon-val-display");
    const scenarioDisplay = document.getElementById("scenario-val-display");
    const executeBtn = document.getElementById("generate-forecast-btn");
    const downloadCsvBtn = document.getElementById("download-forecast-csv-btn");

    horizonSlider.addEventListener("input", (e) => {
        horizonDisplay.textContent = `${e.target.value} days`;
    });

    scenarioSlider.addEventListener("input", (e) => {
        const val = e.target.value;
        const prefix = val > 0 ? '+' : '';
        scenarioDisplay.textContent = `${prefix}${val}%`;
    });

    executeBtn.addEventListener("click", () => {
        runForecastWorkflow();
    });

    downloadCsvBtn.addEventListener("click", () => {
        downloadForecastCSV();
    });
}

async function runForecastWorkflow() {
    const datasetType = document.getElementById("dataset-selector").value;
    const horizon = document.getElementById("forecast-horizon-slider").value;
    const scenarioPercentage = document.getElementById("scenario-slider").value;
    const confidenceWidth = document.getElementById("setting-confidence-width").value;
    
    const chartSkeleton = document.getElementById("chart-skeleton-view");
    const chartDiv = document.getElementById("plotly-forecast-chart");
    const footerActions = document.getElementById("forecast-footer-actions");
    const executeBtn = document.getElementById("generate-forecast-btn");

    executeBtn.disabled = true;
    executeBtn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> Processing Forecast...`;
    lucide.createIcons();

    // Trigger SVG Workflow Animation
    await animatePipelineStart();

    try {
        const response = await fetch(`${API_URL}/api/forecast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: sessionId,
                dataset_type: datasetType,
                horizon: parseInt(horizon),
                scenario_percentage: parseInt(scenarioPercentage),
                confidence_width: parseInt(confidenceWidth)
            })
        });

        if (!response.ok) {
            throw new Error(`Forecast request failed: status ${response.status}`);
        }

        const data = await response.json();
        currentDataset = data;

        // Complete Pipeline highlight
        await animatePipelineComplete();

        // Populate dashboard components
        animateMetricsCounters(data.metrics);
        populateAIInsights(data.insights);
        
        // Hide skeleton show chart
        chartSkeleton.classList.add("hidden");
        chartDiv.classList.remove("hidden");
        footerActions.classList.remove("hidden");

        // Render charts
        renderCharts(data);
        
        // Update Chart Title
        const labels = {
            sales: 'Sales Forecast',
            stock: 'Stock Market Forecast',
            electricity: 'Electricity Forecast',
            traffic: 'Website Traffic Forecast',
            custom: 'Custom Dataset Forecast'
        };
        document.getElementById("forecast-chart-title").textContent = labels[datasetType] || "Forecast Output";

    } catch (e) {
        console.error(e);
        alert("Forecasting failed: " + e.message);
        stopPipelineAnimation();
    } finally {
        executeBtn.disabled = false;
        executeBtn.innerHTML = `Generate Forecast`;
        lucide.createIcons();
    }
}

// ----------------------------------------------------
// Metrics Animate Counters
// ----------------------------------------------------
function animateMetricsCounters(metrics) {
    animateCounter("kpi-current-val", metrics.current_value, "$", "");
    animateCounter("kpi-predicted-val", metrics.predicted_value, "$", "");
    
    const growthVal = metrics.growth_rate;
    const arrow = growthVal >= 0 ? "↑ " : "↓ ";
    animateCounter("kpi-growth-val", Math.abs(growthVal), arrow, "%");
    
    // Risk assessment styling
    const riskEl = document.getElementById("kpi-risk-val");
    riskEl.textContent = metrics.risk_level;
    const subEl = document.getElementById("kpi-risk-sub");
    
    if (metrics.risk_level === "High") {
        riskEl.className = "kpi-value text-red";
        riskEl.style.color = "var(--metric-down)";
        subEl.textContent = "High prediction volatility bounds";
    } else if (metrics.risk_level === "Medium") {
        riskEl.className = "kpi-value text-yellow";
        riskEl.style.color = "#F59E0B";
        subEl.textContent = "Moderate predicted deviations";
    } else {
        riskEl.className = "kpi-value text-green";
        riskEl.style.color = "var(--metric-up)";
        subEl.textContent = "Stable historical variance bounds";
    }
}

function animateCounter(id, endValue, prefix, suffix) {
    const el = document.getElementById(id);
    if (!el) return;
    
    let start = 0;
    const duration = 800; // ms
    const steps = 40;
    const stepValue = endValue / steps;
    let stepCount = 0;

    const timer = setInterval(() => {
        start += stepValue;
        stepCount++;
        el.textContent = `${prefix}${start.toFixed(2)}${suffix}`;
        
        if (stepCount >= steps) {
            clearInterval(timer);
            el.textContent = `${prefix}${endValue.toFixed(2)}${suffix}`;
        }
    }, duration / steps);
}

// ----------------------------------------------------
// AI Insights Page Population
// ----------------------------------------------------
function populateAIInsights(insights) {
    document.getElementById("insight-trend-text").textContent = insights.trend;
    const trendInd = document.getElementById("insight-trend-indicator");
    if (insights.trend.toLowerCase().includes("growth")) {
        trendInd.className = "pill-indicator positive";
    } else {
        trendInd.className = "pill-indicator negative";
    }

    document.getElementById("insight-growth-text").textContent = `${insights.growth > 0 ? '+' : ''}${insights.growth.toFixed(2)}%`;
    const growthInd = document.getElementById("insight-growth-indicator");
    if (insights.growth >= 0) {
        growthInd.className = "pill-indicator positive";
    } else {
        growthInd.className = "pill-indicator negative";
    }

    document.getElementById("insight-risk-text").textContent = insights.risk;
    const riskInd = document.getElementById("insight-risk-indicator");
    riskInd.className = `pill-indicator risk-${insights.risk.toLowerCase().substring(0,3)}`;

    // Explanation cards
    document.getElementById("insight-historical-desc").textContent = insights.rationalization.historical;
    document.getElementById("insight-trend-desc").textContent = insights.rationalization.trend;
    document.getElementById("insight-seasonal-desc").textContent = insights.rationalization.seasonal;
    document.getElementById("insight-scenario-desc").textContent = insights.rationalization.scenario;

    // Strategic Action
    document.getElementById("insight-recommendation-text").textContent = insights.recommendation;
}

// ----------------------------------------------------
// Rendering Charts using Plotly.js
// ----------------------------------------------------
function renderCharts(data) {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    
    // Core Colors
    const textThemeColor = isDark ? '#E4E4E7' : '#111111';
    const gridThemeColor = isDark ? '#27272A' : '#E4E4E7';
    const fillThemeColor = isDark ? 'rgba(217, 4, 41, 0.1)' : 'rgba(193, 18, 31, 0.05)';
    
    // Render Forecast Chart
    renderForecastChart(data, isDark, textThemeColor, gridThemeColor, fillThemeColor);
    
    // Render Analytics Subcharts
    renderAnalyticsCharts(data, isDark, textThemeColor, gridThemeColor, fillThemeColor);
}

function renderForecastChart(data, isDark, textColor, gridColor, fillColor) {
    const historyX = data.history.map(pt => pt.Date);
    const historyY = data.history.map(pt => pt.Value);
    const forecastX = data.forecast.map(pt => pt.Date);
    const forecastY = data.forecast.map(pt => pt.Forecast);
    const upperY = data.forecast.map(pt => pt.Upper);
    const lowerY = data.forecast.map(pt => pt.Lower);

    const datasetType = document.getElementById("dataset-selector").value;
    const yAxisLabels = {
        sales: 'Sales (Units)',
        stock: 'Price ($)',
        electricity: 'Consumption (kWh)',
        traffic: 'Visitors',
        custom: 'Value'
    };
    const yAxisLabel = yAxisLabels[datasetType] || 'Value';

    const traces = [];

    // Historical trace
    traces.push({
        x: historyX,
        y: historyY,
        name: 'Historical Data',
        mode: 'lines',
        line: { color: '#D1D5DB', width: 2, dash: 'solid' }
    });

    // Confidence Band Lower (Zero fill)
    traces.push({
        x: forecastX,
        y: lowerY,
        name: 'Lower Confidence Band',
        mode: 'lines',
        line: { width: 0 },
        showlegend: false,
        hoverinfo: 'none'
    });

    // Confidence Band Upper (Fill to Lower)
    traces.push({
        x: forecastX,
        y: upperY,
        name: 'Confidence Bounds (95%)',
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: isDark ? 'rgba(164, 22, 26, 0.15)' : 'rgba(193, 18, 31, 0.15)',
        line: { width: 0 },
        hoverinfo: 'none'
    });

    // Forecast trace
    traces.push({
        x: forecastX,
        y: forecastY,
        name: 'TimesFM Forecast',
        mode: 'lines',
        line: { color: '#FF2D55', width: 4, shape: 'spline' }
    });

    const labelTextColor = isDark ? '#FFFFFF' : '#111111';
    const tickTextColor = isDark ? '#E4E4E7' : '#111111';
    const refinedGridColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 50, r: 50, b: 70, l: 85 },
        showlegend: true,
        legend: {
            orientation: 'v',
            x: 0.02,
            y: 0.98,
            xanchor: 'left',
            yanchor: 'top',
            bgcolor: isDark ? 'rgba(24, 24, 27, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            bordercolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderwidth: 1,
            font: { color: textColor, family: 'var(--font-primary)', size: 12 }
        },
        xaxis: {
            title: {
                text: 'Date',
                font: { color: labelTextColor, family: 'var(--font-primary)', size: 14, weight: 'bold' }
            },
            gridcolor: refinedGridColor,
            zeroline: false,
            tickfont: { color: tickTextColor, family: 'var(--font-primary)', size: 12 }
        },
        yaxis: {
            title: {
                text: yAxisLabel,
                font: { color: labelTextColor, family: 'var(--font-primary)', size: 14, weight: 'bold' }
            },
            gridcolor: refinedGridColor,
            zeroline: false,
            tickfont: { color: tickTextColor, family: 'var(--font-primary)', size: 12 }
        },
        hovermode: 'x unified',
        hoverlabel: {
            bgcolor: isDark ? '#18181B' : '#FFFFFF',
            bordercolor: '#FF2D55',
            font: {
                color: labelTextColor,
                family: 'var(--font-primary)',
                size: 14
            },
            namelength: -1
        }
    };

    const config = { 
        responsive: true, 
        displaylogo: false, 
        modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d', 'toggleSpikelines', 'hoverCompareCartesian'] 
    };
    Plotly.newPlot('plotly-forecast-chart', traces, layout, config);
}

function renderAnalyticsCharts(data, isDark, textColor, gridColor, fillColor) {
    // 1. Correlation Heatmap
    const corrMatrix = data.analytics.correlation.matrix;
    const corrLabels = data.analytics.correlation.labels;
    
    const heatmapTrace = [{
        z: corrMatrix,
        x: corrLabels,
        y: corrLabels,
        type: 'heatmap',
        colorscale: isDark ? [
            [0, '#09090B'],
            [0.5, '#A4161A'],
            [1.0, '#FF2D55']
        ] : [
            [0, '#FFFFFF'],
            [0.5, '#C1121F'],
            [1.0, '#F21B3F']
        ],
        showscale: false
    }];
    
    const heatmapLayout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 10, r: 10, b: 30, l: 30 },
        xaxis: { tickfont: { color: textColor } },
        yaxis: { tickfont: { color: textColor } }
    };
    
    Plotly.newPlot('plotly-heatmap-chart', heatmapTrace, heatmapLayout, { responsive: true, displayModeBar: false });

    // 2. Value Distribution (Histogram)
    const historyVals = data.history.map(pt => pt.Value);
    const histTrace = [{
        x: historyVals,
        type: 'histogram',
        nbinsx: 20,
        marker: {
            color: 'var(--accent-primary)',
            line: { color: isDark ? '#09090B' : '#FFFFFF', width: 0.5 }
        }
    }];
    
    const histLayout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 10, r: 10, b: 30, l: 40 },
        xaxis: { gridcolor: gridColor, tickfont: { color: textColor } },
        yaxis: { gridcolor: gridColor, tickfont: { color: textColor } }
    };
    
    Plotly.newPlot('plotly-histogram-chart', histTrace, histLayout, { responsive: true, displayModeBar: false });

    // 3. Trend Decomposition (Value vs 14d MA)
    const trendX = data.history.map(pt => pt.Date);
    const rawY = data.history.map(pt => pt.Value);
    const smoothY = data.analytics.trend_ma;
    
    const trendTraces = [
        {
            x: trendX,
            y: rawY,
            name: 'Original Values',
            type: 'scatter',
            mode: 'lines',
            line: { color: isDark ? '#27272A' : '#D4D4D8', width: 1.5 }
        },
        {
            x: trendX,
            y: smoothY,
            name: 'Smoothed Trend',
            type: 'scatter',
            mode: 'lines',
            line: { color: 'var(--accent-primary)', width: 2.5 }
        }
    ];
    
    const trendLayout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 10, r: 10, b: 30, l: 40 },
        showlegend: false,
        xaxis: { gridcolor: gridColor, tickfont: { color: textColor } },
        yaxis: { gridcolor: gridColor, tickfont: { color: textColor } }
    };
    Plotly.newPlot('plotly-trend-chart', trendTraces, trendLayout, { responsive: true, displayModeBar: false });

    // 4. Scenario Forecast Paths
    const fDate = data.forecast.map(pt => pt.Date);
    const baseF = data.forecast.map(pt => pt.Forecast);
    const simF = data.forecast.map(pt => pt.Simulated);
    
    const comparisonTraces = [
        {
            x: fDate,
            y: baseF,
            name: 'Base Forecast',
            mode: 'lines',
            line: { color: isDark ? '#71717A' : '#A1A1AA', width: 2, dash: 'dash' }
        },
        {
            x: fDate,
            y: simF,
            name: 'Simulated Path',
            mode: 'lines',
            line: { color: 'var(--accent-primary)', width: 2.5 }
        }
    ];
    
    const comparisonLayout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 10, r: 10, b: 30, l: 40 },
        showlegend: false,
        xaxis: { gridcolor: gridColor, tickfont: { color: textColor } },
        yaxis: { gridcolor: gridColor, tickfont: { color: textColor } }
    };
    Plotly.newPlot('plotly-comparison-chart', comparisonTraces, comparisonLayout, { responsive: true, displayModeBar: false });
}

// ----------------------------------------------------
// Download Forecast CSV
// ----------------------------------------------------
function downloadForecastCSV() {
    if (!currentDataset) return;
    
    let csvContent = "data:text/csv;charset=utf-8,Date,Forecast,Lower,Upper,Simulated\n";
    currentDataset.forecast.forEach(r => {
        csvContent += `${r.Date},${r.Forecast.toFixed(2)},${r.Lower.toFixed(2)},${r.Upper.toFixed(2)},${r.Simulated.toFixed(2)}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `futuresight_forecast_horizon_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ----------------------------------------------------
// Architecture Diagram Handling
// ----------------------------------------------------
const nodeDetails = {
    upload: {
        title: "CSV Upload Target",
        comp: "HTML5 Drag-Drop Container",
        tech: "Streamlit UI Wrapper",
        role: "Captures user input files and routes file buffers to background data threads."
    },
    validator: {
        title: "Validation Agent",
        comp: "CSVValidator Class",
        tech: "LangGraph Pipeline Node",
        role: "Verifies date order, checks for missing data frames, and flags columns."
    },
    cleaner: {
        title: "Data Cleaner Agent",
        comp: "DataCleaner Class",
        tech: "LangGraph Pipeline Node",
        role: "Performs linear date interpolation, caps metrics on three standard outlier bounds."
    },
    timesfm: {
        title: "Google TimesFM (200M)",
        comp: "ForecastEngine Model Wrapper",
        tech: "PyTorch Deep Learner Model",
        role: "Uses pre-trained transformer blocks to execute daily forecasting metrics."
    },
    simulator: {
        title: "Scenario Simulator",
        comp: "ScenarioSimulator Engine",
        tech: "Matrix Mathematics Layer",
        role: "Applies simulated scaling ratios to predict margins under dynamic shifts."
    },
    insights: {
        title: "AI Insights Engine",
        comp: "InsightEngine Class",
        tech: "Predictive Analytics Agent",
        role: "Synthesizes statistical slopes, calculating strategic actions for inventory."
    },
    dashboard: {
        title: "Platform Dashboard",
        comp: "Reactive CSS/JS View SPA",
        tech: "Streamlit Custom Viewport",
        role: "Renders metrics in dynamic line graphs and glassmorphism metric boards."
    }
};

function initArchitectureDiagram() {
    const nodes = document.querySelectorAll(".flow-node");
    const tooltip = document.getElementById("architecture-node-tooltip");
    const container = document.getElementById("graph-svg-container");

    nodes.forEach(node => {
        const id = node.getAttribute("data-node");
        const details = nodeDetails[id];
        
        node.addEventListener("mouseenter", (e) => {
            if (!details) return;
            
            document.getElementById("tooltip-comp").textContent = details.comp;
            document.getElementById("tooltip-tech").textContent = details.tech;
            document.getElementById("tooltip-role").textContent = details.role;
            tooltip.querySelector(".tooltip-node-title").textContent = details.title;
            
            tooltip.classList.remove("hidden");
            
            // Position tooltip near target node
            const rect = node.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // Adjust coordinates relative to wrapper container
            const top = rect.top - containerRect.top + 70;
            const left = rect.left - containerRect.left + (rect.width / 2) - 120;
            
            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
        });
        
        node.addEventListener("mouseleave", () => {
            tooltip.classList.add("hidden");
        });
    });
}

// LangGraph path highlights
async function animatePipelineStart() {
    stopPipelineAnimation();
    
    const nodes = ['upload', 'validator', 'cleaner', 'timesfm', 'simulator', 'insights', 'dashboard'];
    const lines = ['path1', 'path2', 'path3', 'path4', 'path5', 'path6', 'path7'];
    
    // Clear styles
    nodes.forEach(n => document.getElementById(`node-${n}`).classList.remove("active"));
    lines.forEach(l => document.getElementById(`${l}-glow`).classList.add("hidden"));
}

async function animatePipelineComplete() {
    const steps = [
        { node: 'upload', glowLines: [] },
        { node: 'validator', glowLines: ['path1'] },
        { node: 'cleaner', glowLines: ['path2'] },
        { node: 'timesfm', glowLines: ['path3'] },
        { node: 'simulator', glowLines: ['path4'] },
        { node: 'insights', glowLines: ['path5', 'path6'] },
        { node: 'dashboard', glowLines: ['path7'] }
    ];

    for (const step of steps) {
        // Highlight active node
        document.getElementById(`node-${step.node}`).classList.add("active");
        
        // Show connecting glowing path
        step.glowLines.forEach(ln => {
            const line = document.getElementById(`${ln}-glow`);
            if (line) line.classList.remove("hidden");
        });
        
        // delay to simulate model steps
        await new Promise(resolve => setTimeout(resolve, 250));
    }
}

function stopPipelineAnimation() {
    const nodes = ['upload', 'validator', 'cleaner', 'timesfm', 'simulator', 'insights', 'dashboard'];
    const lines = ['path1', 'path2', 'path3', 'path4', 'path5', 'path6', 'path7'];
    
    nodes.forEach(n => {
        const node = document.getElementById(`node-${n}`);
        if (node) node.classList.remove("active");
    });
    lines.forEach(l => {
        const line = document.getElementById(`${l}-glow`);
        if (line) line.classList.add("hidden");
    });
}
