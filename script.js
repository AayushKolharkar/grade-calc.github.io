/**
 * Student Grade Calculator
 * Calculates the required final exam score to achieve a target grade
 */

// ============================================
// State Management
// ============================================
const state = {
    components: [],
    finalWeight: null,
    targetGrade: null,
    scenarioValue: 0, // 0-100 slider value for assumed score on blank components
    componentIdCounter: 0
};

// ============================================
// DOM Elements
// ============================================
const elements = {
    componentsContainer: document.getElementById('components-container'),
    addComponentBtn: document.getElementById('add-component'),
    finalWeightInput: document.getElementById('final-weight'),
    targetButtons: document.querySelectorAll('.target-btn'),
    customTargetInput: document.getElementById('custom-target'),
    scenarioSlider: document.getElementById('scenario-slider'),
    scenarioValueDisplay: document.getElementById('scenario-value-display'),
    quickActionBtns: document.querySelectorAll('.quick-action-btn'),
    calculateBtn: document.getElementById('calculate-btn'),
    resetBtn: document.getElementById('reset-btn'),
    ctaButton: document.getElementById('cta-button'),
    totalWeightDisplay: document.getElementById('total-weight'),
    resultsPlaceholder: document.getElementById('results-placeholder'),
    resultsContent: document.getElementById('results-content'),
    scoreNumber: document.getElementById('score-number'),
    resultsMessage: document.getElementById('results-message'),
    resultsStatus: document.getElementById('results-status'),
    currentWeighted: document.getElementById('current-weighted'),
    targetDisplay: document.getElementById('target-display'),
    finalWeightDisplay: document.getElementById('final-weight-display'),
    errorCard: document.getElementById('error-card'),
    errorMessage: document.getElementById('error-message')
};

// ============================================
// Component Management
// ============================================

/**
 * Creates a new component row HTML
 * @param {number} id - Unique identifier for the component
 * @returns {string} HTML string for the component row
 */
function createComponentRow(id) {
    return `
        <div class="component-row" data-id="${id}">
            <div class="input-group">
                <label for="component-name-${id}">Component Name</label>
                <input type="text" id="component-name-${id}" placeholder="e.g., Midterm 1" class="component-name">
            </div>
            <div class="input-group">
                <label for="component-weight-${id}">Weight</label>
                <div class="input-with-suffix">
                    <input type="number" id="component-weight-${id}" min="0" max="100" placeholder="%" class="component-weight">
                    <span class="input-suffix">%</span>
                </div>
            </div>
            <div class="input-group">
                <label for="component-score-${id}">Score</label>
                <div class="input-with-suffix">
                    <input type="number" id="component-score-${id}" min="0" max="100" placeholder="Optional" class="component-score">
                    <span class="input-suffix">%</span>
                </div>
            </div>
            <button class="remove-btn" aria-label="Remove component" onclick="removeComponent(${id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        </div>
    `;
}

/**
 * Adds a new component to the calculator
 */
function addComponent() {
    const id = state.componentIdCounter++;
    state.components.push({ id, name: '', weight: 0, score: null });

    elements.componentsContainer.insertAdjacentHTML('beforeend', createComponentRow(id));

    // Add event listeners to the new inputs
    const row = elements.componentsContainer.querySelector(`[data-id="${id}"]`);
    row.querySelector('.component-weight').addEventListener('input', updateTotalWeight);
    row.querySelector('.component-weight').addEventListener('input', () => autoCalculate());
    row.querySelector('.component-score').addEventListener('input', () => autoCalculate());

    updateTotalWeight();
}

/**
 * Removes a component from the calculator
 * @param {number} id - ID of the component to remove
 */
function removeComponent(id) {
    state.components = state.components.filter(c => c.id !== id);
    const row = elements.componentsContainer.querySelector(`[data-id="${id}"]`);

    if (row) {
        row.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            row.remove();
            updateTotalWeight();
            autoCalculate();
        }, 300);
    }
}

/**
 * Updates the total weight display
 */
