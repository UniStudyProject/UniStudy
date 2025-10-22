const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

// Crea la cartella dist se non esiste
const distDir = './dist';
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Copia i file statici (CSS, JS, immagini)
const copyDirectory = (src, dest) => {
    if (!fs.existsSync(src)) {
        console.log(`⚠️  Cartella ${src} non trovata, skip...`);
        return;
    }

    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
};

// Copia tutti i file statici
console.log('📁 Copiando file statici...');

// Dalla cartella public (se esiste)
if (fs.existsSync('./public')) {
    const publicEntries = fs.readdirSync('./public', { withFileTypes: true });
    for (const entry of publicEntries) {
        const srcPath = path.join('./public', entry.name);
        const destPath = path.join('./dist', entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
    console.log('✅ Copiati file da public/');
}

// Copia cartelle aggiuntive se esistono
if (fs.existsSync('./styles')) {
    copyDirectory('./styles', './dist/styles');
    console.log('✅ Copiati file da styles/');
}

if (fs.existsSync('./scripts')) {
    copyDirectory('./scripts', './dist/scripts');
    console.log('✅ Copiati file da scripts/');
}

// Dati per i template
const templateData = {
    title: 'Sistema Esercizi Interattivi'
};

// Leggi il partial della navbar
const navbarPath = './views/partials/navbar.ejs';
let navbarHtml = '';
if (fs.existsSync(navbarPath)) {
    navbarHtml = fs.readFileSync(navbarPath, 'utf8');
    // Converti i link relativi per GitHub Pages
    navbarHtml = navbarHtml.replace(/href="\/([^"]*?)"/g, (match, path) => {
        if (path === '' || path === '/') return 'href="index.html"';
        if (path.includes('.')) return match; // Già un file
        return `href="${path}.html"`;
    });
    console.log('✅ Navbar caricata');
} else {
    console.log('⚠️  Navbar non trovata, continuo senza...');
}

// Funzione per processare un template EJS
const processTemplate = (templateName, outputName, data = {}) => {
    const templatePath = `./views/${templateName}.ejs`;
    const outputPath = `./dist/${outputName}.html`;

    if (!fs.existsSync(templatePath)) {
        console.log(`⚠️  Template ${templateName}.ejs non trovato`);
        return;
    }

    try {
        // Leggi il template
        let template = fs.readFileSync(templatePath, 'utf8');

        // Sostituisci gli include della navbar con l'HTML statico
        template = template.replace(/<%- include\('partials\/navbar'\) %>/g, navbarHtml);
        template = template.replace(/<%- include\("partials\/navbar"\) %>/g, navbarHtml);

        // Aggiungi i dati del template
        const mergedData = { ...templateData, ...data };

        // Renderizza il template
        const html = ejs.render(template, mergedData);

        // Aggiusta i path per GitHub Pages
        let processedHtml = html;

        // Correggi i link interni
        processedHtml = processedHtml.replace(/href="\/([^"]*?)"/g, (match, path) => {
            if (path === '' || path === '/') return 'href="index.html"';
            if (path.includes('.')) return match; // Già un file completo
            return `href="${path}.html"`;
        });

        // Correggi i link relativi
        processedHtml = processedHtml.replace(/href="\.\/([^"]*?)"/g, (match, path) => {
            if (path.includes('.')) return match; // Già un file
            return `href="${path}.html"`;
        });

        // Correggi i path delle risorse statiche
        processedHtml = processedHtml.replace(/src="\/([^"]*?)"/g, 'src="$1"');
        processedHtml = processedHtml.replace(/href="\/styles\//g, 'href="styles/');
        processedHtml = processedHtml.replace(/src="\/scripts\//g, 'src="scripts/');

        // Scrivi il file HTML
        fs.writeFileSync(outputPath, processedHtml);
        console.log(`✅ Generato: ${outputName}.html`);

    } catch (error) {
        console.error(`❌ Errore nel processare ${templateName}:`, error.message);
    }
};

