// Dati globali
let exercises = [];
let currentImageBase64 = null;
let currentImageInfo = null;
let editingExerciseId = null;

// DOM Elements
const exerciseTypeSelect = document.getElementById('exercise-type');
const formContainer = document.getElementById('exercise-form-container');
const imageInput = document.getElementById('exercise-image');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image');
const addExerciseBtn = document.getElementById('add-exercise');
const previewExerciseBtn = document.getElementById('preview-exercise');
const exportJsonBtn = document.getElementById('export-json');
const importJsonBtn = document.getElementById('import-json');
const clearAllBtn = document.getElementById('clear-all');
const jsonOutput = document.getElementById('json-output');
const exercisesList = document.getElementById('exercises-list');

// Gestione immagine migliorata
imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        showToast('Elaborazione immagine...', 'info');

        // Ottimizza l'immagine
        const maxWidth = parseInt(document.getElementById('max-width').value);
        const quality = parseFloat(document.getElementById('image-quality').value);

        const optimizedBase64 = await processImage(file, maxWidth, quality);

        currentImageBase64 = optimizedBase64;
        currentImageInfo = {
            name: file.name,
            originalSize: file.size,
            optimizedSize: Math.round(optimizedBase64.length * 0.75)
        };

        imagePreview.src = currentImageBase64;
        imagePreviewContainer.classList.remove('hidden');

        updateImageInfo();
        showToast('Immagine caricata con successo!', 'success');

    } catch (error) {
        showToast('Errore nel caricamento dell\'immagine: ' + error.message, 'error');
    }
});

removeImageBtn.addEventListener('click', () => {
    currentImageBase64 = null;
    currentImageInfo = null;
    imagePreviewContainer.classList.add('hidden');
    imageInput.value = '';
    document.getElementById('image-alt').value = '';
    document.getElementById('image-caption').value = '';
});

// Processa e ottimizza l'immagine
async function processImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const optimizedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(optimizedBase64);
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function updateImageInfo() {
    if (!currentImageInfo) return;

    const info = document.getElementById('image-info');
    const originalKB = (currentImageInfo.originalSize / 1024).toFixed(1);
    const optimizedKB = (currentImageInfo.optimizedSize / 1024).toFixed(1);
    const savings = (100 - (currentImageInfo.optimizedSize / currentImageInfo.originalSize) * 100).toFixed(1);

    info.innerHTML = `
                <div class="flex justify-between text-xs">
                    <span>📁 ${originalKB} KB → ${optimizedKB} KB</span>
                    <span class="text-green-600">💾 ${savings}% riduzione</span>
                </div>
            `;
}

