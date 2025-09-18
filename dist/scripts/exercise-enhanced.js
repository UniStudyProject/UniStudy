// ===== IMPORTA IL SISTEMA OOP =====
// Assicurati di includere il file exercise-renderers-oop.js prima di questo

// ===== VARIABILI GLOBALI =====
let exerciseData;
let originalExercises;
let currentExercises;
let examMode = false;
let currentExerciseIndex = 0;
let examStartTime = null;
let examTimer = null;
let examAnswers = [];
let examScore = 0;
let examConfig = {};
let userStats = {
    totalAnswered: 0,
    correctAnswers: 0,
    completedExercises: new Set(),
    startTime: null
};

// ===== INIZIALIZZAZIONE =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - checking for saved state...');

    loadExerciseData();
    initializeEventListeners();
    setupKeyboardShortcuts();
    initializeStats();
    setupAutoSave();
});

// Salva tutte le variabili globali importanti in sessionStorage
function saveGlobalState() {
    try {
        const globalState = {
            exerciseData,
            originalExercises,
            currentExercises,
            examMode,
            currentExerciseIndex,
            examStartTime: examStartTime ? examStartTime.getTime() : null,
            examAnswers,
            examScore,
            examConfig,
            userStats: {
                ...userStats,
                completedExercises: Array.from(userStats.completedExercises),
                startTime: userStats.startTime ? userStats.startTime.getTime() : null
            },
            timestamp: new Date().getTime()
        };

        sessionStorage.setItem('globalState', JSON.stringify(globalState));
        console.log('Global state saved');
    } catch (error) {
        console.warn('Cannot save global state:', error);
    }
}

// Ripristina le variabili globali da sessionStorage
function restoreGlobalState() {
    try {
        const savedState = sessionStorage.getItem('globalState');
        if (!savedState) return false;

        const globalState = JSON.parse(savedState);

        // Controlla che i dati non siano troppo vecchi (max 24 ore)
        const now = new Date().getTime();
        const savedTime = globalState.timestamp || 0;
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            console.log('Saved state too old, clearing...');
            sessionStorage.removeItem('globalState');
            return false;
        }

        // Ripristina le variabili globali
        exerciseData = globalState.exerciseData;
        originalExercises = globalState.originalExercises || [];
        currentExercises = globalState.currentExercises || [];
        examMode = globalState.examMode || false;
        currentExerciseIndex = globalState.currentExerciseIndex || 0;
        examStartTime = globalState.examStartTime ? new Date(globalState.examStartTime) : null;
        examAnswers = globalState.examAnswers || [];
        examScore = globalState.examScore || 0;
        examConfig = globalState.examConfig || {};

        if (globalState.userStats) {
            userStats = {
                ...globalState.userStats,
                completedExercises: new Set(globalState.userStats.completedExercises || []),
                startTime: globalState.userStats.startTime ? new Date(globalState.userStats.startTime) : null
            };
        }

        console.log('Global state restored');
        return true;
    } catch (error) {
        console.warn('Cannot restore global state:', error);
        sessionStorage.removeItem('globalState');
        return false;
    }
}

function setupAutoSave() {
    // Salva stato ogni 5 secondi se ci sono stati cambiamenti
    setInterval(() => {
        if (exerciseData || examMode || userStats.completedExercises.size > 0) {
            saveGlobalState();
        }
    }, 5000);

    // Salva prima dell'unload della pagina
    window.addEventListener('beforeunload', saveGlobalState);

    // Salva quando la pagina diventa nascosta
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            saveGlobalState();
        }
    });
}

function restoreExamMode() {
    console.log('Restoring exam mode...');

    document.querySelector('.controls-section').style.display = 'none';
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('examNavigation').style.display = 'flex';

    if (examConfig.examTime > 0 && examStartTime) {
        const elapsed = Math.floor((new Date() - examStartTime) / 1000);
        const totalTime = examConfig.examTime * 60;

        if (elapsed < totalTime) {
            const remaining = totalTime - elapsed;
            startExamTimerWithRemaining(remaining);
        }
    }

    renderExercises();
    showOnlyCurrentExercise();
    updateExamProgress();
}

