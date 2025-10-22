const express = require('express');
const app = express();

// Imposta EJS come motore di visualizzazione
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware per servire file statici
app.use(express.static('public'));

// Route per la pagina principale
app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
});

// Route per una lista
app.get('/list', (req, res) => {
    res.render('list', { title: 'Study' });
});

// Route per la pagina degli esercizi
app.get('/exercise', (req, res) => {
    res.render('exercise', { title: req.params.course });
});

// Route per la creazione degli esercizi
app.get('/crea', (req, res) => {
    res.render('crea', { title: req.params.course });
});

app.use('/scripts', express.static('scripts'));

// Avvia il server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