// Genera form dinamico migliorato
exerciseTypeSelect.addEventListener('change', () => {
    formContainer.innerHTML = '';
    const type = exerciseTypeSelect.value;
    if (!type) return;

    // Aggiorna ID esercizio
    document.getElementById('exercise-id').value = exercises.length + 1;

    const commonFields = `
                <div class="form-section">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        <i class="fas fa-question-circle mr-1"></i> Domanda
                    </label>
                    <textarea id="question" class="w-full p-2 border rounded-md" rows="2" placeholder="Inserisci la domanda dell'esercizio..."></textarea>
                </div>
            `;

    const metaFields = `
                <div class="form-section bg-gray-50">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-star mr-1"></i> Punti
                            </label>
                            <input type="number" id="points" class="w-full p-2 border rounded-md" value="1" min="1" max="10">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-signal mr-1"></i> Difficoltà
                            </label>
                            <select id="difficulty" class="w-full p-2 border rounded-md">
                                <option value="facile">🟢 Facile</option>
                                <option value="medio" selected>🟡 Medio</option>
                                <option value="difficile">🔴 Difficile</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-lightbulb mr-1"></i> Suggerimento
                            </label>
                            <input type="text" id="hint" class="w-full p-2 border rounded-md" placeholder="Opzionale">
                        </div>
                    </div>
                </div>
            `;

    switch (type) {
        case 'multiple_choice_single':
            formContainer.innerHTML = commonFields + `
                        <div class="form-section">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-list mr-1"></i> Opzioni (una per riga)
                            </label>
                            <textarea id="options" rows="4" class="w-full p-2 border rounded-md" placeholder="Opzione 1\nOpzione 2\nOpzione 3\nOpzione 4"></textarea>
                            
                            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                <i class="fas fa-check-circle mr-1"></i> Risposta corretta (indice, 0=prima opzione)
                            </label>
                            <input type="number" id="correct_answer" class="w-full p-2 border rounded-md" min="0" value="0">
                            
                            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                <i class="fas fa-info-circle mr-1"></i> Spiegazione
                            </label>
                            <textarea id="explanation" class="w-full p-2 border rounded-md" rows="2" placeholder="Spiega perché questa è la risposta corretta..."></textarea>
                        </div>
                    ` + metaFields;
            break;

        case 'multiple_choice_multiple':
            formContainer.innerHTML = commonFields + `
                        <div class="form-section">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-list mr-1"></i> Opzioni (una per riga)
                            </label>
                            <textarea id="options" rows="5" class="w-full p-2 border rounded-md" placeholder="Opzione 1\nOpzione 2\nOpzione 3\nOpzione 4\nOpzione 5"></textarea>
                            
                            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                <i class="fas fa-check-square mr-1"></i> Risposte corrette (indici separati da virgola)
                            </label>
                            <input type="text" id="correct_answers" class="w-full p-2 border rounded-md" placeholder="0,2,3" title="Es: 0,2,3 per prima, terza e quarta opzione">
                            
                            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                <i class="fas fa-info-circle mr-1"></i> Spiegazione
                            </label>
                            <textarea id="explanation" class="w-full p-2 border rounded-md" rows="2" placeholder="Spiega quali sono le risposte corrette e perché..."></textarea>
                        </div>
                    ` + metaFields;
            break;

        case 'true_false':
            formContainer.innerHTML = commonFields + `
                        <div class="form-section">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-balance-scale mr-1"></i> Risposta corretta
                            </label>
                            <select id="correct_answer" class="w-full p-2 border rounded-md">
                                <option value="true">✅ Vero</option>
                                <option value="false">❌ Falso</option>
                            </select>
                            
                            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                <i class="fas fa-info-circle mr-1"></i> Spiegazione
                            </label>
                            <textarea id="explanation" class="w-full p-2 border rounded-md" rows="2" placeholder="Spiega perché l'affermazione è vera o falsa..."></textarea>
                        </div>
                    ` + metaFields;
            break;

        case 'open_text':
            formContainer.innerHTML = commonFields + `
                        <div class="form-section">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-file-text mr-1"></i> Risposta campione
                            </label>
                            <textarea id="sample_answer" rows="4" class="w-full p-2 border rounded-md" placeholder="Esempio di risposta corretta completa..."></textarea>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-key mr-1"></i> Parole chiave (separate da virgola)
                                    </label>
                                    <input type="text" id="keywords" class="w-full p-2 border rounded-md" placeholder="parola1, parola2, parola3">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-sort-numeric-up mr-1"></i> Minimo parole
                                    </label>
                                    <input type="number" id="min_words" class="w-full p-2 border rounded-md" value="20" min="5">
                                </div>
                            </div>
                        </div>
                    ` + metaFields;
            break;

        case 'fill_in_blank':
            formContainer.innerHTML = `
                        <div class="form-section">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-question-circle mr-1"></i> Frase con spazi vuoti (usa _____ per ogni spazio)
                            </label>
                            <textarea id="question" class="w-full p-2 border rounded-md" rows="3" placeholder="La _____ è un protocollo che serve per _____ le comunicazioni."></textarea>
                            
                            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                <i class="fas fa-puzzle-piece mr-1"></i> Risposte corrette (una per riga, per ogni spazio vuoto)
                            </label>
                            <textarea id="correct_answers" rows="3" class="w-full p-2 border rounded-md" placeholder="crittografia\nproteggere"></textarea>
                            
                            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                <i class="fas fa-info-circle mr-1"></i> Spiegazione
                            </label>
                            <textarea id="explanation" class="w-full p-2 border rounded-md" rows="2" placeholder="Spiega il contesto della frase..."></textarea>
                        </div>
                    ` + metaFields;
            break;

        case 'matching':
            formContainer.innerHTML = commonFields + `
                        <div class="form-section">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-arrow-left mr-1"></i> Elementi sinistra (uno per riga)
                                    </label>
                                    <textarea id="left_items" rows="4" class="w-full p-2 border rounded-md" placeholder="SSL/TLS\nVPN\nAntivirus\nBackup"></textarea>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-arrow-right mr-1"></i> Elementi destra (uno per riga)
                                    </label>
                                    <textarea id="right_items" rows="4" class="w-full p-2 border rounded-md" placeholder="Protocollo sicuro\nRete privata\nAnti-malware\nCopia dati"></textarea>
                                </div>
                            </div>
                            
                            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                <i class="fas fa-link mr-1"></i> Abbinamenti corretti (formato: 0-2,1-0,2-3,3-1)
                            </label>
                            <input type="text" id="correct_matches" class="w-full p-2 border rounded-md" placeholder="0-0,1-1,2-2,3-3">
                        </div>
                    ` + metaFields;
            break;

        case 'ordering':
            formContainer.innerHTML = commonFields + `
                        <div class="form-section">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-sort mr-1"></i> Elementi da ordinare (uno per riga)
                            </label>
                            <textarea id="items" rows="5" class="w-full p-2 border rounded-md" placeholder="Documentare l'incidente\nIdentificare la minaccia\nRilevare l'incidente\nRecuperare i sistemi\nAnalizzare le cause"></textarea>
                            
                            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                <i class="fas fa-list-ol mr-1"></i> Ordine corretto (indici separati da virgola)
                            </label>
                            <input type="text" id="correct_order" class="w-full p-2 border rounded-md" placeholder="2,1,4,3,0">
                            
                            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                <i class="fas fa-info-circle mr-1"></i> Spiegazione
                            </label>
                            <textarea id="explanation" class="w-full p-2 border rounded-md" rows="2" placeholder="Spiega la sequenza corretta..."></textarea>
                        </div>
                    ` + metaFields;
            break;

        case 'code_completion':
            formContainer.innerHTML = commonFields + `
                        <div class="form-section">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-code mr-1"></i> Template codice (usa ____ per i buchi)
                            </label>
                            <textarea id="code_template" rows="8" class="w-full p-2 border rounded-md font-mono text-sm" placeholder="import re\n\ndef validate_password(password):\n    if len(password) < ____:\n        return False\n    if not re.search(r'____', password):\n        return False\n    return True"></textarea>
                            
                            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                <i class="fas fa-key mr-1"></i> Risposte corrette (una per riga, per ogni ____)
                            </label>
                            <textarea id="correct_answers" rows="3" class="w-full p-2 border rounded-md" placeholder="8\n[A-Z]\nre.search(r'[0-9]', password)"></textarea>
                        </div>
                    ` + metaFields;
            break;

        case 'drag_and_drop':
            formContainer.innerHTML = commonFields + `
                        <div class="form-section">
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-hand-rock mr-1"></i> Elementi trascinabili (uno per riga)
                            </label>
                            <textarea id="draggable_items" rows="6" class="w-full p-2 border rounded-md" placeholder="Firewall\nLucchetti\nAntivirus\nTelecamere\nCrittografia\nBadge accesso"></textarea>
                            
                            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">
                                <i class="fas fa-folder mr-1"></i> Categorie (formato: NomeCategoria:indici)
                            </label>
                            <textarea id="categories" rows="3" class="w-full p-2 border rounded-md" placeholder="Sicurezza Fisica:1,3,5\nSicurezza Logica:0,2,4"></textarea>
                        </div>
                    ` + metaFields;
            break;
    }
});