function startExamTimerWithRemaining(remainingSeconds) {
    const timerContainer = document.getElementById('timerContainer');
    const timeDisplay = document.getElementById('timeRemaining');

    if (!timerContainer || !timeDisplay) return;

    let totalSeconds = remainingSeconds;
    timerContainer.style.display = 'block';

    examTimer = setInterval(() => {
        totalSeconds--;

        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (totalSeconds <= 300) {
            const alertDiv = timerContainer.querySelector('.alert');
            if (alertDiv) alertDiv.className = 'alert alert-danger d-inline-block';
        } else if (totalSeconds <= 600) {
            const alertDiv = timerContainer.querySelector('.alert');
            if (alertDiv) alertDiv.className = 'alert alert-warning d-inline-block';
        }

        if (totalSeconds <= 0) {
            clearInterval(examTimer);
            finishExam(true);
        }
    }, 1000);
}

function loadExerciseData() {
    console.log('=== LOADING EXERCISE DATA ===');

    // PRIMO: Controlla se arriva un nuovo JSON
    const storedData = sessionStorage.getItem('exerciseData');
    const dataLoaded = sessionStorage.getItem('exerciseDataLoaded');

    let isNewData = false;
    let newExerciseData = null;

    if (storedData && dataLoaded === 'true') {
        try {
            const parsedData = JSON.parse(storedData);
            if (parsedData && parsedData.exercises && Array.isArray(parsedData.exercises) && parsedData.exercises.length > 0) {
                newExerciseData = parsedData;
                isNewData = true;
                console.log('New data detected in sessionStorage');
            }
        } catch (error) {
            console.warn('Error parsing new data:', error);
        }
    }

    // Se c'è nuovo JSON, pulisci tutto lo stato precedente
    if (isNewData) {
        console.log('=== CLEARING PREVIOUS STATE FOR NEW DATA ===');
        sessionStorage.removeItem('globalState'); // Pulisci stato precedente

        // Resetta tutte le variabili
        exerciseData = newExerciseData;
        originalExercises = [...newExerciseData.exercises];
        currentExercises = [...newExerciseData.exercises];
        examMode = false;
        currentExerciseIndex = 0;
        examStartTime = null;
        examAnswers = [];
        examScore = 0;
        examConfig = {};
        userStats = {
            totalAnswered: 0,
            correctAnswers: 0,
            completedExercises: new Set(),
            startTime: new Date()
        };

        console.log('=== NEW DATA LOADED ===');
        updatePageTitle();
        hideNoDataMessage();
        renderExercises();

        // Rimuovi il flag per evitare ricaricamenti
        sessionStorage.removeItem('exerciseDataLoaded');
        return;
    }

    // SECONDO: Se non c'è nuovo JSON, prova a ripristinare lo stato precedente
    const stateRestored = restoreGlobalState();

    if (stateRestored && exerciseData && currentExercises && currentExercises.length > 0) {
        console.log('=== STATE RESTORED FROM PREVIOUS SESSION ===');

        updatePageTitle();
        hideNoDataMessage();

        if (examMode) {
            restoreExamMode();
        } else {
            renderExercises();
        }
        return;
    }

    // TERZO: Se non c'è niente, mostra messaggio vuoto
    console.log('No data found');
    showNoDataMessage();
}

function updatePageTitle() {
    if (exerciseData && exerciseData.course) {
        const titleElement = document.getElementById('pageTitle');
        if (titleElement) {
            titleElement.innerHTML = `
                <i class="fas fa-graduation-cap me-3"></i>
                Esercizi - ${exerciseData.course}
            `;
        }

        document.title = `Esercizi - ${exerciseData.course}`;

        // Add course info if description exists
        if (exerciseData.description) {
            const container = document.querySelector('.container');
            const existingInfo = document.getElementById('courseInfo');

            if (!existingInfo && container) {
                const courseInfo = document.createElement('div');
                courseInfo.id = 'courseInfo';
                courseInfo.className = 'alert alert-info text-center mb-4';
                courseInfo.innerHTML = `
                    <i class="fas fa-info-circle me-2"></i>
                    ${exerciseData.description}
                `;
                container.insertBefore(courseInfo, container.children[1]);
            }
        }
    }
}

function showNoDataMessage() {
    document.getElementById('noDataMessage').style.display = 'block';
    document.getElementById('exercise-content').style.display = 'none';
    document.querySelector('.controls-section').style.display = 'none';
}

