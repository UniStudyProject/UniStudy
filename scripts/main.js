// ===== VARIABILI GLOBALI =====
let uploadedExerciseData = null;
let currentModal = null;

// ===== INIZIALIZZAZIONE =====
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    setupDragAndDrop();
    checkForStoredData();
    addAnimations();
});

// ===== SETUP EVENT LISTENERS CON EVENT DELEGATION =====
function initializeEventListeners() {
    // Event delegation per il file input - risolve il problema del doppio clic
    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'jsonFileInput') {
            handleFileSelect(e);
        }
    });

    // Event delegation per tutti i click
    document.addEventListener('click', function(e) {
        // Handle dropZone click (ma non se si clicca sul file input)
        if (e.target.closest('#dropZone') && !e.target.closest('input[type="file"]') && !e.target.closest('button')) {
            const fileInput = document.getElementById('jsonFileInput');
            if (fileInput) {
                fileInput.click();
            }
        }


    });

    // Modal events
    const uploadModal = document.getElementById('uploadModal');
    if (uploadModal) {
        uploadModal.addEventListener('hidden.bs.modal', resetUploadModal);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ===== NAVIGAZIONE =====
function goToBuilder() {
    window.location.href = '/crea';
}

function openUploadModal() {
    const modal = new bootstrap.Modal(document.getElementById('uploadModal'));
    currentModal = modal;
    modal.show();
}

// ===== GESTIONE FILE =====
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleFileDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleFileDrop(e) {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    console.log('File input changed:', e.target.files.length); // Debug log
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function processFile(file) {
    console.log('Processing file:', file.name); // Debug log

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
        showError('Per favore seleziona un file JSON valido.');
        return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('Il file è troppo grande. Dimensione massima: 10MB.');
        return;
    }

    // Reset previous state
    uploadedExerciseData = null;
    document.getElementById('startExercises').disabled = true;
    hideError();
    hideFileInfo();

    showLoadingInModal();

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let jsonText = e.target.result;

            // Fix common JSON issues
            jsonText = jsonText.trim();

            // Remove trailing commas before closing brackets/braces
            jsonText = jsonText.replace(/,(\s*[\]\}])/g, '$1');

            // Parse JSON
            const jsonData = JSON.parse(jsonText);
            validateAndProcessJSON(jsonData, file.name);
        } catch (error) {
            console.error('JSON Parse Error:', error);
            showError('File JSON non valido. Controlla la sintassi: ' + error.message);
            hideLoadingInModal();
        }
    };

    reader.onerror = function() {
        showError('Errore nella lettura del file.');
        hideLoadingInModal();
    };

    reader.readAsText(file, 'UTF-8');
}

function validateAndProcessJSON(data, fileName) {
    try {
        // Validate JSON structure
        if (!data || typeof data !== 'object') {
            throw new Error('Struttura JSON non valida - deve essere un oggetto');
        }

        if (!data.exercises) {
            throw new Error('Proprietà "exercises" mancante nel JSON');
        }

        if (!Array.isArray(data.exercises)) {
            throw new Error('La proprietà "exercises" deve essere un array');
        }

        if (data.exercises.length === 0) {
            throw new Error('Nessun esercizio trovato nel file');
        }

        console.log(`Validating ${data.exercises.length} exercises...`);

        // Validate and clean exercises
        const validatedExercises = validateExercises(data.exercises);

        if (validatedExercises.length === 0) {
            throw new Error('Nessun esercizio valido trovato nel file');
        }

        // Store validated data
        uploadedExerciseData = {
            course: data.course || 'Corso Senza Nome',
            description: data.description || `Esercizi con ${validatedExercises.length} domande`,
            exercises: validatedExercises,
            metadata: {
                fileName: fileName,
                uploadedAt: new Date().toISOString(),
                totalExercises: validatedExercises.length,
                version: data.version || '1.0',
                originalCount: data.exercises.length,
                validCount: validatedExercises.length
            }
        };

        // Show success info
        showFileInfo(fileName, validatedExercises.length, data.exercises.length);
        hideLoadingInModal();

        // Enable start button
        document.getElementById('startExercises').disabled = false;

        // Store in sessionStorage for persistence
        try {
            sessionStorage.setItem('exerciseData', JSON.stringify(uploadedExerciseData));
            sessionStorage.setItem('exerciseDataLoaded', 'true');
        } catch (e) {
            console.warn('Cannot store in sessionStorage:', e);
        }

        showSuccess(`File caricato con successo! ${validatedExercises.length} esercizi pronti.`);

    } catch (error) {
        console.error('Validation Error:', error);
        showError('Errore nella validazione del file: ' + error.message);
        hideLoadingInModal();
        uploadedExerciseData = null;
        document.getElementById('startExercises').disabled = true;
    }
}