// Aggiungi esercizio migliorato
addExerciseBtn.addEventListener('click', () => {
    const type = exerciseTypeSelect.value;
    if (!type) {
        showToast('Seleziona un tipo di esercizio!', 'error');
        return;
    }

    const question = document.getElementById('question')?.value;
    if (!question?.trim()) {
        showToast('Inserisci una domanda!', 'error');
        return;
    }

    try {
        const exercise = buildExercise();
        const targetId = exercise.id;

        // Trova la posizione corretta nell'array (ordinato per ID)
        let insertIndex = exercises.findIndex(ex => ex.id > targetId);
        if (insertIndex === -1) {
            insertIndex = exercises.length; // Inserisci alla fine
        }

        // Inserisci l'esercizio nella posizione corretta
        exercises.splice(insertIndex, 0, exercise);

        // Riordina tutti gli ID per assicurare sequenzialità
        exercises.forEach((ex, index) => {
            ex.id = index + 1;
        });

        updateExercisesList();
        updateJsonOutput();
        updateStatistics();
        resetForm();

        showToast('Esercizio aggiunto con successo!', 'success');

        // Scorri alla lista esercizi
        document.getElementById('exercises-list').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        showToast('Errore nella creazione dell\'esercizio: ' + error.message, 'error');
    }
});