function hideNoDataMessage() {
    document.getElementById('noDataMessage').style.display = 'none';
    document.getElementById('exercise-content').style.display = 'block';
    document.querySelector('.controls-section').style.display = 'block';
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // Il sistema OOP gestirà questi eventi
    if (window.ExerciseManager) {
        window.ExerciseManager.initializeEventListeners();
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (examMode) {
            if (e.key === 'ArrowLeft' && e.ctrlKey) {
                e.preventDefault();
                previousExercise();
            }
            if (e.key === 'ArrowRight' && e.ctrlKey) {
                e.preventDefault();
                nextExercise();
            }
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                finishExam();
            }
        }

        if (e.key === 'Escape') {
            if (examMode) {
                if (confirm('Sei sicuro di voler uscire dalla modalità esame?')) {
                    exitExamMode();
                }
            }
        }
    });
}

function initializeStats() {
    userStats.startTime = new Date();
}

// ===== RENDERING ESERCIZI CON IL NUOVO SISTEMA OOP =====
function renderExercises() {
    console.log('=== RENDERING EXERCISES WITH OOP SYSTEM ===');

    const container = document.getElementById('exercise-content');
    if (!container) {
        console.error('Exercise content container not found in DOM');
        return;
    }

    if (!currentExercises || currentExercises.length === 0) {
        console.warn('No current exercises to render');
        container.innerHTML = `
            <div class="alert alert-warning text-center">
                <i class="fas fa-exclamation-triangle fa-2x mb-2 d-block"></i>
                <h4>Nessun esercizio disponibile</h4>
                <p>Controlla che il file JSON contenga esercizi validi.</p>
                <button class="btn btn-primary" onclick="debugExerciseData()">Debug Info</button>
            </div>
        `;
        return;
    }

    // USA IL SISTEMA OOP
    if (window.ExerciseManager) {
        console.log(`Initializing ExerciseManager with ${currentExercises.length} exercises`);

        // Inizializza il manager con gli esercizi
        window.ExerciseManager.init(currentExercises);

        // Imposta il callback per quando viene controllata una risposta
        window.ExerciseManager.onAnswerChecked = (exerciseId, isCorrect) => {
            updateStats(exerciseId, isCorrect);

            // Show explanation if available and enabled
            if (isCorrect || (!examMode)) {
                window.ExerciseManager.showExplanation(exerciseId);
            }
        };

        // Renderizza tutti gli esercizi
        window.ExerciseManager.renderAll('exercise-content');

        console.log('=== RENDERING COMPLETE WITH OOP ===');
        showToast('success', `${currentExercises.length} esercizi caricati con successo!`);

    } else {
        console.error('ExerciseManager not found! Make sure to include exercise-renderers-oop.js');
        showToast('error', 'Sistema di rendering non disponibile');
    }
}

// ===== SOSTITUISCI LE FUNZIONI DI CONTROLLO CON IL SISTEMA OOP =====
function checkAnswer(exerciseId, buttonElement) {
    if (window.ExerciseManager) {
        window.ExerciseManager.checkAnswer(exerciseId, buttonElement);
    } else {
        console.error('ExerciseManager not available');
    }
}

function resetExercise(exerciseId) {
    if (window.ExerciseManager) {
        window.ExerciseManager.resetExercise(exerciseId);
    } else {
        console.error('ExerciseManager not available');
    }
}

function resetAllAnswers() {
    if (confirm('Sei sicuro di voler resettare tutte le risposte?')) {
        if (window.ExerciseManager) {
            window.ExerciseManager.resetAllExercises();

            // Reset stats
            userStats.totalAnswered = 0;
            userStats.correctAnswers = 0;
            userStats.completedExercises.clear();

            showToast('info', 'Tutte le risposte sono state resettate');
        }
    }
}

function showHint(exerciseId) {
    if (window.ExerciseManager) {
        window.ExerciseManager.showHint(exerciseId);
    } else {
        console.error('ExerciseManager not available');
    }
}

function showSampleAnswer(exerciseId) {
    if (window.ExerciseManager) {
        window.ExerciseManager.showSampleAnswer(exerciseId);
    } else {
        console.error('ExerciseManager not available');
    }
}

// ===== STATS E UTILITY =====
function updateStats(exerciseId, isCorrect) {
    if (!userStats.completedExercises.has(exerciseId)) {
        userStats.totalAnswered++;
        userStats.completedExercises.add(exerciseId);
    }

    if (isCorrect) {
        userStats.correctAnswers++;
    }
    saveGlobalState();
}