function validateExercises(exercises) {
    const validatedExercises = [];
    const errors = [];

    exercises.forEach((exercise, index) => {
        try {
            const validated = validateSingleExercise(exercise, index);
            validatedExercises.push(validated);
        } catch (error) {
            errors.push(`Esercizio ${index + 1}: ${error.message}`);
        }
    });

    if (errors.length > 0) {
        console.warn('Errori di validazione:', errors);
        // Mostra warning ma continua se ci sono esercizi validi
        if (validatedExercises.length === 0) {
            throw new Error('Nessun esercizio valido trovato:\n' + errors.slice(0, 5).join('\n'));
        }
    }

    return validatedExercises;
}

function validateSingleExercise(exercise, index) {
    if (!exercise.type) {
        throw new Error('Tipo esercizio mancante');
    }

    if (!exercise.question || exercise.question.trim() === '') {
        throw new Error('Domanda mancante');
    }

    // Set default values
    const validated = {
        id: exercise.id || index + 1,
        type: exercise.type,
        question: exercise.question.trim(),
        points: exercise.points || 1,
        difficulty: exercise.difficulty || 'medio',
        ...exercise
    };

    // Type-specific validation
    switch (exercise.type) {
        case 'multiple_choice_single':
            if (!exercise.options || !Array.isArray(exercise.options) || exercise.options.length < 2) {
                throw new Error('Opzioni insufficienti (minimo 2)');
            }
            if (typeof exercise.correct_answer !== 'number') {
                throw new Error('Risposta corretta non specificata');
            }
            break;

        case 'multiple_choice_multiple':
            if (!exercise.options || !Array.isArray(exercise.options) || exercise.options.length < 2) {
                throw new Error('Opzioni insufficienti (minimo 2)');
            }
            if (!exercise.correct_answers || !Array.isArray(exercise.correct_answers)) {
                throw new Error('Risposte corrette non specificate');
            }
            break;

        case 'true_false':
            if (typeof exercise.correct_answer !== 'boolean') {
                throw new Error('Risposta corretta deve essere true o false');
            }
            break;

        case 'fill_in_blank':
            if (!exercise.blanks || !Array.isArray(exercise.blanks)) {
                throw new Error('Configurazione blanks mancante');
            }
            break;

        // Add more type validations as needed
    }

    return validated;
}

// ===== UI FEEDBACK =====
function showFileInfo(fileName, exerciseCount) {
    const fileInfo = document.getElementById('fileInfo');
    const fileNameSpan = document.getElementById('fileName');
    const exerciseCountSpan = document.getElementById('exerciseCount');

    if (fileInfo && fileNameSpan && exerciseCountSpan) {
        fileNameSpan.textContent = fileName;
        exerciseCountSpan.textContent = exerciseCount;
        fileInfo.classList.remove('d-none');
    }

    hideError();
}

function showError(message) {
    const errorDiv = document.getElementById('uploadError');
    const errorMessage = document.getElementById('errorMessage');

    if (errorDiv && errorMessage) {
        errorMessage.textContent = message;
        errorDiv.classList.remove('d-none');
    }

    hideFileInfo();
    console.error('Upload error:', message);
}

function hideError() {
    const errorDiv = document.getElementById('uploadError');
    if (errorDiv) {
        errorDiv.classList.add('d-none');
    }
}

function hideFileInfo() {
    const fileInfo = document.getElementById('fileInfo');
    if (fileInfo) {
        fileInfo.classList.add('d-none');
    }
}

function showSuccess(message) {
    // Create toast notification
    const toast = createToast('success', message);
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function createToast(type, message) {
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

    return toast;
}

// ===== LOADING STATES (VERSIONE MIGLIORATA) =====
function showLoadingInModal() {
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        // Invece di sovrascrivere l'HTML, aggiungi una overlay di loading
        let loadingOverlay = dropZone.querySelector('.loading-overlay');

        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: inherit;
                z-index: 10;
            `;
            dropZone.style.position = 'relative';
            dropZone.appendChild(loadingOverlay);
        }

        loadingOverlay.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status"></div>
                <h4>Caricamento in corso...</h4>
                <p class="text-muted">Validazione del file JSON</p>
            </div>
        `;
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoadingInModal() {
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        const loadingOverlay = dropZone.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
    // Non serve rifare il setup degli event listener perché non abbiamo ricreato l'HTML!
}

// ===== FUNZIONE selectFile MIGLIORATA =====
function selectFile() {
    const fileInput = document.getElementById('jsonFileInput');
    if (fileInput) {
        console.log('SelectFile called'); // Debug log
        // Reset del valore per permettere la selezione dello stesso file
        fileInput.value = '';
        fileInput.click();
    }
}

// ===== DRAG AND DROP SEMPLIFICATO =====
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;

    // Prevent default drag behaviors su tutto il documento
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Setup specifico per dropZone con event delegation
    document.addEventListener('dragenter', function(e) {
        if (e.target.closest('#dropZone')) {
            e.target.closest('#dropZone').classList.add('dragover');
        }
    });

    document.addEventListener('dragover', function(e) {
        if (e.target.closest('#dropZone')) {
            e.preventDefault();
        }
    });

    document.addEventListener('dragleave', function(e) {
        const dropZone = e.target.closest('#dropZone');
        if (dropZone && !dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('dragover');
        }
    });

    document.addEventListener('drop', function(e) {
        const dropZone = e.target.closest('#dropZone');
        if (dropZone) {
            e.preventDefault();
            dropZone.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                processFile(files[0]);
            }
        }
    });
}