function buildExercise() {
    const type = exerciseTypeSelect.value;
    const exercise = {
        id: parseInt(document.getElementById('exercise-id').value),
        type: type,
        question: document.getElementById('question').value.trim(),
        points: parseInt(document.getElementById('points').value),
        difficulty: document.getElementById('difficulty').value
    };

    // Aggiungi hint se presente
    const hint = document.getElementById('hint')?.value.trim();
    if (hint) {
        exercise.hint = hint;
    }

    // Aggiungi immagine se presente
    if (currentImageBase64) {
        exercise.image = {
            data: currentImageBase64,
            alt: document.getElementById('image-alt').value || 'Immagine esercizio',
            caption: document.getElementById('image-caption').value || '',
            width: document.getElementById('image-width').value
        };
    }

    // Campi specifici per tipo
    switch (type) {
        case 'multiple_choice_single':
            exercise.options = document.getElementById('options').value.split('\n').filter(o => o.trim());
            exercise.correct_answer = parseInt(document.getElementById('correct_answer').value);
            exercise.explanation = document.getElementById('explanation').value.trim();

            if (exercise.options.length < 2) throw new Error('Inserisci almeno 2 opzioni');
            if (exercise.correct_answer >= exercise.options.length) throw new Error('Indice risposta corretta non valido');
            break;

        case 'multiple_choice_multiple':
            exercise.options = document.getElementById('options').value.split('\n').filter(o => o.trim());
            exercise.correct_answers = document.getElementById('correct_answers').value.split(',').map(i => parseInt(i.trim()));
            exercise.explanation = document.getElementById('explanation').value.trim();

            if (exercise.options.length < 2) throw new Error('Inserisci almeno 2 opzioni');
            if (exercise.correct_answers.some(i => i >= exercise.options.length)) throw new Error('Indici risposte corrette non validi');
            break;

        case 'true_false':
            exercise.correct_answer = document.getElementById('correct_answer').value === 'true';
            exercise.explanation = document.getElementById('explanation').value.trim();
            break;

        case 'open_text':
            exercise.sample_answer = document.getElementById('sample_answer').value.trim();
            exercise.keywords = document.getElementById('keywords').value.split(',').map(k => k.trim()).filter(k => k);
            exercise.min_words = parseInt(document.getElementById('min_words').value);

            if (exercise.keywords.length === 0) throw new Error('Inserisci almeno una parola chiave');
            break;

        case 'fill_in_blank':
            const blanksCount = (exercise.question.match(/_____/g) || []).length;
            const correctAnswers = document.getElementById('correct_answers').value.split('\n').filter(a => a.trim());

            if (blanksCount === 0) throw new Error('Inserisci almeno uno spazio vuoto con _____');
            if (correctAnswers.length !== blanksCount) throw new Error(`Numero risposte (${correctAnswers.length}) diverso dal numero di spazi vuoti (${blanksCount})`);

            exercise.blanks = correctAnswers.map((answer, i) => ({
                position: i + 1,
                correct_answers: answer.split(',').map(a => a.trim()),
                case_sensitive: false
            }));
            exercise.explanation = document.getElementById('explanation').value.trim();
            break;

        case 'matching':
            exercise.left_items = document.getElementById('left_items').value.split('\n').filter(i => i.trim());
            exercise.right_items = document.getElementById('right_items').value.split('\n').filter(i => i.trim());

            const matchPairs = document.getElementById('correct_matches').value.split(',').map(match => {
                const [left, right] = match.split('-').map(i => parseInt(i.trim()));
                return { left, right };
            });
            exercise.correct_matches = matchPairs;

            if (exercise.left_items.length !== exercise.right_items.length) throw new Error('Numero elementi sinistra e destra deve essere uguale');
            break;

        case 'ordering':
            exercise.items = document.getElementById('items').value.split('\n').filter(i => i.trim());
            exercise.correct_order = document.getElementById('correct_order').value.split(',').map(i => parseInt(i.trim()));
            exercise.explanation = document.getElementById('explanation').value.trim();

            if (exercise.correct_order.length !== exercise.items.length) throw new Error('Numero elementi diverso dal numero di posizioni nell\'ordine');
            break;

        case 'code_completion':
            exercise.code_template = document.getElementById('code_template').value;
            const blanksInCode = (exercise.code_template.match(/____/g) || []).length;
            const codeAnswers = document.getElementById('correct_answers').value.split('\n').filter(a => a.trim());

            if (blanksInCode !== codeAnswers.length) throw new Error('Numero risposte diverso dal numero di ____ nel codice');

            exercise.blanks = codeAnswers.map((answer, i) => ({
                line: i,
                correct_answer: answer.trim()
            }));
            break;

        case 'drag_and_drop':
            exercise.draggable_items = document.getElementById('draggable_items').value.split('\n').filter(i => i.trim());
            const categories = document.getElementById('categories').value.split('\n').filter(c => c.trim());

            exercise.categories = categories.map(category => {
                const [name, indices] = category.split(':');
                return {
                    name: name.trim(),
                    correct_items: indices.split(',').map(i => parseInt(i.trim()))
                };
            });

            if (exercise.categories.length === 0) throw new Error('Inserisci almeno una categoria');
            break;
    }

    return exercise;
}

