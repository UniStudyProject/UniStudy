
    // === 1. DATABASE CORSI (JSON) ===
    const coursesData = {
        "year-1": [
            { name: "Analisi", cfu: 12, desc: "Esercizi su limiti, derivate, integrali e serie numeriche", ex: 150, time: "~3h", diff: "Medio-Alta" },
            { name: "Architettura degli elaboratori", cfu: 9, desc: "Assembly, architetture RISC/CISC, memoria e cache", ex: 120, time: "~2.5h", diff: "Alta" },
            { name: "Fondamenti dell'Informatica", cfu: 9, desc: "Logica booleana, macchine di Turing, complessità computazionale", ex: 100, time: "~2h", diff: "Media" },
            { name: "Matematica Discreta", cfu: 12, desc: "Teoria dei grafi, algebra lineare, geometria analitica", ex: 180, time: "~4h", diff: "Alta" },
            { name: "Programmazione I", cfu: 9, desc: "Fondamenti di C, strutture dati base, algoritmi elementari", ex: 200, time: "~3h", diff: "Media" },
            { name: "Programmazione II", cfu: 9, desc: "Java base, OOP introduttiva, collezioni e generics", ex: 180, time: "~3h", diff: "Media" },
            { name: "Ricerca Operativa", cfu: 6, desc: "Programmazione lineare, simplesso, problemi di ottimizzazione", ex: 90, time: "~2h", diff: "Alta" }
        ],
        "year-2": [
            { name: "Algoritmi e Strutture Dati", cfu: 12, desc: "Alberi, grafi, algoritmi di ordinamento e ricerca", ex: 250, time: "~4h", diff: "Alta" },
            { name: "Basi di Dati", cfu: 9, desc: "SQL, modello ER, normalizzazione, transazioni", ex: 160, time: "~3h", diff: "Media" },
            { name: "Sistemi Operativi", cfu: 9, desc: "Processi, thread, scheduling, memoria virtuale", ex: 140, time: "~2.5h", diff: "Alta" },
            { name: "Diritto e Privacy per l'Informatica", cfu: 6, desc: "Normative GDPR, protezione dati, aspetti legali", ex: 80, time: "~1.5h", diff: "Bassa" },
            { name: "Economia e Gestione dell'Impresa", cfu: 6, desc: "Business model, analisi costi-ricavi, gestione progetti IT", ex: 70, time: "~1.5h", diff: "Bassa" },
            { name: "Elementi di Probabilità e Statistica", cfu: 6, desc: "Distribuzioni, test ipotesi, analisi dati con R/Python", ex: 120, time: "~2.5h", diff: "Media" },
            { name: "Fisica", cfu: 6, desc: "Meccanica classica, elettromagnetismo, fisica moderna", ex: 100, time: "~2h", diff: "Media" },
            { name: "Logica Matematica", cfu: 6, desc: "Teoremi di incompletezza, logica proposizionale", ex: 90, time: "~2h", diff: "Alta" },
            { name: "Principi di Programmazione Orientata agli Oggetti", cfu: 9, desc: "Design pattern, UML, Java/C++ avanzato", ex: 180, time: "~3.5h", diff: "Alta" }
        ],
        "year-3": [
            { name: "Blockchain", cfu: 6, desc: "Smart contract, Ethereum, crittografia per blockchain", ex: 100, time: "~2h", diff: "Alta" },
            { name: "Calcolabilità e Complessità", cfu: 6, desc: "Classi P/NP, macchine di Turing, riducibilità", ex: 90, time: "~2h", diff: "Alta" },
            { name: "Cybersecurity", cfu: 6, desc: "Crittografia, attacchi informatici, sicurezza delle reti", ex: 130, time: "~2.5h", diff: "Alta" },
            { name: "Economia e Gestione delle Tecnologie Emergenti", cfu: 6, desc: "Innovazione tecnologica, startup, analisi di mercato", ex: 70, time: "~1.5h", diff: "Bassa" },
            { name: "Human-Computer Interaction", cfu: 6, desc: "Usabilità, design UI/UX, prototipazione", ex: 80, time: "~1.5h", diff: "Media" },
            { name: "Linguaggi e Paradigmi di Programmazione", cfu: 6, desc: "Programmazione funzionale, logica, concorrente", ex: 110, time: "~2h", diff: "Alta" },
            { name: "Linguaggi Formali e Traduttori", cfu: 9, desc: "Grammatiche, automi, compilatori (Lex/Yacc)", ex: 150, time: "~3h", diff: "Alta" },
            { name: "Logica per l'Informatica", cfu: 6, desc: "Logica modale, dimostrazioni automatiche, applicazioni in IA", ex: 90, time: "~2h", diff: "Alta" },
            { name: "Metodi Formali dell'Informatica", cfu: 6, desc: "Verifica formale, model checking, specifiche temporali", ex: 100, time: "~2h", diff: "Alta" },
            { name: "Metodi Numerici", cfu: 6, desc: "Approssimazione, interpolazione, risoluzione numerica", ex: 120, time: "~2.5h", diff: "Media" },
            { name: "Metodologie e Tecnologie Didattiche per l'Informatica", cfu: 6, desc: "Didattica dell'informatica, strumenti per l'insegnamento", ex: 60, time: "~1h", diff: "Bassa" },
            { name: "Problem Solving Avanzato", cfu: 6, desc: "Algoritmi competitivi, ottimizzazione, coding challenges", ex: 200, time: "~4h", diff: "Alta" },
            { name: "Programmazione III", cfu: 6, desc: "Sviluppo web full-stack, framework moderni (React, Node.js)", ex: 160, time: "~3h", diff: "Media" },
            { name: "Reti e Sicurezza delle Reti", cfu: 12, desc: "Protocolli TCP/IP, firewall, crittografia di rete", ex: 180, time: "~3.5h", diff: "Alta" },
            { name: "Sistemi Informativi", cfu: 6, desc: "ERP, CRM, gestione dati aziendali", ex: 70, time: "~1.5h", diff: "Bassa" },
            { name: "Sistemi Intelligenti", cfu: 6, desc: "Intelligenza artificiale, machine learning, reti neurali", ex: 140, time: "~3h", diff: "Alta" },
            { name: "Storia dell'Informatica", cfu: 6, desc: "Evoluzione dei computer, figure storiche, innovazioni", ex: 50, time: "~1h", diff: "Bassa" },
            { name: "Sviluppo delle Applicazioni Software", cfu: 6, desc: "Ingegneria del software, testing, DevOps", ex: 130, time: "~2.5h", diff: "Media" },
            { name: "Tecnologie Web", cfu: 6, desc: "HTML/CSS/JS avanzato, framework frontend, API REST", ex: 150, time: "~3h", diff: "Media" }
        ],
        "vo": [
            { name: "Linguaggi e Sistemi", cfu: 12, desc: "Teoria dei linguaggi formali, sistemi operativi avanzati", ex: 180, time: "~3.5h", diff: "Alta" },
            { name: "Informazione e Conoscenza", cfu: 9, desc: "Basi di dati avanzate, ontologie, gestione conoscenza", ex: 140, time: "~2.5h", diff: "Media" },
            { name: "Reti e Sistemi", cfu: 12, desc: "Reti di calcolatori, protocolli avanzati, sicurezza", ex: 200, time: "~4h", diff: "Alta" },
            { name: "Interazione Uomo Macchina e Tecnologie Web", cfu: 9, desc: "Usabilità, design di interfacce, sviluppo web", ex: 160, time: "~3h", diff: "Media" },
            { name: "Reti (6 CFU)", cfu: 6, desc: "Fondamenti di reti: modello OSI, TCP/IP, routing", ex: 100, time: "~2h", diff: "Media" },
            { name: "Reti (12 CFU)", cfu: 12, desc: "Reti avanzate: protocolli applicativi, sicurezza, QoS", ex: 180, time: "~3.5h", diff: "Alta" },
            { name: "Interazione Uomo Macchina (9 CFU IUM)", cfu: 9, desc: "Progettazione interfacce, accessibilità, valutazione", ex: 120, time: "~2.5h", diff: "Media" }
        ]
    };

    // === 2. MATERIE ATTIVE (Le altre saranno "Coming Soon") ===
    const activeSubjects = [
        "Analisi", 
        "Programmazione I",
        "Sistemi Intelligenti",

        // Aggiungi qui le materie pronte...
    ];

    // === 3. FUNZIONE DI RENDERING ===
    function renderAllCourses() {
        // Mappa gli ID dell'HTML alle chiavi del JSON
        const sections = {
            "container-year-1": { data: coursesData["year-1"], badge: "badge-year-1" },
            "container-year-2": { data: coursesData["year-2"], badge: "badge-year-2" },
            "container-year-3": { data: coursesData["year-3"], badge: "badge-year-3" },
            "container-vo":     { data: coursesData["vo"],     badge: "badge-vo" }
        };

        for (const [containerId, info] of Object.entries(sections)) {
            const container = document.getElementById(containerId);
            const badgeElement = document.getElementById(info.badge);
            
            if (!container) continue; // Salta se non trova il container

            // Aggiorna badge numero materie
            if (badgeElement) badgeElement.innerText = `${info.data.length} materie`;

            let htmlBuffer = "";

            info.data.forEach(course => {
                // Sanitizza il nome per le chiamate JS (gestione apostrofi)
                const safeName = course.name.replace(/'/g, "\\'");
                
                // Determina se è coming soon o attiva
                // Se è nella lista activeSubjects NON aggiunge la classe, altrimenti SI
                const comingSoonClass = activeSubjects.includes(course.name) ? "" : "coming-soon";

                htmlBuffer += `
                <div class="col-lg-6">
                    <div class="exercise-card ${comingSoonClass}" data-subject="${course.name}">
                        <div class="card-header">
                            <h3>${course.name}</h3>
                            <span class="badge bg-info">${course.cfu} CFU</span>
                        </div>
                        <div class="card-body">
                            <p class="card-description">${course.desc}</p>
                            <div class="exercise-stats">
                                <span><i class="fas fa-tasks"></i> ${course.ex} esercizi</span>
                                <span><i class="fas fa-clock"></i> ${course.time}</span>
                                <span><i class="fas fa-signal"></i> ${course.diff}</span>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button class="btn btn-success btn-action" onclick="playExercises('${safeName}')">
                                <i class="fas fa-play me-2"></i>Inizia
                            </button>
                            <button class="btn btn-primary btn-action" onclick="downloadExercises('${safeName}')">
                                <i class="fas fa-download me-2"></i>Scarica
                            </button>
                        </div>
                    </div>
                </div>`;
            });

            container.innerHTML = htmlBuffer;
        }
    }

    // === 4. ESECUZIONE ===
    document.addEventListener('DOMContentLoaded', () => {
        renderAllCourses();
    });

    // === 5. LOGICA FILTRI ===

    // Funzione principale di filtraggio
    function filterContent() {
        const searchText = document.getElementById('searchExercises').value.toLowerCase();
        const yearValue = document.getElementById('yearFilter').value;

        // Mappatura per gestire il valore "old" che nel div corrisponde a "vecchio-ordinamento"
        const yearMap = { 'old': 'vecchio-ordinamento' };
        const targetYear = yearMap[yearValue] || yearValue;

        // Seleziona tutte le sezioni degli anni
        const sections = document.querySelectorAll('.year-section');
        let totalVisibleCards = 0;

        sections.forEach(section => {
            const sectionYear = section.getAttribute('data-year');
            
            // 1. Controllo Anno: La sezione corrisponde all'anno selezionato?
            // (Se yearValue è vuoto, mostra tutti gli anni)
            const yearMatch = (yearValue === "" || sectionYear == targetYear);

            if (!yearMatch) {
                // Se l'anno non corrisponde, nascondi l'intera sezione
                section.style.display = 'none';
            } else {
                // 2. Controllo Ricerca: Se l'anno è giusto, filtriamo le card al suo interno
                const cards = section.querySelectorAll('.exercise-card');
                let visibleCardsInSection = 0;

                cards.forEach(card => {
                    const title = card.getAttribute('data-subject').toLowerCase();
                    // Risaliamo al div col-lg-6 genitore per nascondere l'intera colonna
                    const parentCol = card.closest('.col-lg-6');

                    if (title.includes(searchText)) {
                        parentCol.style.display = ''; // Mostra
                        visibleCardsInSection++;
                        totalVisibleCards++;
                    } else {
                        parentCol.style.display = 'none'; // Nascondi
                    }
                });

                // Mostra la sezione solo se contiene almeno una card visibile dopo la ricerca
                // (oppure se non stiamo cercando nulla e l'anno corrisponde)
                if (visibleCardsInSection > 0) {
                    section.style.display = 'block';
                    section.classList.add('fadeInUp'); // Ri-trigger animazione (opzionale)
                } else {
                    section.style.display = 'none';
                }
            }
        });

        // (Opzionale) Gestione "Nessun risultato trovato"
        // Potresti aggiungere un div nell'HTML con id="no-results" e mostrarlo qui se totalVisibleCards === 0
    }

    // Event Listeners per attivare il filtro mentre scrivi o cambi selezione
    document.getElementById('searchExercises').addEventListener('keyup', filterContent);
    document.getElementById('yearFilter').addEventListener('change', filterContent);

    // === 6. FUNZIONE RESET ===
    // Deve essere globale (window) per essere chiamata dall'onclick nel button HTML
    window.resetFilters = function() {
        document.getElementById('searchExercises').value = "";
        document.getElementById('yearFilter').value = "";
        
        // Resetta la visualizzazione chiamando la funzione filtro
        filterContent();
        
        // Feedback visivo opzionale (toast)
        if(typeof bootstrap !== 'undefined') {
            // Se vuoi mostrare un toast di conferma
            // showToast("Filtri resettati con successo");
        }
    };

// ==========================================
// FUNZIONE INIZIA (Modificata per leggere i file reali)
// ==========================================
window.playExercises = async function(subject) {
    // 1. Crea il nome del file basato sul nome della materia
    // Esempio: "Sistemi Intelligenti" -> "sistemi intelligenti.json"
    // Nota: Assicurati che i file nella cartella media siano tutti in minuscolo!
    const fileName = subject.toLowerCase() + '.json';
    const filePath = `media/${fileName}`; // Percorso relativo per GitHub Pages

    // Mostra un feedback visivo (opzionale, cursore di attesa)
    document.body.style.cursor = 'wait';

    try {
        // 2. Prova a scaricare il file JSON reale
        const response = await fetch(filePath);

        let exerciseData;

        if (response.ok) {
            // CASO A: Il file ESISTE! Lo usiamo.
            console.log(`File trovato: ${filePath}`);
            exerciseData = await response.json();
        } else {
            // CASO B: Il file NON esiste (404). Usiamo i dati di prova.
            console.warn(`File non trovato (${filePath}), uso dati generati.`);
            exerciseData = generateSampleData(subject);
        }

        // 3. Salva i dati in sessionStorage per la pagina degli esercizi
        startExerciseSession(exerciseData);

    } catch (error) {
        console.error("Errore durante il caricamento:", error);
        // In caso di errore grave, fallback sui dati generati
        const fallbackData = generateSampleData(subject);
        startExerciseSession(fallbackData);
    } finally {
        document.body.style.cursor = 'default';
    }
};

// Funzione helper per avviare la sessione
function startExerciseSession(data) {
    try {
        sessionStorage.setItem('exerciseData', JSON.stringify(data));
        sessionStorage.setItem('exerciseDataLoaded', 'true');
        
        // Vai alla pagina degli esercizi
        window.location.href = 'exercise.html';
    } catch (e) {
        alert("Errore: Impossibile salvare i dati (Memoria piena o file troppo grande).");
        console.error(e);
    }
}