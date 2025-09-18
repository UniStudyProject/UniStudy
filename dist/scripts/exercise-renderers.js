// ===== CLASSE ASTRATTA BASE =====
class ExerciseRenderer {
    constructor(exercise, index) {
        if (new.target === ExerciseRenderer) {
            throw new Error("Cannot instantiate abstract class ExerciseRenderer directly");
        }
        this.exercise = exercise;
        this.index = index;
        this.exerciseId = exercise.id;
    }

    // Metodo per creare l'elemento HTML container dell'esercizio
    createContainer() {
        const div = document.createElement('div');
        div.className = 'card mb-4 exercise-card';
        div.setAttribute('data-exercise-id', this.exerciseId);
        div.setAttribute('data-exercise-index', this.index);

        div.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                    <i class="fas ${this.getIcon()} me-2"></i>
                    Esercizio ${this.exerciseId}
                </h5>
                <div class="exercise-meta">
                    <span class="badge bg-${this.getDifficultyColor()}">${this.exercise.difficulty}</span>
                    <span class="badge bg-info ms-1">${this.exercise.points} pt</span>
                    ${this.exercise.image ? '<i class="fas fa-image text-primary ms-1" title="Con immagine"></i>' : ''}
                </div>
            </div>
            <div class="card-body">
                <div class="question-text mb-3">${this.exercise.question}</div>
                ${this.renderImage()}
                ${this.renderContent()}
                ${this.renderControls()}
                <div id="feedback_${this.exerciseId}" class="feedback-container mt-3" style="display: none;"></div>
                <div id="explanation_${this.exerciseId}" class="explanation-container mt-3" style="display: none;">
                    <div class="alert alert-info">
                        <strong><i class="fas fa-info-circle me-2"></i>Spiegazione:</strong>
                        <div class="mt-2">${this.exercise.explanation || 'Nessuna spiegazione disponibile'}</div>
                    </div>
                </div>
            </div>
        `;

        return div;
    }

    // Metodo per renderizzare l'immagine se presente
    renderImage() {
        if (!this.exercise.image || !this.exercise.image.data) return '';

        return `
            <div class="exercise-image mb-3 text-center">
                <img src="${this.exercise.image.data}" 
                     alt="${this.exercise.image.alt || 'Immagine esercizio'}" 
                     class="img-fluid rounded shadow-sm"
                     style="max-width: ${this.exercise.image.width || '500px'}; max-height: 400px; object-fit: contain;">
                ${this.exercise.image.caption ? 
                    `<div class="image-caption mt-2 text-muted"><em>${this.exercise.image.caption}</em></div>` : ''}
            </div>
        `;
    }

    // Metodo per renderizzare i controlli
    renderControls() {
        return `
            <div class="exercise-controls mt-4">
                <button onclick="ExerciseManager.checkAnswer(${this.exerciseId}, this)" 
                        class="btn btn-primary check-answer">
                    <i class="fas fa-check me-2"></i>
                    Controlla Risposta
                </button>
                ${this.exercise.hint ? `
                    <button onclick="ExerciseManager.showHint(${this.exerciseId})" 
                            class="btn btn-outline-secondary ms-2">
                        <i class="fas fa-lightbulb me-2"></i>
                        Suggerimento
                    </button>
                ` : ''}
                <button onclick="ExerciseManager.resetExercise(${this.exerciseId})" 
                        class="btn btn-outline-warning ms-2">
                    <i class="fas fa-redo me-2"></i>
                    Reset
                </button>
            </div>
        `;
    }

    // Metodo helper per ottenere l'icona del tipo
    getIcon() {
        const icons = {
            'multiple_choice_single': 'fa-dot-circle',
            'multiple_choice_multiple': 'fa-check-square',
            'true_false': 'fa-balance-scale',
            'open_text': 'fa-edit',
            'open_ended': 'fa-edit',
            'fill_in_blank': 'fa-i-cursor',
            'matching': 'fa-link',
            'ordering': 'fa-sort',
            'code_completion': 'fa-code',
            'drag_and_drop': 'fa-hand-rock'
        };
        return icons[this.exercise.type] || 'fa-question';
    }

    // Metodo helper per ottenere il colore della difficoltà
    getDifficultyColor() {
        switch (this.exercise.difficulty) {
            case 'facile': return 'success';
            case 'medio': return 'warning';
            case 'difficile': return 'danger';
            default: return 'secondary';
        }
    }

    // Metodi helper utility
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    shuffleArrayWithMapping(array) {
        return array.map((value, originalIndex) => ({
            value,
            originalIndex
        })).sort(() => Math.random() - 0.5);
    }

    // ===== METODI ASTRATTI DA IMPLEMENTARE NELLE SOTTOCLASSI =====
    
    // Metodo per renderizzare il contenuto specifico dell'esercizio
    renderContent() {
        throw new Error("Method 'renderContent' must be implemented");
    }

    // Metodo per valutare la risposta
    evaluate() {
        throw new Error("Method 'evaluate' must be implemented");
    }

    // Metodo per resettare l'esercizio
    reset() {
        throw new Error("Method 'reset' must be implemented");
    }
}

// ===== IMPLEMENTAZIONI CONCRETE PER OGNI TIPO DI ESERCIZIO =====

// 1. Multiple Choice Single
class MultipleChoiceSingleRenderer extends ExerciseRenderer {
    renderContent() {
        if (!this.exercise.options || !Array.isArray(this.exercise.options)) {
            return '<div class="alert alert-warning">Opzioni mancanti per questo esercizio</div>';
        }

        const shuffledOptions = this.shuffleArrayWithMapping(this.exercise.options);
        let html = '<div class="multiple-choice-single">';
        
        shuffledOptions.forEach((optionData, index) => {
            html += `
                <div class="form-check mb-3 p-3 border rounded-3 option-item">
                    <input class="form-check-input" type="radio" 
                           name="exercise_${this.exerciseId}" 
                           id="option_${this.exerciseId}_${index}" 
                           value="${optionData.originalIndex}">
                    <label class="form-check-label w-100" for="option_${this.exerciseId}_${index}">
                        ${optionData.value}
                    </label>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    evaluate() {
        const selectedOption = document.querySelector(`input[name="exercise_${this.exerciseId}"]:checked`);
        
        if (!selectedOption) {
            return {
                isCorrect: false,
                feedback: 'Seleziona una risposta.'
            };
        }

        const userAnswer = parseInt(selectedOption.value);
        const isCorrect = userAnswer === this.exercise.correct_answer;
        
        return {
            isCorrect,
            feedback: isCorrect ? 
                'Risposta corretta!' : 
                `Risposta sbagliata. La risposta corretta è: "${this.exercise.options[this.exercise.correct_answer]}"`
        };
    }

    reset() {
        document.querySelectorAll(`input[name="exercise_${this.exerciseId}"]`).forEach(input => {
            input.checked = false;
        });
    }
}

// 2. Multiple Choice Multiple
class MultipleChoiceMultipleRenderer extends ExerciseRenderer {
    renderContent() {
        if (!this.exercise.options || !Array.isArray(this.exercise.options)) {
            return '<div class="alert alert-warning">Opzioni mancanti per questo esercizio</div>';
        }

        const shuffledOptions = this.shuffleArrayWithMapping(this.exercise.options);
        let html = `
            <div class="multiple-choice-multiple">
                <div class="alert alert-info mb-3">
                    <i class="fas fa-info-circle me-2"></i>
                    Seleziona tutte le risposte corrette
                </div>
        `;

        shuffledOptions.forEach((optionData, index) => {
            html += `
                <div class="form-check mb-3 p-3 border rounded-3 option-item">
                    <input class="form-check-input" type="checkbox" 
                           name="exercise_${this.exerciseId}" 
                           id="option_${this.exerciseId}_${index}" 
                           value="${optionData.originalIndex}">
                    <label class="form-check-label w-100" for="option_${this.exerciseId}_${index}">
                        ${optionData.value}
                    </label>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    evaluate() {
        const selectedOptions = document.querySelectorAll(`input[name="exercise_${this.exerciseId}"]:checked`);
        
        if (selectedOptions.length === 0) {
            return {
                isCorrect: false,
                feedback: 'Seleziona almeno una risposta.'
            };
        }

        const userAnswers = Array.from(selectedOptions).map(opt => parseInt(opt.value)).sort();
        const correctAnswers = (this.exercise.correct_answers || []).sort();
        const isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);

        if (isCorrect) {
            return {
                isCorrect: true,
                feedback: 'Tutte le risposte sono corrette!'
            };
        } else {
            const correctTexts = correctAnswers.map(idx => this.exercise.options[idx]).join(', ');
            return {
                isCorrect: false,
                feedback: `Risposta incompleta o errata. Le risposte corrette sono: ${correctTexts}`
            };
        }
    }

    reset() {
        document.querySelectorAll(`input[name="exercise_${this.exerciseId}"]`).forEach(input => {
            input.checked = false;
        });
    }
}

// 3. True/False
class TrueFalseRenderer extends ExerciseRenderer {
    renderContent() {
        return `
            <div class="true-false text-center">
                <div class="row justify-content-center">
                    <div class="col-auto">
                        <div class="form-check form-check-inline p-4 border rounded-3 m-2 tf-option">
                            <input class="form-check-input" type="radio" 
                                   name="exercise_${this.exerciseId}" 
                                   id="true_${this.exerciseId}" value="true">
                            <label class="form-check-label" for="true_${this.exerciseId}">
                                <i class="fas fa-check text-success fa-2x d-block mb-2"></i>
                                <strong>Vero</strong>
                            </label>
                        </div>
                    </div>
                    <div class="col-auto">
                        <div class="form-check form-check-inline p-4 border rounded-3 m-2 tf-option">
                            <input class="form-check-input" type="radio" 
                                   name="exercise_${this.exerciseId}" 
                                   id="false_${this.exerciseId}" value="false">
                            <label class="form-check-label" for="false_${this.exerciseId}">
                                <i class="fas fa-times text-danger fa-2x d-block mb-2"></i>
                                <strong>Falso</strong>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    evaluate() {
        const tfSelected = document.querySelector(`input[name="exercise_${this.exerciseId}"]:checked`);
        
        if (!tfSelected) {
            return {
                isCorrect: false,
                feedback: 'Seleziona Vero o Falso.'
            };
        }

        const userAnswer = tfSelected.value === 'true';
        const isCorrect = userAnswer === this.exercise.correct_answer;
        
        return {
            isCorrect,
            feedback: isCorrect ? 
                'Risposta corretta!' : 
                `Risposta sbagliata. La risposta corretta è: ${this.exercise.correct_answer ? 'Vero' : 'Falso'}`
        };
    }

    reset() {
        document.querySelectorAll(`input[name="exercise_${this.exerciseId}"]`).forEach(input => {
            input.checked = false;
        });
    }
}

// 4. Open Text
class OpenTextRenderer extends ExerciseRenderer {
    renderContent() {
        const minWords = this.exercise.min_words || 10;
        return `
            <div class="open-text">
                <div class="alert alert-info mb-3">
                    <i class="fas fa-edit me-2"></i>
                    Minimo ${minWords} parole richieste
                    ${this.exercise.keywords && this.exercise.keywords.length > 0 ? 
                        `<br><strong>Parole chiave suggerite:</strong> ${this.exercise.keywords.join(', ')}` : ''}
                </div>
                <textarea class="form-control" id="textarea_${this.exerciseId}" rows="8" 
                          placeholder="Scrivi la tua risposta qui..."></textarea>
                <div class="form-text mt-2 d-flex justify-content-between">
                    <span><span id="wordCount_${this.exerciseId}">0</span> parole</span>
                    <span id="charCount_${this.exerciseId}">0 caratteri</span>
                </div>
                ${this.exercise.sample_answer ? `
                    <div class="mt-3">
                        <button type="button" class="btn btn-outline-info btn-sm" 
                                onclick="ExerciseManager.showSampleAnswer(${this.exerciseId})">
                            <i class="fas fa-eye me-2"></i>
                            Mostra esempio di risposta
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    evaluate() {
        const textArea = document.getElementById(`textarea_${this.exerciseId}`);
        
        if (!textArea) {
            return {
                isCorrect: false,
                feedback: 'Inserisci una risposta.'
            };
        }

        const userText = textArea.value.trim();
        const wordCount = userText.split(/\s+/).filter(word => word.length > 0).length;
        const minWords = this.exercise.min_words || 10;

        if (wordCount < minWords) {
            return {
                isCorrect: false,
                feedback: `Risposta troppo breve. Minimo ${minWords} parole richieste (${wordCount} inserite).`
            };
        }

        if (this.exercise.keywords && this.exercise.keywords.length > 0) {
            const containsKeywords = this.exercise.keywords.some(keyword =>
                userText.toLowerCase().includes(keyword.toLowerCase())
            );
            
            return {
                isCorrect: containsKeywords,
                feedback: containsKeywords ? 
                    'Risposta accettabile! Contiene le parole chiave rilevanti.' : 
                    `Risposta potrebbe essere migliorata. Prova a includere: ${this.exercise.keywords.join(', ')}`
            };
        }

        return {
            isCorrect: true,
            feedback: 'Risposta completata!'
        };
    }

    reset() {
        const textArea = document.getElementById(`textarea_${this.exerciseId}`);
        if (textArea) {
            textArea.value = '';
            // Trigger word count update
            const event = new Event('input');
            textArea.dispatchEvent(event);
        }
    }
}

// 5. Fill in Blank
class FillInBlankRenderer extends ExerciseRenderer {
    renderContent() {
        if (!this.exercise.blanks || !Array.isArray(this.exercise.blanks)) {
            return '<div class="alert alert-warning">Configurazione blanks mancante</div>';
        }

        let content = '<div class="fill-in-blank">';
        let questionWithBlanks = this.exercise.question;

        this.exercise.blanks.forEach((blank, index) => {
            const inputField = `<input type="text" class="form-control d-inline-block blank-input mx-2" 
                               id="blank_${this.exerciseId}_${index}" 
                               placeholder="..." 
                               style="width: 150px;">`;
            questionWithBlanks = questionWithBlanks.replace('_____', inputField);
        });

        content += `<div class="fs-5 lh-lg p-3 bg-light rounded">${questionWithBlanks}</div>`;
        content += '</div>';
        return content;
    }

    evaluate() {
        if (!this.exercise.blanks || !Array.isArray(this.exercise.blanks)) {
            return {
                isCorrect: false,
                feedback: 'Configurazione esercizio non valida.'
            };
        }

        let allBlanksCorrect = true;
        let correctCount = 0;

        this.exercise.blanks.forEach((blank, index) => {
            const input = document.getElementById(`blank_${this.exerciseId}_${index}`);
            if (input) {
                const userInput = input.value.trim();

                if (blank.correct_answers && Array.isArray(blank.correct_answers)) {
                    const isBlankCorrect = blank.correct_answers.some(answer =>
                        blank.case_sensitive ?
                            answer === userInput :
                            answer.toLowerCase() === userInput.toLowerCase()
                    );

                    if (isBlankCorrect) {
                        correctCount++;
                    } else {
                        allBlanksCorrect = false;
                    }
                }
            }
        });

        return {
            isCorrect: allBlanksCorrect,
            feedback: allBlanksCorrect ?
                'Tutti gli spazi sono stati completati correttamente!' :
                `${correctCount}/${this.exercise.blanks.length} spazi corretti.`
        };
    }

    reset() {
        this.exercise.blanks.forEach((blank, index) => {
            const input = document.getElementById(`blank_${this.exerciseId}_${index}`);
            if (input) {
                input.value = '';
            }
        });
    }
}

// 6. Matching
class MatchingRenderer extends ExerciseRenderer {
    renderContent() {
        if (!this.exercise.left_items || !this.exercise.right_items ||
            !Array.isArray(this.exercise.left_items) || !Array.isArray(this.exercise.right_items)) {
            return '<div class="alert alert-warning">Dati di abbinamento mancanti</div>';
        }

        const shuffledRightItems = this.shuffleArrayWithMapping(this.exercise.right_items);
        let content = `
            <div class="matching-exercise">
                <div class="alert alert-info mb-3">
                    <i class="fas fa-link me-2"></i>
                    Abbina ogni elemento della colonna sinistra con quello corretto della destra
                </div>
                <div class="row">
        `;

        this.exercise.left_items.forEach((leftItem, index) => {
            content += `
                <div class="col-12 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-6">
                                    <strong class="text-primary">${leftItem}</strong>
                                </div>
                                <div class="col-md-6">
                                    <select class="form-select" id="matching_${this.exerciseId}_${index}">
                                        <option value="">Seleziona una corrispondenza...</option>
            `;

            shuffledRightItems.forEach((rightItemData) => {
                content += `<option value="${rightItemData.originalIndex}">${rightItemData.value}</option>`;
            });

            content += `
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        content += '</div></div>';
        return content;
    }

    evaluate() {
        if (!this.exercise.left_items || !this.exercise.correct_matches) {
            return {
                isCorrect: false,
                feedback: 'Configurazione esercizio non valida.'
            };
        }

        let allMatchesCorrect = true;
        let correctCount = 0;

        this.exercise.left_items.forEach((item, index) => {
            const select = document.getElementById(`matching_${this.exerciseId}_${index}`);
            if (select && select.value !== '') {
                const selectedValue = parseInt(select.value);
                const correctMatch = this.exercise.correct_matches.find(match => match.left === index);

                if (correctMatch && correctMatch.right === selectedValue) {
                    correctCount++;
                } else {
                    allMatchesCorrect = false;
                }
            } else {
                allMatchesCorrect = false;
            }
        });

        return {
            isCorrect: allMatchesCorrect,
            feedback: allMatchesCorrect ?
                'Tutti gli abbinamenti sono corretti!' :
                `${correctCount}/${this.exercise.left_items.length} abbinamenti corretti.`
        };
    }

    reset() {
        this.exercise.left_items.forEach((item, index) => {
            const select = document.getElementById(`matching_${this.exerciseId}_${index}`);
            if (select) {
                select.value = '';
            }
        });
    }
}

// 7. Ordering
class OrderingRenderer extends ExerciseRenderer {
    renderContent() {
        if (!this.exercise.items || !Array.isArray(this.exercise.items)) {
            return '<div class="alert alert-warning">Elementi per ordinamento mancanti</div>';
        }

        const shuffledItems = this.shuffleArray([...this.exercise.items]);
        let content = `
            <div class="ordering-exercise">
                <div class="alert alert-info mb-3">
                    <i class="fas fa-sort me-2"></i>
                    Trascina gli elementi per ordinarli nella sequenza corretta
                </div>
                <ul class="sortable-list list-group" id="sortable_${this.exerciseId}">
        `;

        shuffledItems.forEach((item, displayIndex) => {
            const originalIndex = this.exercise.items.indexOf(item);
            content += `
                <li class="list-group-item sortable-item d-flex align-items-center" 
                    data-original-index="${originalIndex}">
                    <i class="fas fa-grip-vertical me-3 text-muted"></i>
                    <span class="flex-grow-1">${item}</span>
                    <span class="badge bg-secondary">${displayIndex + 1}</span>
                </li>
            `;
        });

        content += '</ul></div>';
        return content;
    }

    evaluate() {
        const sortableItems = document.querySelectorAll(`#sortable_${this.exerciseId} .sortable-item`);
        
        if (sortableItems.length === 0 || !this.exercise.correct_order) {
            return {
                isCorrect: false,
                feedback: 'Configurazione esercizio non valida.'
            };
        }

        const userOrder = Array.from(sortableItems).map(item =>
            parseInt(item.getAttribute('data-original-index'))
        );
        
        const isCorrect = JSON.stringify(userOrder) === JSON.stringify(this.exercise.correct_order);
        
        return {
            isCorrect,
            feedback: isCorrect ?
                'Ordine corretto!' :
                'Ordine non corretto. Prova a riorganizzare gli elementi.'
        };
    }

    reset() {
        // Re-shuffle the items
        const sortableList = document.getElementById(`sortable_${this.exerciseId}`);
        if (sortableList) {
            const items = Array.from(sortableList.children);
            const shuffled = this.shuffleArray(items);
            sortableList.innerHTML = '';
            shuffled.forEach((item, index) => {
                const badge = item.querySelector('.badge');
                if (badge) {
                    badge.textContent = (index + 1).toString();
                }
                sortableList.appendChild(item);
            });
        }
    }
}

// 8. Code Completion
class CodeCompletionRenderer extends ExerciseRenderer {
    renderContent() {
        if (!this.exercise.code_template || !this.exercise.blanks) {
            return '<div class="alert alert-warning">Template codice mancante</div>';
        }

        let content = `
            <div class="code-completion">
                <div class="alert alert-info mb-3">
                    <i class="fas fa-code me-2"></i>
                    Completa il codice inserendo i valori mancanti
                </div>
                <div class="code-editor bg-dark text-light p-3 rounded">
                    <pre class="mb-0"><code>
        `;

        let codeLines = this.exercise.code_template.split('\n');
        codeLines.forEach((line, lineIndex) => {
            if (line.includes('____')) {
                const blank = this.exercise.blanks.find(b => b.line === lineIndex);
                if (blank) {
                    const inputField = `<input type="text" class="code-input bg-secondary text-light border-0 rounded px-2" 
                                       id="code_${this.exerciseId}_${lineIndex}" 
                                       placeholder="..." 
                                       style="width: 100px;">`;
                    line = line.replace('____', inputField);
                }
            }
            content += line + '\n';
        });

        content += '</code></pre></div></div>';
        return content;
    }

    evaluate() {
        if (!this.exercise.blanks || !Array.isArray(this.exercise.blanks)) {
            return {
                isCorrect: false,
                feedback: 'Configurazione esercizio non valida.'
            };
        }

        let allCodeCorrect = true;
        let correctCount = 0;

        this.exercise.blanks.forEach(blank => {
            const input = document.getElementById(`code_${this.exerciseId}_${blank.line}`);
            if (input) {
                const userInput = input.value.trim();
                if (userInput === blank.correct_answer) {
                    correctCount++;
                } else {
                    allCodeCorrect = false;
                }
            }
        });

        return {
            isCorrect: allCodeCorrect,
            feedback: allCodeCorrect ?
                'Codice completato correttamente!' :
                `${correctCount}/${this.exercise.blanks.length} parti corrette.`
        };
    }

    reset() {
        this.exercise.blanks.forEach(blank => {
            const input = document.getElementById(`code_${this.exerciseId}_${blank.line}`);
            if (input) {
                input.value = '';
            }
        });
    }
}

// 9. Drag and Drop
class DragAndDropRenderer extends ExerciseRenderer {
    renderContent() {
        if (!this.exercise.draggable_items || !this.exercise.categories) {
            return '<div class="alert alert-warning">Configurazione drag-and-drop mancante</div>';
        }

        const shuffledItems = this.shuffleArray([...this.exercise.draggable_items]);
        let content = `
            <div class="drag-drop-exercise">
                <div class="alert alert-info mb-3">
                    <i class="fas fa-hand-rock me-2"></i>
                    Trascina gli elementi nelle categorie corrette
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h6 class="mb-0">Elementi da trascinare</h6>
                            </div>
                            <div class="card-body">
                                <div class="drag-items" id="dragItems_${this.exerciseId}">
        `;

        shuffledItems.forEach((item, displayIndex) => {
            const originalIndex = this.exercise.draggable_items.indexOf(item);
            content += `
                <div class="draggable-item btn btn-outline-primary m-1" 
                     draggable="true" 
                     data-item-index="${originalIndex}">
                    <i class="fas fa-grip-vertical me-2"></i>
                    ${item}
                </div>
            `;
        });

        content += `
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="categories-container">
        `;

        this.exercise.categories.forEach((category, catIndex) => {
            content += `
                <div class="card mb-3">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0">${category.name}</h6>
                    </div>
                    <div class="card-body">
                        <div class="drop-zone min-height-100 border-2 border-dashed rounded p-3" 
                             id="dropZone_${this.exerciseId}_${catIndex}"
                             data-category-index="${catIndex}">
                            <div class="drop-placeholder text-muted text-center">
                                <i class="fas fa-plus-circle fa-2x mb-2 d-block"></i>
                                Trascina qui gli elementi
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        content += '</div></div></div></div>';
        return content;
    }

    evaluate() {
        if (!this.exercise.categories || !Array.isArray(this.exercise.categories)) {
            return {
                isCorrect: false,
                feedback: 'Configurazione esercizio non valida.'
            };
        }

        let allCategoriesCorrect = true;
        let correctCount = 0;

        this.exercise.categories.forEach((category, catIndex) => {
            const dropZone = document.getElementById(`dropZone_${this.exerciseId}_${catIndex}`);
            if (dropZone && category.correct_items) {
                const itemsInCategory = dropZone.querySelectorAll('.draggable-item');
                const itemIndices = Array.from(itemsInCategory).map(item =>
                    parseInt(item.getAttribute('data-item-index'))
                ).sort();

                const correctItems = [...category.correct_items].sort();

                if (JSON.stringify(correctItems) === JSON.stringify(itemIndices)) {
                    correctCount++;
                } else {
                    allCategoriesCorrect = false;
                }
            }
        });

        return {
            isCorrect: allCategoriesCorrect,
            feedback: allCategoriesCorrect ?
                'Tutti gli elementi sono nella categoria corretta!' :
                `${correctCount}/${this.exercise.categories.length} categorie corrette.`
        };
    }

    reset() {
        // Move all items back to the original drag items container
        const dragItemsContainer = document.getElementById(`dragItems_${this.exerciseId}`);
        
        if (dragItemsContainer) {
            // Collect all draggable items from all drop zones
            this.exercise.categories.forEach((category, catIndex) => {
                const dropZone = document.getElementById(`dropZone_${this.exerciseId}_${catIndex}`);
                if (dropZone) {
                    const items = dropZone.querySelectorAll('.draggable-item');
                    items.forEach(item => {
                        dragItemsContainer.appendChild(item);
                    });
                    
                    // Show placeholder again
                    const placeholder = dropZone.querySelector('.drop-placeholder');
                    if (placeholder) {
                        placeholder.style.display = 'block';
                    }
                }
            });
        }
    }
}

// ===== FACTORY CLASS PER CREARE IL RENDERER GIUSTO =====
class ExerciseRendererFactory {
    static createRenderer(exercise, index) {
        const renderers = {
            'multiple_choice_single': MultipleChoiceSingleRenderer,
            'multiple_choice_multiple': MultipleChoiceMultipleRenderer,
            'true_false': TrueFalseRenderer,
            'open_text': OpenTextRenderer,
            'open_ended': OpenTextRenderer, // Alias per open_text
            'fill_in_blank': FillInBlankRenderer,
            'matching': MatchingRenderer,
            'ordering': OrderingRenderer,
            'code_completion': CodeCompletionRenderer,
            'drag_and_drop': DragAndDropRenderer
        };

        const RendererClass = renderers[exercise.type];
        
        if (!RendererClass) {
            console.warn(`Renderer not found for type: ${exercise.type}`);
            return null;
        }

        return new RendererClass(exercise, index);
    }
}

// ===== EXERCISE MANAGER - GESTISCE TUTTI I RENDERERS =====
class ExerciseManager {
    constructor() {
        this.renderers = new Map(); // Map exerciseId -> renderer instance
        this.exercises = [];
    }

    // Inizializza gli esercizi
    init(exercises) {
        this.exercises = exercises;
        this.renderers.clear();
        
        exercises.forEach((exercise, index) => {
            const renderer = ExerciseRendererFactory.createRenderer(exercise, index);
            if (renderer) {
                this.renderers.set(exercise.id, renderer);
            }
        });
    }

    // Renderizza tutti gli esercizi
    renderAll(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = '';

        this.renderers.forEach(renderer => {
            const element = renderer.createContainer();
            container.appendChild(element);
        });

        // Re-initialize any necessary event listeners
        this.initializeEventListeners();
    }

    // Renderizza un singolo esercizio
    renderExercise(exerciseId) {
        const renderer = this.renderers.get(exerciseId);
        if (!renderer) {
            console.error(`Renderer not found for exercise ${exerciseId}`);
            return null;
        }

        return renderer.createContainer();
    }

    // Valuta la risposta di un esercizio
    checkAnswer(exerciseId, buttonElement) {
        const renderer = this.renderers.get(exerciseId);
        if (!renderer) {
            console.error(`Renderer not found for exercise ${exerciseId}`);
            return;
        }

        const result = renderer.evaluate();
        this.showFeedback(exerciseId, result.isCorrect, result.feedback, buttonElement);

        // Show explanation if available
        if (result.isCorrect || (!window.examMode)) {
            this.showExplanation(exerciseId);
        }

        // Trigger any callbacks
        if (this.onAnswerChecked) {
            this.onAnswerChecked(exerciseId, result.isCorrect);
        }
    }

    // Resetta un esercizio
    resetExercise(exerciseId) {
        const renderer = this.renderers.get(exerciseId);
        if (!renderer) {
            console.error(`Renderer not found for exercise ${exerciseId}`);
            return;
        }

        renderer.reset();

        // Reset feedback
        const feedbackDiv = document.getElementById(`feedback_${exerciseId}`);
        if (feedbackDiv) {
            feedbackDiv.style.display = 'none';
        }

        const explanationDiv = document.getElementById(`explanation_${exerciseId}`);
        if (explanationDiv) {
            explanationDiv.style.display = 'none';
        }

        // Reset button
        const button = document.querySelector(`[onclick*="checkAnswer(${exerciseId}"]`);
        if (button) {
            button.className = 'btn btn-primary check-answer';
            button.innerHTML = '<i class="fas fa-check me-2"></i>Controlla Risposta';
            button.disabled = false;
        }

        this.showToast('info', 'Esercizio resettato');
    }

    // Resetta tutti gli esercizi
    resetAllExercises() {
        this.renderers.forEach((renderer, exerciseId) => {
            this.resetExercise(exerciseId);
        });
    }

    // Mostra feedback
    showFeedback(exerciseId, isCorrect, feedback, buttonElement) {
        const feedbackDiv = document.getElementById(`feedback_${exerciseId}`);
        if (!feedbackDiv) return;

        const alertClass = isCorrect ? 'alert-success' : 'alert-danger';
        const icon = isCorrect ? 'fa-check-circle' : 'fa-times-circle';

        feedbackDiv.innerHTML = `
            <div class="alert ${alertClass} d-flex align-items-center">
                <i class="fas ${icon} fa-lg me-3"></i>
                <div>
                    <strong>${isCorrect ? 'Corretto!' : 'Non corretto'}</strong>
                    <div class="mt-1">${feedback}</div>
                </div>
            </div>
        `;

        feedbackDiv.style.display = 'block';

        // Update button
        if (buttonElement) {
            buttonElement.className = `btn ${isCorrect ? 'btn-success' : 'btn-danger'} check-answer`;
            buttonElement.innerHTML = `
                <i class="fas ${isCorrect ? 'fa-check' : 'fa-times'} me-2"></i>
                ${isCorrect ? 'Corretto!' : 'Sbagliato'}
            `;
            buttonElement.disabled = true;
        }
    }

    // Mostra spiegazione
    showExplanation(exerciseId) {
        const explanationDiv = document.getElementById(`explanation_${exerciseId}`);
        if (explanationDiv) {
            explanationDiv.style.display = 'block';
        }
    }

    // Mostra suggerimento
    showHint(exerciseId) {
        const renderer = this.renderers.get(exerciseId);
        if (!renderer || !renderer.exercise.hint) {
            this.showToast('warning', 'Nessun suggerimento disponibile per questo esercizio.');
            return;
        }

        // Create and show modal with hint
        const modal = this.createInfoModal('Suggerimento', renderer.exercise.hint);
        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    // Mostra esempio di risposta (per open text)
    showSampleAnswer(exerciseId) {
        const renderer = this.renderers.get(exerciseId);
        if (!renderer || !renderer.exercise.sample_answer) {
            this.showToast('warning', 'Nessun esempio di risposta disponibile');
            return;
        }

        const modal = this.createInfoModal(
            `Esempio di risposta - Esercizio ${exerciseId}`,
            `<div class="alert alert-info">
                <strong>Esempio di risposta completa:</strong><br><br>
                <div class="border-start border-primary border-3 ps-3">
                    ${renderer.exercise.sample_answer}
                </div>
            </div>`
        );

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    // Inizializza event listeners
    initializeEventListeners() {
        // Setup word counters for open text
        this.setupWordCounters();
        
        // Setup drag and drop
        setTimeout(() => {
            this.initializeDragAndDrop();
            this.initializeSortable();
        }, 100);
    }

    // Setup word counters
    setupWordCounters() {
        document.querySelectorAll('textarea[id^="textarea_"]').forEach(textarea => {
            const exerciseId = textarea.id.replace('textarea_', '');
            const wordCountSpan = document.getElementById(`wordCount_${exerciseId}`);
            const charCountSpan = document.getElementById(`charCount_${exerciseId}`);

            function updateCounts() {
                const text = textarea.value.trim();
                const words = text ? text.split(/\s+/).filter(word => word.length > 0) : [];

                if (wordCountSpan) wordCountSpan.textContent = words.length;
                if (charCountSpan) charCountSpan.textContent = text.length;
            }

            textarea.addEventListener('input', updateCounts);
            updateCounts(); // Initial count
        });
    }

    // Initialize drag and drop
    initializeDragAndDrop() {
        document.querySelectorAll('.draggable-item').forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
        });

        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.addEventListener('dragover', (e) => this.handleDragOver(e));
            zone.addEventListener('drop', (e) => this.handleDrop(e));
            zone.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            zone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });

        // Also allow dragging back to the original container
        document.querySelectorAll('.drag-items').forEach(container => {
            container.addEventListener('dragover', (e) => this.handleDragOver(e));
            container.addEventListener('drop', (e) => this.handleDropToOriginal(e));
        });
    }

    handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('drop-zone')) {
            e.target.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        if (e.target.classList.contains('drop-zone')) {
            e.target.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        if (e.target.classList.contains('drop-zone')) {
            e.target.classList.remove('drag-over');

            const draggingElement = document.querySelector('.dragging');
            if (draggingElement) {
                const placeholder = e.target.querySelector('.drop-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                e.target.appendChild(draggingElement);
            }
        }
    }

    handleDropToOriginal(e) {
        e.preventDefault();
        const draggingElement = document.querySelector('.dragging');
        if (draggingElement && e.currentTarget.classList.contains('drag-items')) {
            e.currentTarget.appendChild(draggingElement);
        }
    }

    // Initialize sortable
    initializeSortable() {
        if (typeof Sortable !== 'undefined') {
            document.querySelectorAll('.sortable-list').forEach(list => {
                new Sortable(list, {
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    chosenClass: 'sortable-chosen',
                    dragClass: 'sortable-drag'
                });
            });
        }
    }

    // Utility methods
    createInfoModal(title, content) {
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

    showToast(type, message) {
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

    // Get renderer by exercise ID
    getRenderer(exerciseId) {
        return this.renderers.get(exerciseId);
    }

    // Get all renderers
    getAllRenderers() {
        return this.renderers;
    }
}

// ===== INIZIALIZZAZIONE GLOBALE =====
// Crea un'istanza globale del manager
window.ExerciseManager = new ExerciseManager();

// Esempio di utilizzo:
/*
// Inizializza con gli esercizi
ExerciseManager.init(exercises);

// Renderizza tutti gli esercizi in un container
ExerciseManager.renderAll('exercise-content');

// Oppure renderizza un singolo esercizio
const exerciseElement = ExerciseManager.renderExercise(1);
document.getElementById('container').appendChild(exerciseElement);

// Imposta callback per quando viene controllata una risposta
ExerciseManager.onAnswerChecked = (exerciseId, isCorrect) => {
    console.log(`Exercise ${exerciseId} answered: ${isCorrect}`);
    // Update stats, progress, etc.
};
*/