// Anteprima esercizio
previewExerciseBtn.addEventListener('click', () => {
    try {
        const exercise = buildExercise();
        showPreview(exercise);
    } catch (error) {
        showToast('Impossibile creare anteprima: ' + error.message, 'error');
    }
});

function showPreview(exercise) {
    const previewContent = document.getElementById('preview-content');
    const modal = document.getElementById('preview-modal');

    let previewHTML = `
                <div class="exercise-card p-4 border-2 border-blue-200 rounded-lg">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg font-semibold text-blue-600">Esercizio ${exercise.id}</h3>
                        <div class="flex gap-2">
                            <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">${exercise.type.replace('_', ' ')}</span>
                            <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">${exercise.difficulty}</span>
                            <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">${exercise.points} pt</span>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <p class="text-gray-800 font-medium">${exercise.question}</p>
                    </div>
            `;

    // Aggiungi immagine se presente
    if (exercise.image) {
        previewHTML += `
                    <div class="mb-4 text-center">
                        <img src="${exercise.image.data}" alt="${exercise.image.alt}" class="max-w-full h-auto rounded-lg border" style="max-width: ${exercise.image.width}">
                        ${exercise.image.caption ? `<p class="text-sm text-gray-600 mt-2 italic">${exercise.image.caption}</p>` : ''}
                    </div>
                `;
    }

    // Contenuto specifico per tipo
    switch (exercise.type) {
        case 'multiple_choice_single':
            previewHTML += '<div class="space-y-2">';
            exercise.options.forEach((option, i) => {
                const isCorrect = i === exercise.correct_answer;
                previewHTML += `
                            <label class="flex items-center p-2 border rounded ${isCorrect ? 'bg-green-50 border-green-300' : 'border-gray-300'}">
                                <input type="radio" name="preview" class="mr-2" ${isCorrect ? 'checked' : ''}>
                                <span>${option}</span>
                                ${isCorrect ? '<i class="fas fa-check text-green-600 ml-auto"></i>' : ''}
                            </label>
                        `;
            });
            previewHTML += '</div>';
            break;

        case 'true_false':
            previewHTML += `
                        <div class="flex gap-4 justify-center">
                            <label class="flex items-center p-3 border rounded ${exercise.correct_answer ? 'bg-green-50 border-green-300' : 'border-gray-300'}">
                                <input type="radio" name="preview" class="mr-2" ${exercise.correct_answer ? 'checked' : ''}>
                                <span>Vero</span>
                                ${exercise.correct_answer ? '<i class="fas fa-check text-green-600 ml-2"></i>' : ''}
                            </label>
                            <label class="flex items-center p-3 border rounded ${!exercise.correct_answer ? 'bg-green-50 border-green-300' : 'border-gray-300'}">
                                <input type="radio" name="preview" class="mr-2" ${!exercise.correct_answer ? 'checked' : ''}>
                                <span>Falso</span>
                                ${!exercise.correct_answer ? '<i class="fas fa-check text-green-600 ml-2"></i>' : ''}
                            </label>
                        </div>
                    `;
            break;

        case 'open_text':
            previewHTML += `
                        <div class="mb-4">
                            <textarea class="w-full p-3 border rounded-lg" rows="4" placeholder="Scrivi la tua risposta qui..." readonly></textarea>
                            <div class="text-sm text-gray-600 mt-2">
                                Minimo ${exercise.min_words} parole. Parole chiave: ${exercise.keywords.join(', ')}
                            </div>
                        </div>
                    `;
            break;

        case 'fill_in_blank':
            let questionWithBlanks = exercise.question;
            exercise.blanks.forEach((blank, i) => {
                questionWithBlanks = questionWithBlanks.replace('_____',
                    `<input type="text" class="border-b-2 border-blue-400 px-2 py-1 mx-1 bg-blue-50" value="${blank.correct_answers[0]}" readonly>`
                );
            });
            previewHTML += `<div class="text-lg leading-relaxed">${questionWithBlanks}</div>`;
            break;
    }

    // Aggiungi spiegazione se presente
    if (exercise.explanation) {
        previewHTML += `
                    <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                            <span class="font-medium text-blue-800">Spiegazione</span>
                        </div>
                        <p class="text-blue-700">${exercise.explanation}</p>
                    </div>
                `;
    }

    previewHTML += '</div>';
    previewContent.innerHTML = previewHTML;
    modal.classList.remove('hidden');
}

// Chiudi anteprima
document.getElementById('close-preview').addEventListener('click', () => {
    document.getElementById('preview-modal').classList.add('hidden');
});