function showExerciseStats() {
    const totalExercises = currentExercises.length;
    const completedPercentage = totalExercises > 0 ? (userStats.completedExercises.size / totalExercises * 100).toFixed(1) : 0;
    const accuracyPercentage = userStats.totalAnswered > 0 ? (userStats.correctAnswers / userStats.totalAnswered * 100).toFixed(1) : 0;

    const statsContent = `
        <div class="row text-center">
            <div class="col-md-3">
                <div class="card border-primary">
                    <div class="card-body">
                        <h3 class="text-primary">${totalExercises}</h3>
                        <p class="card-text">Esercizi Totali</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-info">
                    <div class="card-body">
                        <h3 class="text-info">${userStats.completedExercises.size}</h3>
                        <p class="card-text">Completati</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-success">
                    <div class="card-body">
                        <h3 class="text-success">${completedPercentage}%</h3>
                        <p class="card-text">Progresso</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-warning">
                    <div class="card-body">
                        <h3 class="text-warning">${accuracyPercentage}%</h3>
                        <p class="card-text">Precisione</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-4">
            <h5>Dettagli per difficoltà:</h5>
            ${generateDifficultyStats()}
        </div>
    `;

    const modal = createInfoModal('Statistiche Esercizi', statsContent);
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();

    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function generateDifficultyStats() {
    const difficulties = ['facile', 'medio', 'difficile'];
    let html = '<div class="row">';

    difficulties.forEach(diff => {
        const exercisesOfDifficulty = currentExercises.filter(ex => ex.difficulty === diff);
        const count = exercisesOfDifficulty.length;
        const color = getDifficultyColor(diff);

        if (count > 0) {
            html += `
                <div class="col-md-4">
                    <div class="text-center">
                        <span class="badge bg-${color} fs-6 py-2 px-3">${diff}</span>
                        <p class="mt-2 mb-0">${count} esercizi</p>
                    </div>
                </div>
            `;
        }
    });

    html += '</div>';
    return html;
}

function getDifficultyColor(difficulty) {
    switch (difficulty) {
        case 'facile': return 'success';
        case 'medio': return 'warning';
        case 'difficile': return 'danger';
        default: return 'secondary';
    }
}

// ===== MODAL UTILITIES =====
function createInfoModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                </div>
            </div>
        </div>
    `;
    return modal;
}

function showToast(type, message) {
    if (window.ExerciseManager && window.ExerciseManager.showToast) {
        window.ExerciseManager.showToast(type, message);
    } else {
        // Fallback toast implementation
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 500;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#06b6d4'
        };

        toast.style.backgroundColor = colors[type] || colors.info;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    }
}

// ===== UTILITY FUNCTIONS =====
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ===== EXAM MODE =====
function openExamModal() {
    if (!currentExercises || currentExercises.length === 0) {
        showToast('error', 'Nessun esercizio caricato per la modalità esame');
        return;
    }

    populateExamModal();
    const examModal = new bootstrap.Modal(document.getElementById('examModal'));
    examModal.show();
}

function populateExamModal() {
    // Update max available exercises
    document.getElementById('maxAvailable').textContent = currentExercises.length;
    document.getElementById('numQuestions').max = currentExercises.length;

    // Generate exercise type checkboxes dynamically
    const typesContainer = document.getElementById('exerciseTypesContainer');
    const availableTypes = [...new Set(currentExercises.map(ex => ex.type))];

    const typeLabels = {
        'multiple_choice_single': 'Scelta Multipla Singola',
        'multiple_choice_multiple': 'Scelta Multipla',
        'true_false': 'Vero/Falso',
        'open_text': 'Testo Aperto',
        'open_ended': 'Testo Aperto',
        'fill_in_blank': 'Completa gli Spazi',
        'matching': 'Abbinamento',
        'ordering': 'Ordinamento',
        'code_completion': 'Completamento Codice',
        'drag_and_drop': 'Trascinamento'
    };

    typesContainer.innerHTML = '';
    availableTypes.forEach(type => {
        const count = currentExercises.filter(ex => ex.type === type).length;
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-2';
        col.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="type_${type}" checked>
                <label class="form-check-label" for="type_${type}">
                    ${typeLabels[type] || type} <span class="text-muted">(${count})</span>
                </label>
            </div>
        `;
        typesContainer.appendChild(col);
    });
}