function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('d-none');
    }
}

// ===== AVVIO ESERCIZI =====
function startExercisesFromJSON() {
    console.log('Starting exercises from JSON...');

    if (!uploadedExerciseData) {
        console.error('No uploaded exercise data found');
        showError('Nessun dato caricato. Ricarica il file JSON.');
        return;
    }

    console.log('Exercise data found:', uploadedExerciseData);

    

    try {
        // Store data for exercise page with a flag
        sessionStorage.setItem('exerciseData', JSON.stringify(uploadedExerciseData));
        sessionStorage.setItem('exerciseDataLoaded', 'true');
        sessionStorage.setItem('exerciseLoadTimestamp', Date.now().toString());

        console.log('Data stored in sessionStorage');

        // Close modal
        const uploadModal = document.getElementById('uploadModal');
        if (uploadModal) {
            const modalInstance = bootstrap.Modal.getInstance(uploadModal);
            if (modalInstance) {
                modalInstance.hide();
            }
        }

        // Navigate to exercise page after short delay
        setTimeout(() => {
            console.log('Navigating to exercise page...');
            window.location.href = './exercise';
        }, 800);

    } catch (error) {
        console.error('Error starting exercises:', error);
        hideLoadingOverlay();
        showError('Errore nel caricamento degli esercizi: ' + error.message);
    }
}

// ===== TEST FUNCTION =====
function testWithSampleData() {
    console.log('Testing with sample data...');

    const sampleData = {
        "course": "Test Course",
        "description": "Test exercises for debugging",
        "exercises": [
            {
                "id": 1,
                "type": "multiple_choice_single",
                "question": "What is 2 + 2?",
                "options": ["3", "4", "5", "6"],
                "correct_answer": 1,
                "explanation": "2 + 2 equals 4",
                "points": 1,
                "difficulty": "facile"
            },
            {
                "id": 2,
                "type": "true_false",
                "question": "The sky is blue.",
                "correct_answer": true,
                "explanation": "Yes, the sky appears blue during a clear day",
                "points": 1,
                "difficulty": "facile"
            }
        ]
    };

    try {
        validateAndProcessJSON(sampleData, 'test_sample.json');
        console.log('Sample data validation successful');
    } catch (error) {
        console.error('Sample data validation failed:', error);
        showError('Test fallito: ' + error.message);
    }
}

// ===== UTILITY FUNCTIONS =====
function resetUploadModal() {
    hideError();
    hideFileInfo();
    hideLoadingInModal();
    document.getElementById('startExercises').disabled = true;

    const fileInput = document.getElementById('jsonFileInput');
    if (fileInput) {
        fileInput.value = '';
    }
}

function checkForStoredData() {
    try {
        const storedData = sessionStorage.getItem('exerciseData');
        if (storedData) {
            const data = JSON.parse(storedData);
            if (data && data.exercises) {
                uploadedExerciseData = data;
                // Optionally show a notification that previous data exists
                showSuccess('Dati precedenti trovati e ripristinati');
            }
        }
    } catch (e) {
        console.warn('Cannot read from sessionStorage:', e);
    }
}

// Da togliere in futuro
function handleKeyboardShortcuts(e) {
    // ESC to close modals
    if (e.key === 'Escape') {
        if (currentModal) {
            currentModal.hide();
        }
    }

    // Ctrl/Cmd + O to open upload modal
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        openUploadModal();
    }

    // Ctrl/Cmd + N to go to builder
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        goToBuilder();
    }
}

function addAnimations() {
    // Add entrance animations to cards
    const cards = document.querySelectorAll('.choice-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';

        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + index * 100);
    });

    // Add entrance animations to features
    const features = document.querySelectorAll('.feature-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    });

    features.forEach(feature => {
        feature.style.opacity = '0';
        feature.style.transform = 'translateY(20px)';
        feature.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(feature);
    });
}

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showError('Si è verificato un errore imprevisto');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showError('Errore di rete o di elaborazione');
});

// ===== EXPORT FUNCTIONS =====
window.goToBuilder = goToBuilder;
window.openUploadModal = openUploadModal;
window.startExercisesFromJSON = startExercisesFromJSON;
window.selectFile = selectFile;
window.testWithSampleData = testWithSampleData;