// Export JSON migliorato
exportJsonBtn.addEventListener('click', () => {
    if (exercises.length === 0) {
        showToast('Nessun esercizio da esportare!', 'error');
        return;
    }

    const exportData = {
        course: document.getElementById('course-name').value || 'Corso',
        description: `Esercizi di ${document.getElementById('course-name').value || 'Corso'} con ${exercises.length} domande`,
        exercises: exercises
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportData.course}_exercise.json`;
    a.click();

    showToast('File JSON esportato con successo!', 'success');
});

// Import JSON
importJsonBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (data.exercises && Array.isArray(data.exercises)) {
                    exercises = data.exercises;
                    updateExercisesList();
                    updateJsonOutput();
                    updateStatistics();
                    showToast('Esercizi importati con successo!', 'success');

                    if (data.course) {
                        document.getElementById('course-name').value = data.course;
                    }
                } else {
                    throw new Error('Formato file non valido');
                }
            } catch (error) {
                showToast('Errore nell\'importazione: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

// Pulisci tutto
clearAllBtn.addEventListener('click', () => {
    if (confirm('Sei sicuro di voler cancellare tutti gli esercizi?')) {
        exercises = [];
        updateExercisesList();
        updateJsonOutput();
        updateStatistics();
        resetForm();
        showToast('Tutti gli esercizi sono stati cancellati', 'info');
    }
});

// Aggiorna lista esercizi
function updateExercisesList() {
    const container = document.getElementById('exercises-list');
    document.getElementById('exercises-count').textContent = `${exercises.length} esercizi`;

    if (exercises.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-8">Nessun esercizio creato ancora</div>';
        return;
    }

    container.innerHTML = exercises.map(exercise => {
        const typeIcon = getTypeIcon(exercise.type);
        const difficultyColor = getDifficultyColor(exercise.difficulty);
        const hasImage = exercise.image ? '🖼️' : '';

        return `
                    <div class="exercise-card bg-gray-50 p-4 rounded-lg border-l-4 hover:shadow-md transition-all">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="text-lg">${typeIcon}</span>
                                    <span class="font-semibold text-gray-800">Esercizio ${exercise.id}</span>
                                    <span class="text-sm px-2 py-1 rounded-full ${difficultyColor}">${exercise.difficulty}</span>
                                    ${hasImage}
                                    <span class="text-sm text-gray-500">${exercise.points} pt</span>
                                </div>
                                <p class="text-gray-700 mb-2">${exercise.question.substring(0, 100)}${exercise.question.length > 100 ? '...' : ''}</p>
                                <div class="text-sm text-gray-500">
                                    ${exercise.type.replace(/_/g, ' ')} 
                                    ${exercise.hint ? '• Ha suggerimento' : ''}
                                </div>
                            </div>
                            <div class="flex flex-col gap-1">
                                <button onclick="editExercise(${exercise.id - 1})" class="text-blue-600 hover:text-blue-800 text-sm">
                                    <i class="fas fa-edit"></i> Modifica
                                </button>
                                <button onclick="duplicateExercise(${exercise.id - 1})" class="text-green-600 hover:text-green-800 text-sm">
                                    <i class="fas fa-copy"></i> Duplica
                                </button>
                                <button onclick="deleteExercise(${exercise.id - 1})" class="text-red-600 hover:text-red-800 text-sm">
                                    <i class="fas fa-trash"></i> Elimina
                                </button>
                            </div>
                        </div>
                    </div>
                `;
    }).join('');
}

function getTypeIcon(type) {
    const icons = {
        'multiple_choice_single': '🔘',
        'multiple_choice_multiple': '☑️',
        'true_false': '✅',
        'open_text': '📝',
        'fill_in_blank': '📋',
        'matching': '🔗',
        'ordering': '📊',
        'code_completion': '💻',
        'drag_and_drop': '🎯'
    };
    return icons[type] || '❓';
}

function getDifficultyColor(difficulty) {
    const colors = {
        'facile': 'bg-green-100 text-green-800',
        'medio': 'bg-yellow-100 text-yellow-800',
        'difficile': 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
}

// Funzioni CRUD per esercizi
function editExercise(index) {
    const exercise = exercises[index];

    // Memorizza l'ID originale per mantenere la posizione
    window.editingExerciseId = exercise.id;

    // Carica i dati nell'editor
    exerciseTypeSelect.value = exercise.type;
    exerciseTypeSelect.dispatchEvent(new Event('change'));

    setTimeout(() => {
        // Campi comuni
        document.getElementById('exercise-id').value = exercise.id;
        document.getElementById('question').value = exercise.question;
        document.getElementById('points').value = exercise.points;
        document.getElementById('difficulty').value = exercise.difficulty;

        if (exercise.hint && document.getElementById('hint')) {
            document.getElementById('hint').value = exercise.hint;
        }

        // Immagine
        if (exercise.image) {
            currentImageBase64 = exercise.image.data;
            imagePreview.src = currentImageBase64;
            imagePreviewContainer.classList.remove('hidden');
            document.getElementById('image-alt').value = exercise.image.alt || '';
            document.getElementById('image-caption').value = exercise.image.caption || '';
            document.getElementById('image-width').value = exercise.image.width || '500px';
        }

        // Campi specifici per tipo
        switch (exercise.type) {
            case 'multiple_choice_single':
                document.getElementById('options').value = exercise.options.join('\n');
                document.getElementById('correct_answer').value = exercise.correct_answer;
                document.getElementById('explanation').value = exercise.explanation || '';
                break;

            case 'multiple_choice_multiple':
                document.getElementById('options').value = exercise.options.join('\n');
                document.getElementById('correct_answers').value = exercise.correct_answers.join(',');
                document.getElementById('explanation').value = exercise.explanation || '';
                break;

            case 'true_false':
                document.getElementById('correct_answer').value = exercise.correct_answer ? 'true' : 'false';
                document.getElementById('explanation').value = exercise.explanation || '';
                break;

            case 'open_text':
                document.getElementById('sample_answer').value = exercise.sample_answer || '';
                document.getElementById('keywords').value = exercise.keywords.join(', ');
                document.getElementById('min_words').value = exercise.min_words;
                break;

            case 'fill_in_blank':
                document.getElementById('correct_answers').value = exercise.blanks.map(b => b.correct_answers.join(',')).join('\n');
                document.getElementById('explanation').value = exercise.explanation || '';
                break;

            case 'matching':
                document.getElementById('left_items').value = exercise.left_items.join('\n');
                document.getElementById('right_items').value = exercise.right_items.join('\n');
                document.getElementById('correct_matches').value = exercise.correct_matches.map(m => `${m.left}-${m.right}`).join(',');
                break;

            case 'ordering':
                document.getElementById('items').value = exercise.items.join('\n');
                document.getElementById('correct_order').value = exercise.correct_order.join(',');
                document.getElementById('explanation').value = exercise.explanation || '';
                break;

            case 'code_completion':
                document.getElementById('code_template').value = exercise.code_template;
                document.getElementById('correct_answers').value = exercise.blanks.map(b => b.correct_answer).join('\n');
                break;

            case 'drag_and_drop':
                document.getElementById('draggable_items').value = exercise.draggable_items.join('\n');
                document.getElementById('categories').value = exercise.categories.map(c => `${c.name}:${c.correct_items.join(',')}`).join('\n');
                break;
        }

        // Rimuovi l'esercizio dalla lista (verrà sostituito quando si clicca "Aggiungi")
        exercises.splice(index, 1);
        updateExercisesList();
        updateJsonOutput();
        updateStatistics();

        showToast('Esercizio caricato nell\'editor. Clicca "Aggiungi" per salvare le modifiche', 'info');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
}

function duplicateExercise(index) {
    const exercise = JSON.parse(JSON.stringify(exercises[index])); // Deep clone
    exercise.id = exercises.length + 1;
    exercises.push(exercise);

    updateExercisesList();
    updateJsonOutput();
    updateStatistics();

    showToast('Esercizio duplicato!', 'success');
}

function deleteExercise(index) {
    const exercise = exercises[index];
    if (confirm(`Sei sicuro di voler eliminare l'esercizio "${exercise.question.substring(0, 50)}..."?`)) {
        exercises.splice(index, 1);

        // Rinumera gli esercizi
        exercises.forEach((ex, i) => {
            ex.id = i + 1;
        });

        updateExercisesList();
        updateJsonOutput();
        updateStatistics();

        showToast('Esercizio eliminato', 'info');
    }
}