function startCustomExam() {
    const numQuestions = parseInt(document.getElementById('numQuestions').value);
    const examTime = parseInt(document.getElementById('examTime').value);
    const difficulty = document.getElementById('difficulty').value;
    const randomizeQuestions = document.getElementById('randomizeQuestions').checked;
    const showExplanations = document.getElementById('showExplanations').checked;

    // Get selected exercise types
    const selectedTypes = [];
    document.querySelectorAll('#exerciseTypesContainer input[type="checkbox"]:checked').forEach(checkbox => {
        selectedTypes.push(checkbox.id.replace('type_', ''));
    });

    if (selectedTypes.length === 0) {
        showToast('error', 'Seleziona almeno un tipo di esercizio!');
        return;
    }

    // Filter exercises
    let filteredExercises = currentExercises.filter(exercise => {
        const typeMatch = selectedTypes.includes(exercise.type);
        let difficultyMatch = true;

        if (difficulty !== 'all') {
            if (difficulty === 'mixed') {
                difficultyMatch = true;
            } else {
                difficultyMatch = exercise.difficulty === difficulty;
            }
        }

        return typeMatch && difficultyMatch;
    });

    if (filteredExercises.length === 0) {
        showToast('error', 'Nessun esercizio trovato con i criteri selezionati!');
        return;
    }

    if (filteredExercises.length < numQuestions) {
        const proceed = confirm(
            `Sono disponibili solo ${filteredExercises.length} esercizi con i criteri selezionati. ` +
            `Vuoi procedere con tutti gli esercizi disponibili?`
        );
        if (!proceed) return;
    }

    // Prepare exam
    examConfig = {
        numQuestions,
        examTime,
        difficulty,
        selectedTypes,
        randomizeQuestions,
        showExplanations
    };

    // Select and randomize exercises
    if (randomizeQuestions) {
        filteredExercises = shuffleArray(filteredExercises);
    }

    const examExercises = filteredExercises.slice(0, Math.min(numQuestions, filteredExercises.length));

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('examModal')).hide();

    // Start exam
    startExamMode(examExercises);
}

function startExamMode(exercises) {
    examMode = true;
    examStartTime = new Date();
    currentExerciseIndex = 0;
    examAnswers = [];
    examScore = 0;
    currentExercises = exercises.map((ex, index) => ({ ...ex, id: index + 1 }));

    // Render exam exercises
    renderExercises();

    // Setup exam UI
    document.querySelector('.controls-section').style.display = 'none';
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('examNavigation').style.display = 'flex';

    if (examConfig.examTime > 0) {
        startExamTimer(examConfig.examTime);
    }

    showOnlyCurrentExercise();
    updateExamProgress();

    showToast('info', 'Modalità esame avviata!');
    saveGlobalState();
}

function startExamTimer(minutes) {
    const timerContainer = document.getElementById('timerContainer');
    const timeDisplay = document.getElementById('timeRemaining');

    if (!timerContainer || !timeDisplay) return;

    let totalSeconds = minutes * 60;
    timerContainer.style.display = 'block';

    examTimer = setInterval(() => {
        totalSeconds--;

        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // Change color when time is running out
        if (totalSeconds <= 300) { // 5 minutes
            const alertDiv = timerContainer.querySelector('.alert');
            if (alertDiv) alertDiv.className = 'alert alert-danger d-inline-block';
        } else if (totalSeconds <= 600) { // 10 minutes
            const alertDiv = timerContainer.querySelector('.alert');
            if (alertDiv) alertDiv.className = 'alert alert-warning d-inline-block';
        }

        if (totalSeconds <= 0) {
            clearInterval(examTimer);
            finishExam(true);
        }
    }, 1000);
}

function showOnlyCurrentExercise() {
    const exercises = document.querySelectorAll('.exercise-card');
    exercises.forEach((ex, index) => {
        ex.style.display = index === currentExerciseIndex ? 'block' : 'none';
    });
}

function nextExercise() {
    if (currentExerciseIndex < currentExercises.length - 1) {
        currentExerciseIndex++;
        showOnlyCurrentExercise();
        updateExamProgress();
    }

    if (currentExerciseIndex === currentExercises.length - 1) {
        document.getElementById('finishExam').style.display = 'block';
    }
    saveGlobalState();
}

function previousExercise() {
    if (currentExerciseIndex > 0) {
        currentExerciseIndex--;
        showOnlyCurrentExercise();
        updateExamProgress();

        document.getElementById('finishExam').style.display = 'none';
    }
    saveGlobalState();
}