function updateTotalWeight() {
    const weightInputs = elements.componentsContainer.querySelectorAll('.component-weight');
    const finalWeight = parseFloat(elements.finalWeightInput.value) || 0;

    let totalWeight = finalWeight;
    weightInputs.forEach(input => {
        totalWeight += parseFloat(input.value) || 0;
    });

    elements.totalWeightDisplay.textContent = Math.round(totalWeight * 100) / 100;

    // Update indicator color based on total
    const indicator = elements.totalWeightDisplay.parentElement;
    indicator.style.background = totalWeight === 100
        ? 'var(--success-light)'
        : totalWeight > 100
            ? 'var(--danger-light)'
            : 'var(--primary-50)';
    indicator.style.color = totalWeight === 100
        ? 'var(--success-dark)'
        : totalWeight > 100
            ? 'var(--danger-dark)'
            : 'var(--primary-600)';
}

// ============================================
// Target Grade Selection
// ============================================

/**
 * Handles target button selection
 * @param {Event} e - Click event
 */
function handleTargetSelection(e) {
    const button = e.currentTarget;
    const target = button.dataset.target;

    // Remove active class from all buttons
    elements.targetButtons.forEach(btn => btn.classList.remove('active'));

    // Add active class to clicked button
    button.classList.add('active');

    if (target === 'custom') {
        state.targetGrade = parseFloat(elements.customTargetInput.value) || null;
        elements.customTargetInput.focus();
    } else {
        state.targetGrade = parseFloat(target);
    }

    autoCalculate();
}

/**
 * Handles custom target input
 */
function handleCustomTargetInput() {
    const customBtn = document.querySelector('.custom-target-btn');
    customBtn.classList.add('active');
    elements.targetButtons.forEach(btn => {
        if (btn !== customBtn) btn.classList.remove('active');
    });

    state.targetGrade = parseFloat(elements.customTargetInput.value) || null;
    autoCalculate();
}

// ============================================
// Scenario Handling
// ============================================

/**
 * Handles slider change for scenario analysis
 * @param {Event} e - Input event from slider
 */
function handleScenarioSliderChange(e) {
    const value = parseInt(e.target.value);
    state.scenarioValue = value;
    updateScenarioDisplay(value);
    updateQuickActionButtons(value);
    autoCalculate();
}

/**
 * Handles quick action button clicks
 * @param {Event} e - Click event
 */
function handleQuickActionClick(e) {
    const value = parseInt(e.currentTarget.dataset.value);
    state.scenarioValue = value;
    elements.scenarioSlider.value = value;
    updateScenarioDisplay(value);
    updateQuickActionButtons(value);
    autoCalculate();
}

/**
 * Updates the scenario value display
 * @param {number} value - Current scenario value
 */
function updateScenarioDisplay(value) {
    elements.scenarioValueDisplay.textContent = value + '%';
}

/**
 * Updates quick action button active states
 * @param {number} value - Current scenario value
 */