// Aggiorna statistiche
function updateStatistics() {
    document.getElementById('total-exercises').textContent = exercises.length;
    document.getElementById('exercises-with-images').textContent = exercises.filter(e => e.image).length;
    document.getElementById('total-points').textContent = exercises.reduce((sum, e) => sum + e.points, 0);
}

// Aggiorna output JSON
function updateJsonOutput() {
    const exportData = {
        course: document.getElementById('course-name').value || 'Corso',
        description: `Esercizi di ${document.getElementById('course-name').value || 'Corso'} con ${exercises.length} domande`,
        exercises: exercises
    };

    jsonOutput.value = JSON.stringify(exportData, null, 2);
}

// Toggle JSON output
function toggleJsonOutput() {
    const container = document.getElementById('json-output-container');
    const icon = document.getElementById('json-toggle-icon');

    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    } else {
        container.classList.add('hidden');
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
}

// Copia JSON
document.getElementById('copy-json').addEventListener('click', () => {
    jsonOutput.select();
    document.execCommand('copy');
    showToast('JSON copiato negli appunti!', 'success');
});

// Reset form
function resetForm() {
    exerciseTypeSelect.value = '';
    formContainer.innerHTML = '';
    imageInput.value = '';
    imagePreviewContainer.classList.add('hidden');
    currentImageBase64 = null;
    currentImageInfo = null;

    // Reset campi immagine
    document.getElementById('image-alt').value = '';
    document.getElementById('image-caption').value = '';
    document.getElementById('image-width').value = '500px';

    // Aggiorna ID esercizio
    document.getElementById('exercise-id').value = exercises.length + 1;
}