function updateExamProgress() {
    const progress = ((currentExerciseIndex + 1) / currentExercises.length) * 100;

    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
    }

    // Update counters
    document.getElementById('currentQuestion').textContent = currentExerciseIndex + 1;
    document.getElementById('totalQuestions').textContent = currentExercises.length;
    document.getElementById('currentQuestionNav').textContent = currentExerciseIndex + 1;
    document.getElementById('totalQuestionsNav').textContent = currentExercises.length;

    // Update navigation buttons
    const prevBtn = document.querySelector('[onclick="previousExercise()"]');
    const nextBtn = document.querySelector('[onclick="nextExercise()"]');

    if (prevBtn) prevBtn.disabled = currentExerciseIndex === 0;
    if (nextBtn) {
        if (currentExerciseIndex === currentExercises.length - 1) {
            nextBtn.style.display = 'none';
            document.getElementById('finishExam').style.display = 'block';
        } else {
            nextBtn.style.display = 'inline-block';
            document.getElementById('finishExam').style.display = 'none';
        }
    }
}

function finishExam(timeExpired = false) {
    if (!timeExpired) {
        const proceed = confirm('Sei sicuro di voler terminare l\'esame?');
        if (!proceed) return;
    }

    examMode = false;

    if (examTimer) {
        clearInterval(examTimer);
        examTimer = null;
    }

    const results = calculateExamResults();
    showExamResults(results, timeExpired);
    exitExamMode();
}

function calculateExamResults() {
    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let totalQuestions = currentExercises.length;
    const detailedResults = [];

    currentExercises.forEach((exercise, index) => {
        // Usa il sistema OOP per valutare
        let result = { isCorrect: false, feedback: '' };

        if (window.ExerciseManager) {
            const renderer = window.ExerciseManager.getRenderer(exercise.id);
            if (renderer) {
                result = renderer.evaluate();
            }
        }

        const points = result.isCorrect ? exercise.points : 0;

        totalScore += points;
        maxScore += exercise.points;

        if (result.isCorrect) {
            correctCount++;
        }

        detailedResults.push({
            exercise,
            correct: result.isCorrect,
            points,
            feedback: result.feedback
        });
    });

    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const examDuration = examStartTime ? Math.round((new Date() - examStartTime) / 1000 / 60) : 0;

    return {
        totalScore,
        maxScore,
        correctCount,
        totalQuestions,
        percentage: percentage.toFixed(1),
        examDuration,
        detailedResults
    };
}