function updateQuickActionButtons(value) {
    elements.quickActionBtns.forEach(btn => {
        const btnValue = parseInt(btn.dataset.value);
        if (btnValue === value) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ============================================
// Calculation Logic
// ============================================

/**
 * Collects all component data from the form
 * @returns {Array} Array of component objects
 */
function collectComponentData() {
    const rows = elements.componentsContainer.querySelectorAll('.component-row');
    const components = [];

    rows.forEach(row => {
        const name = row.querySelector('.component-name').value;
        const weight = parseFloat(row.querySelector('.component-weight').value) || 0;
        const scoreInput = row.querySelector('.component-score').value;
        const score = scoreInput !== '' ? parseFloat(scoreInput) : null;

        components.push({ name, weight, score });
    });

    return components;
}

/**
 * Validates the input data
 * @param {Array} components - Array of component data
 * @param {number} finalWeight - Final exam weight
 * @param {number} targetGrade - Target grade
 * @returns {Object} Validation result with isValid and message
 */
function validateInputs(components, finalWeight, targetGrade) {
    // Check if final weight is provided
    if (!finalWeight || finalWeight <= 0) {
        return { isValid: false, message: 'Please enter the final exam weight.' };
    }

    // Check if target grade is selected
    if (targetGrade === null || targetGrade === undefined || isNaN(targetGrade)) {
        return { isValid: false, message: 'Please select or enter a target grade.' };
    }

    // Calculate total weight
    const componentWeight = components.reduce((sum, c) => sum + c.weight, 0);
    const totalWeight = componentWeight + finalWeight;

    // STRICT VALIDATION: Total weight MUST equal exactly 100%
    // Allow small floating point tolerance (0.01%)
    if (totalWeight < 99.99) {
        return {
            isValid: false,
            message: `Total weight is ${totalWeight.toFixed(1)}%. Weights must add up to exactly 100%.`
        };
    }

    if (totalWeight > 100.01) {
        return {
            isValid: false,
            message: `Total weight is ${totalWeight.toFixed(1)}%. Weights must add up to exactly 100%.`
        };
    }

    return { isValid: true, message: '' };
}

/**
 * Calculates the required final exam score
 * @returns {Object} Calculation result
 */
function calculate() {
    const components = collectComponentData();
    const finalWeight = parseFloat(elements.finalWeightInput.value) || 0;
    const targetGrade = state.targetGrade;

    // Validate inputs
    const validation = validateInputs(components, finalWeight, targetGrade);
    if (!validation.isValid) {
        return { success: false, error: validation.message };
    }

    // Apply scenario to components without scores
    // Use the slider value (state.scenarioValue) as the assumed score
    const adjustedComponents = components.map(c => {
        if (c.score === null && c.weight > 0) {
            // Apply the scenario slider value to blank scores
            return { ...c, score: state.scenarioValue };
        }
        return c;
    });

    // Calculate current weighted score
    let currentWeightedScore = 0;
    let completedWeight = 0;

    adjustedComponents.forEach(c => {
        if (c.score !== null && c.weight > 0) {
            currentWeightedScore += (c.score * c.weight) / 100;
            completedWeight += c.weight;
        }
    });

    // Convert to percentage points
    const currentPoints = currentWeightedScore;
    const targetPoints = targetGrade;
    const finalWeightFraction = finalWeight / 100;

    // Calculate required final score
    // Formula: RequiredFinal = (TargetGrade - CurrentWeightedScore) / FinalWeight
    const requiredFinal = (targetPoints - currentPoints) / finalWeightFraction;

    return {
        success: true,
        requiredScore: requiredFinal,
        currentWeighted: currentPoints,
        targetGrade: targetGrade,
        finalWeight: finalWeight,
        completedWeight: completedWeight
    };
}

/**
 * Displays the calculation results
 * @param {Object} result - Calculation result object
 */
function displayResults(result) {
    if (!result.success) {
        showError(result.error);
        return;
    }

    hideError();

    const score = result.requiredScore;

    // Show results content
    elements.resultsPlaceholder.style.display = 'none';
    elements.resultsContent.style.display = 'block';

    // Animate the score number
    animateNumber(elements.scoreNumber, score);

    // Update breakdown
    elements.currentWeighted.textContent = result.currentWeighted.toFixed(1) + '%';
    elements.targetDisplay.textContent = result.targetGrade + '%';
    elements.finalWeightDisplay.textContent = result.finalWeight + '%';

    // Determine status
    const statusElement = elements.resultsStatus;
    statusElement.className = 'results-status';

    if (score <= 0) {
        elements.resultsMessage.textContent = "Congratulations!";
        statusElement.classList.add('secured');
        statusElement.innerHTML = '<span class="status-indicator"></span><span class="status-text">You\'ve already secured your target grade!</span>';
    } else if (score > 100) {
        elements.resultsMessage.textContent = "on your final exam";
        statusElement.classList.add('impossible');
        statusElement.innerHTML = '<span class="status-indicator"></span><span class="status-text">Not mathematically possible</span>';
    } else if (score <= 85) {
        elements.resultsMessage.textContent = "on your final exam";
        statusElement.classList.add('achievable');
        statusElement.innerHTML = '<span class="status-indicator"></span><span class="status-text">Achievable! Keep studying</span>';
    } else if (score <= 95) {
        elements.resultsMessage.textContent = "on your final exam";
        statusElement.classList.add('difficult');
        statusElement.innerHTML = '<span class="status-indicator"></span><span class="status-text">Difficult but possible</span>';
    } else {
        elements.resultsMessage.textContent = "on your final exam";
        statusElement.classList.add('unlikely');
        statusElement.innerHTML = '<span class="status-indicator"></span><span class="status-text">Very unlikely - consider alternatives</span>';
    }
}

/**
 * Animates a number from current value to target value
 * @param {HTMLElement} element - Element to animate
 * @param {number} target - Target number
 */
function animateNumber(element, target) {
    const duration = 500;
    const start = parseFloat(element.textContent) || 0;
    const startTime = performance.now();

    // Clamp display value for edge cases
    const displayTarget = target <= 0 ? 0 : Math.min(target, 999);

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (displayTarget - start) * easeOut;

        element.textContent = Math.round(current * 10) / 10;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/**
 * Shows an error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    elements.errorCard.style.display = 'flex';
    elements.errorMessage.textContent = message;

    // Reset results display
    elements.resultsPlaceholder.style.display = 'flex';
    elements.resultsContent.style.display = 'none';
}

/**
 * Hides the error message
 */
function hideError() {
    elements.errorCard.style.display = 'none';
}

/**
 * Auto-calculate when inputs change (debounced)
 */
let autoCalculateTimeout;
function autoCalculate() {
    clearTimeout(autoCalculateTimeout);
    autoCalculateTimeout = setTimeout(() => {
        // Only auto-calculate if we have enough data
        const finalWeight = parseFloat(elements.finalWeightInput.value) || 0;
        if (finalWeight > 0 && state.targetGrade !== null) {
            const result = calculate();
            displayResults(result);
        }
    }, 300);
}

// ============================================
// Reset Functionality
// ============================================

/**
 * Resets the calculator to initial state
 */
function resetCalculator() {
    // Clear components
    state.components = [];
    state.componentIdCounter = 0;
    elements.componentsContainer.innerHTML = '';

    // Clear final weight
    elements.finalWeightInput.value = '';

    // Clear target selection
    elements.targetButtons.forEach(btn => btn.classList.remove('active'));
    elements.customTargetInput.value = '';
    state.targetGrade = null;

    // Reset scenario slider
    state.scenarioValue = 0;
    elements.scenarioSlider.value = 0;
    updateScenarioDisplay(0);
    updateQuickActionButtons(0);

    // Reset results
    elements.resultsPlaceholder.style.display = 'flex';
    elements.resultsContent.style.display = 'none';
    hideError();

    // Update weight display
    updateTotalWeight();

    // Add initial components
    addComponent();
    addComponent();
}

// ============================================
// Smooth Scroll
// ============================================

/**
 * Smooth scroll to calculator section
 */
function scrollToCalculator() {
    const calculatorSection = document.getElementById('calculator-section');
    calculatorSection.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// Event Listeners
// ============================================

function initEventListeners() {
    // CTA button smooth scroll
    elements.ctaButton.addEventListener('click', scrollToCalculator);

    // Add component button
    elements.addComponentBtn.addEventListener('click', addComponent);

    // Final weight input
    elements.finalWeightInput.addEventListener('input', () => {
        updateTotalWeight();
        autoCalculate();
    });

    // Target grade buttons
    elements.targetButtons.forEach(btn => {
        btn.addEventListener('click', handleTargetSelection);
    });

    // Custom target input
    elements.customTargetInput.addEventListener('input', handleCustomTargetInput);

    // Scenario slider - real-time updates
    elements.scenarioSlider.addEventListener('input', handleScenarioSliderChange);

    // Quick action buttons
    elements.quickActionBtns.forEach(btn => {
        btn.addEventListener('click', handleQuickActionClick);
    });

    // Calculate button
    elements.calculateBtn.addEventListener('click', () => {
        const result = calculate();
        displayResults(result);
    });

    // Reset button
    elements.resetBtn.addEventListener('click', resetCalculator);
}

// ============================================
// Initialization
// ============================================

function init() {
    initEventListeners();

    // Add CSS for slide out animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); height: 0; margin: 0; padding: 0; }
        }
    `;
    document.head.appendChild(style);

    // Add initial components
    addComponent();
    addComponent();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