// Sistema di notifiche toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    toast.className = `toast ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 mb-3`;
    toast.innerHTML = `
                <i class="fas ${icons[type]}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.remove()" class="ml-auto">
                    <i class="fas fa-times"></i>
                </button>
            `;

    document.getElementById('toast-container').appendChild(toast);

    // Auto rimozione dopo 5 secondi
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Chiudi modal con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('preview-modal').classList.add('hidden');
    }
});

// Chiudi modal cliccando fuori
document.getElementById('preview-modal').addEventListener('click', (e) => {
    if (e.target.id === 'preview-modal') {
        document.getElementById('preview-modal').classList.add('hidden');
    }
});

// Aggiornamento automatico parametri ottimizzazione
document.getElementById('max-width').addEventListener('change', reoptimizeImage);
document.getElementById('image-quality').addEventListener('change', reoptimizeImage);

async function reoptimizeImage() {
    if (!currentImageBase64 || !imageInput.files[0]) return;

    try {
        const maxWidth = parseInt(document.getElementById('max-width').value);
        const quality = parseFloat(document.getElementById('image-quality').value);

        const optimized = await processImage(imageInput.files[0], maxWidth, quality);
        currentImageBase64 = optimized;
        imagePreview.src = optimized;

        // Aggiorna info dimensioni
        currentImageInfo.optimizedSize = Math.round(optimized.length * 0.75);
        updateImageInfo();

        showToast('Immagine riottimizzata!', 'info');
    } catch (error) {
        showToast('Errore nella riottimizzazione: ' + error.message, 'error');
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    updateStatistics();
    updateJsonOutput();

    // Mostra messaggio di benvenuto
    setTimeout(() => {
        showToast('Exercise Builder caricato! Inizia creando un nuovo esercizio.', 'success');
    }, 500);
});

// Salvataggio automatico nel sessionStorage (se disponibile)
function autoSave() {
    try {
        if (typeof(Storage) !== "undefined") {
            const exerciseData = JSON.stringify({
                exercises: exercises,
                course: document.getElementById('course-name').value
            });
            sessionStorage.setItem('exerciseBuilder_data', exerciseData);
        }
    } catch (e) {
        console.warn('Impossibile salvare automaticamente:', e);
    }
}

// Caricamento automatico dal sessionStorage (se disponibile)
function autoLoad() {
    try {
        if (typeof(Storage) !== "undefined") {
            const saved = sessionStorage.getItem('exerciseBuilder_data');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.exercises && Array.isArray(data.exercises)) {
                    exercises = data.exercises;
                    updateExercisesList();
                    updateJsonOutput();
                    updateStatistics();
                }
                if (data.course) {
                    document.getElementById('course-name').value = data.course;
                }
                showToast('Dati caricati dalla sessione precedente', 'info');
            }
        }
    } catch (e) {
        console.warn('Impossibile caricare il salvataggio automatico:', e);
    }
}

// Auto-save ogni 30 secondi se ci sono esercizi
setInterval(() => {
    if (exercises.length > 0) {
        autoSave();
    }
}, 30000);

// Carica al startup
window.addEventListener('load', autoLoad);

// Salva prima di chiudere la pagina
window.addEventListener('beforeunload', (e) => {
    if (exercises.length > 0) {
        autoSave();
    }
});

// Aggiorna JSON quando cambia il nome corso
document.getElementById('course-name').addEventListener('input', () => {
    updateJsonOutput();
});

// Esporta funzioni globali per i pulsanti
window.editExercise = editExercise;
window.duplicateExercise = duplicateExercise;
window.deleteExercise = deleteExercise;
window.toggleJsonOutput = toggleJsonOutput;