function showExamResults(results, timeExpired = false) {
    const modal = document.getElementById('resultsModal');
    const content = document.getElementById('resultsContent');

    if (!modal || !content) return;

    const gradeInfo = getGradeInfo(results.percentage);

    content.innerHTML = `
        <div class="text-center mb-4">
            <div class="display-1 text-${gradeInfo.class} mb-3">
                <i class="fas ${gradeInfo.icon}"></i>
            </div>
            <h2 class="text-${gradeInfo.class}">${gradeInfo.text}</h2>
            ${timeExpired ? '<div class="alert alert-warning mt-3"><i class="fas fa-clock me-2"></i>Tempo scaduto!</div>' : ''}
        </div>
        
        <div class="row text-center mb-4">
            <div class="col-md-3 mb-3">
                <div class="card border-${gradeInfo.class}">
                    <div class="card-body">
                        <h3 class="text-${gradeInfo.class}">${results.percentage}%</h3>
                        <p class="card-text">Percentuale</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card border-info">
                    <div class="card-body">
                        <h3 class="text-info">${results.correctCount}/${results.totalQuestions}</h3>
                        <p class="card-text">Risposte Corrette</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card border-primary">
                    <div class="card-body">
                        <h3 class="text-primary">${results.totalScore}/${results.maxScore}</h3>
                        <p class="card-text">Punteggio</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card border-secondary">
                    <div class="card-body">
                        <h3 class="text-secondary">${results.examDuration}</h3>
                        <p class="card-text">Minuti</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="detailed-results">
            <h5 class="mb-3">
                <i class="fas fa-list-alt me-2"></i>
                Risultati Dettagliati
            </h5>
            <div class="results-list" style="max-height: 300px; overflow-y: auto;">
                ${generateDetailedResults(results.detailedResults)}
            </div>
        </div>
    `;

    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

function getGradeInfo(percentage) {
    if (percentage >= 90) return { class: 'success', icon: 'fa-trophy', text: 'Eccellente!' };
    if (percentage >= 80) return { class: 'success', icon: 'fa-star', text: 'Ottimo!' };
    if (percentage >= 70) return { class: 'warning', icon: 'fa-medal', text: 'Buono' };
    if (percentage >= 60) return { class: 'warning', icon: 'fa-thumbs-up', text: 'Sufficiente' };
    return { class: 'danger', icon: 'fa-times-circle', text: 'Da migliorare' };
}

function generateDetailedResults(results) {
    return results.map((result, index) => {
        const iconClass = result.correct ? 'fa-check-circle text-success' : 'fa-times-circle text-danger';
        const bgClass = result.correct ? 'bg-success-subtle' : 'bg-danger-subtle';

        return `
            <div class="card mb-2 ${bgClass}">
                <div class="card-body py-2">
                    <div class="d-flex align-items-center">
                        <i class="fas ${iconClass} me-3"></i>
                        <div class="flex-grow-1">
                            <strong>Esercizio ${index + 1}:</strong>
                            <span class="text-muted">${result.exercise.question.substring(0, 50)}...</span>
                        </div>
                        <div class="text-end">
                            <span class="badge ${result.correct ? 'bg-success' : 'bg-danger'}">
                                ${result.points}/${result.exercise.points} pt
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function retakeExam() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('resultsModal'));
    if (modal) modal.hide();

    setTimeout(() => {
        resetAllAnswers();
        openExamModal();
    }, 300);
}

function downloadResults() {
    const results = calculateExamResults();
    const reportData = {
        timestamp: new Date().toISOString(),
        course: exerciseData?.course || 'Esercizi',
        examConfig,
        results: {
            totalScore: results.totalScore,
            maxScore: results.maxScore,
            percentage: results.percentage,
            correctCount: results.correctCount,
            totalQuestions: results.totalQuestions,
            duration: results.examDuration
        },
        detailedResults: results.detailedResults.map(r => ({
            question: r.exercise.question,
            type: r.exercise.type,
            difficulty: r.exercise.difficulty,
            points: r.exercise.points,
            correct: r.correct,
            earnedPoints: r.points
        }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risultati_esame_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('success', 'Risultati scaricati con successo!');
}

function exitExamMode() {
    examMode = false;

    // Reset UI
    document.querySelector('.controls-section').style.display = 'block';
    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('timerContainer').style.display = 'none';
    document.getElementById('examNavigation').style.display = 'none';
    document.getElementById('finishExam').style.display = 'none';

    // Show all exercises
    document.querySelectorAll('.exercise-card').forEach(ex => {
        ex.style.display = 'block';
    });

    // Reload original exercises if needed
    if (exerciseData && exerciseData.exercises) {
        currentExercises = [...exerciseData.exercises];
        renderExercises();
    }
    saveGlobalState();
}

// ===== NAVIGATION =====
function goBack() {
    const hasProgress = userStats.completedExercises.size > 0;

    let message = 'Sei sicuro di voler tornare alla homepage?';
    if (examMode) {
        message = 'Sei in modalità esame. Vuoi davvero tornare alla homepage? Perderai tutti i progressi.';
    } else if (hasProgress) {
        message = 'Hai risposto ad alcuni esercizi. Vuoi davvero tornare alla homepage?';
    }

    if (examMode || hasProgress) {
        const proceed = confirm(message);
        if (!proceed) return;
    }

    // Clean up
    if (examMode) {
        exitExamMode();
    }

    // Clear session data
    try {
        sessionStorage.removeItem('exerciseDataLoaded');
        sessionStorage.removeItem('userProgress');
    } catch (e) {
        console.warn('Cannot clear session data:', e);
    }

    window.location.href = 'index.html';
}

// ===== DEBUG E UTILITY =====
function debugExerciseData() {
    console.log('=== DEBUG INFO ===');
    console.log('exerciseData:', exerciseData);
    console.log('currentExercises:', currentExercises);
    console.log('originalExercises:', originalExercises);
    console.log('examMode:', examMode);
    console.log('userStats:', userStats);

    if (window.ExerciseManager) {
        console.log('ExerciseManager available:', true);
        console.log('Renderers count:', window.ExerciseManager.getAllRenderers().size);
    } else {
        console.log('ExerciseManager available:', false);
    }

    if (exerciseData) {
        console.log('Course:', exerciseData.course);
        console.log('Total exercises:', exerciseData.exercises?.length);
        console.log('Exercise types:', [...new Set(exerciseData.exercises?.map(ex => ex.type))]);
    }
}

// Make debug function available globally
window.debugExerciseData = debugExerciseData;

// ===== ERROR HANDLING GLOBALE =====
window.addEventListener('error', function(e) {
    console.error('Global JavaScript error:', e.error);
    showToast('error', 'Si è verificato un errore. Controlla la console per dettagli.');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showToast('error', 'Errore di elaborazione. Riprova.');
});

// ===== ADVANCED FEATURES =====
function initializeAdvancedFeatures() {
    console.log('Initializing advanced features...');

    // Auto-save progress every 30 seconds
    setInterval(() => {
        if (userStats.completedExercises.size > 0) {
            try {
                sessionStorage.setItem('userProgress', JSON.stringify({
                    stats: {
                        ...userStats,
                        completedExercises: Array.from(userStats.completedExercises)
                    },
                    timestamp: new Date().toISOString()
                }));
            } catch (e) {
                console.warn('Cannot save progress:', e);
            }
        }
    }, 30000);

    // Load previous progress
    try {
        const savedProgress = sessionStorage.getItem('userProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            if (progress.stats) {
                userStats = {
                    ...userStats,
                    ...progress.stats,
                    completedExercises: new Set(progress.stats.completedExercises || [])
                };
                console.log('Loaded previous progress');
            }
        }
    } catch (e) {
        console.warn('Cannot load progress:', e);
    }

    // Setup advanced keyboard shortcuts
    setupAdvancedKeyboardShortcuts();
}

function setupAdvancedKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Numbers 1-9 to select multiple choice options in exam mode
        if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.altKey && examMode) {
            const currentCard = document.querySelector('.exercise-card[style*="block"]') ||
                document.querySelectorAll('.exercise-card')[currentExerciseIndex];

            if (currentCard) {
                const optionIndex = parseInt(e.key) - 1;
                const radioInputs = currentCard.querySelectorAll('input[type="radio"]');

                if (radioInputs[optionIndex]) {
                    radioInputs[optionIndex].checked = true;
                    e.preventDefault();
                }
            }
        }

        // Space to check answer
        if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            const currentCard = document.querySelector('.exercise-card[style*="block"]') ||
                document.querySelectorAll('.exercise-card')[currentExerciseIndex];

            if (currentCard) {
                const checkButton = currentCard.querySelector('.check-answer:not(:disabled)');
                if (checkButton) {
                    checkButton.click();
                }
            }
        }
    });
}

// ===== IMPROVED INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - checking if data already loaded...');

    // Check if data is ALREADY loaded (avoid double initialization)
    if (exerciseData && currentExercises && currentExercises.length > 0) {
        console.log('Data already loaded, skipping re-initialization');
        initializeEventListeners();
        setupKeyboardShortcuts();
        initializeStats();
        initializeAdvancedFeatures();
        return;
    }

    console.log('No data loaded yet, starting initialization...');

    // Add loading indicator only if no data
    const content = document.getElementById('exercise-content');
    if (content && !exerciseData) {
        content.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
                <p class="mt-3 text-muted">Caricamento in corso...</p>
            </div>
        `;
    }

    // Only load data if not already loaded
    setTimeout(() => {
        if (!exerciseData) {
            loadExerciseData();
        }
        initializeEventListeners();
        setupKeyboardShortcuts();
        initializeStats();
        initializeAdvancedFeatures();
    }, 300);
});

// ===== EXPORT FUNCTIONS (COMPLETE LIST) =====
// Esporta le funzioni per compatibilità con il sistema esistente
window.goBack = goBack;
window.checkAnswer = checkAnswer;
window.showHint = showHint;
window.resetExercise = resetExercise;
window.resetAllAnswers = resetAllAnswers;
window.showExerciseStats = showExerciseStats;
window.openExamModal = openExamModal;
window.startCustomExam = startCustomExam;
window.nextExercise = nextExercise;
window.previousExercise = previousExercise;
window.finishExam = finishExam;
window.retakeExam = retakeExam;
window.downloadResults = downloadResults;
window.showSampleAnswer = showSampleAnswer;
window.debugExerciseData = debugExerciseData;

// Assicurati che ExerciseManager usi le funzioni corrette
if (window.ExerciseManager) {
    // Le funzioni sono già esposte globalmente, quindi funzioneranno con onclick
    console.log('ExerciseManager integration ready');
}