// Aggiorna le funzioni di navigazione JavaScript - VERSIONE MIGLIORATA
const updateNavigationFunctions = () => {
    console.log('\n🔧 Aggiornando funzioni di navigazione JavaScript...');

    const jsFiles = [
        './dist/scripts/main.js',
        './dist/scripts/exercise-enhanced.js',
        './dist/scripts/crea.js',
        './dist/main.js'
    ];

    let updatedFiles = 0;

    for (const jsPath of jsFiles) {
        if (fs.existsSync(jsPath)) {
            let jsContent = fs.readFileSync(jsPath, 'utf8');
            let hasChanges = false;

            // Pattern 1: window.location.href = '/path'
            const pattern1 = /window\.location\.href\s*=\s*['"]\/([^'"]*)['"]/g;
            jsContent = jsContent.replace(pattern1, (match, path) => {
                hasChanges = true;
                if (path === '' || path === '/') return `window.location.href = 'index.html'`;
                if (path.includes('.')) return match;
                return `window.location.href = '${path}.html'`;
            });

            // Pattern 2: window.location.href = './path'
            const pattern2 = /window\.location\.href\s*=\s*['"]\.\/([^'"]*)['"]/g;
            jsContent = jsContent.replace(pattern2, (match, path) => {
                hasChanges = true;
                if (path === '' || path === '/') return `window.location.href = 'index.html'`;
                if (path.includes('.')) return match;
                return `window.location.href = '${path}.html'`;
            });

            // Pattern 3: Specifici per exercise e crea (senza leading slash)
            const pattern3 = /window\.location\.href\s*=\s*['"]([^'"\/\.]*)['"]/g;
            jsContent = jsContent.replace(pattern3, (match, path) => {
                // Solo se è uno dei nostri path conosciuti
                if (['exercise', 'crea', 'list'].includes(path)) {
                    hasChanges = true;
                    return `window.location.href = '${path}.html'`;
                }
                return match;
            });

            // Pattern 4: Funzioni specifiche per goToBuilder
            jsContent = jsContent.replace(
                /window\.location\.href\s*=\s*['"]\/crea['"]/g,
                "window.location.href = 'crea.html'"
            );

            // Pattern 5: Funzioni specifiche per exercise
            jsContent = jsContent.replace(
                /window\.location\.href\s*=\s*['"]\.\/exercise['"]/g,
                "window.location.href = 'exercise.html'"
            );

            // Pattern 6: Controlli condizionali per localhost vs GitHub Pages
            const conditionalPattern = /if\s*\(\s*window\.location\.hostname\s*===\s*['"]localhost['"][^}]+window\.location\.href\s*=\s*['"]\/([^'"]*)['"]/g;
            jsContent = jsContent.replace(conditionalPattern, (match, path) => {
                hasChanges = true;
                const htmlPath = path.includes('.') ? path : `${path}.html`;
                return match.replace(`'/${path}'`, `'${htmlPath}'`);
            });

            if (hasChanges) {
                fs.writeFileSync(jsPath, jsContent);
                console.log(`✅ Aggiornato: ${path.basename(jsPath)}`);
                updatedFiles++;
            }
        }
    }

    if (updatedFiles === 0) {
        console.log('ℹ️  Nessun file JavaScript trovato da aggiornare');
    } else {
        console.log(`✅ Aggiornati ${updatedFiles} file JavaScript`);
    }
};

// Processa tutti i template
console.log('\n📄 Processando template EJS...');
processTemplate('index', 'index');
processTemplate('exercise', 'exercise');
processTemplate('crea', 'crea');
processTemplate('list', 'list');

// Aggiorna le funzioni di navigazione JavaScript
updateNavigationFunctions();

// Crea un file .nojekyll per GitHub Pages
fs.writeFileSync('./dist/.nojekyll', '');
console.log('✅ Creato file .nojekyll');

// Crea un file README per la cartella dist
const readmeContent = `# Sistema Esercizi Interattivi - Build Statico

Questa cartella contiene i file statici generati per il deployment su GitHub Pages.

## File generati:
- \`index.html\` - Homepage principale
- \`exercise.html\` - Pagina per svolgere gli esercizi
- \`crea.html\` - Pagina per creare nuovi esercizi
- \`list.html\` - Pagina con le liste degli esercizi disponibili

## Cartelle:
- \`styles/\` - File CSS
- \`scripts/\` - File JavaScript (con percorsi aggiornati per GitHub Pages)

Generato automaticamente da build.js il ${new Date().toLocaleString('it-IT')}
`;

fs.writeFileSync('./dist/README.md', readmeContent);
console.log('✅ Creato README.md');

console.log('\n🎉 Build completato! I file sono nella cartella ./dist');
console.log('\n📁 Struttura generata:');
console.log('dist/');
console.log('├── index.html');
console.log('├── exercise.html');
console.log('├── crea.html');
console.log('├── list.html');
if (fs.existsSync('./dist/styles')) console.log('├── styles/');
if (fs.existsSync('./dist/scripts')) console.log('├── scripts/');
console.log('├── .nojekyll');
console.log('└── README.md');

console.log('\n🚀 Pronto per il deployment su GitHub Pages!');
console.log('📝 Assicurati di pushare la cartella dist o configurare GitHub Actions.');