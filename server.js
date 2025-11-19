const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.engine('handlebars', exphbs.engine({ defaultLayout: false}));
app.set('view engine', 'handlebars');
app.set('views', './views');

// Dados iniciais
let materiaisEscolares = [
    { id: 1, nome: "Caderno 10 matérias", quantidade: 50, preco: 15.90 },
    { id: 2, nome: "Lápis HB", quantidade: 200, preco: 1.50 },
    { id: 3, nome: "Borracha branca", quantidade: 100, preco: 2.00 },
];

let professores = [
    { id: 1, nome: "Maria Silva", disciplina: "Matemática", email: "maria@escola.com" },
    { id: 2, nome: "João Santos", disciplina: "Português", email: "joao@escola.com" },
    { id: 3, nome: "Ana Costa", disciplina: "História", email: "ana@escola.com" },
];

let turmas = [
    { id: 1, nome: "3º Ano A", turno: "Manhã", capacidade: 30 },
    { id: 2, nome: "4º Ano B", turno: "Tarde", capacidade: 28 },
    { id: 3, nome: "5º Ano C", turno: "Manhã", capacidade: 32 },
];

// Rota principal
app.get('/', (req, res) => res.render('home'));

// ========== CRUD MATERIAIS ESCOLARES ==========
app.get('/materiais', (req, res) => {
    res.render('listarMateriais', { materiais: materiaisEscolares });
});

app.get('/materiais/novo', (req, res) => res.render('cadastrarMaterial'));

app.get('/materiais/ver/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const material = materiaisEscolares.find(m => m.id === id);
    if (!material) return res.status(404).send('Material não encontrado');
    res.render('detalharMaterial', { material });
});

app.get('/materiais/:id/editar', (req, res) => {
    const id = parseInt(req.params.id);
    const material = materiaisEscolares.find(m => m.id === id);
    if (!material) return res.status(404).send('Material não encontrado');
    res.render('editarMaterial', { material });
});

app.post('/materiais', (req, res) => {
    const { nome, quantidade, preco } = req.body;
    const novoMaterial = { 
        id: materiaisEscolares.length + 1, 
        nome, 
        quantidade: parseInt(quantidade), 
        preco: parseFloat(preco) 
    };
    materiaisEscolares.push(novoMaterial);
    res.redirect('/materiais');
});

app.post('/materiais/:id/editar', (req, res) => {
    const id = parseInt(req.params.id);
    const material = materiaisEscolares.find(m => m.id === id);
    if (!material) return res.status(404).send('Material não encontrado');
    
    material.nome = req.body.nome;
    material.quantidade = parseInt(req.body.quantidade);
    material.preco = parseFloat(req.body.preco);
    res.redirect('/materiais');
});

app.post('/materiais/excluir/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = materiaisEscolares.findIndex(m => m.id === id);
    if (index === -1) return res.status(404).send('Material não encontrado');
    materiaisEscolares.splice(index, 1);
    res.redirect('/materiais');
});

// ========== CRUD PROFESSORES ==========
app.get('/professores', (req, res) => {
    res.render('listarProfessores', { professores });
});

app.get('/professores/novo', (req, res) => res.render('cadastrarProfessor'));

app.get('/professores/ver/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const professor = professores.find(p => p.id === id);
    if (!professor) return res.status(404).send('Professor não encontrado');
    res.render('detalharProfessor', { professor });
});

app.get('/professores/:id/editar', (req, res) => {
    const id = parseInt(req.params.id);
    const professor = professores.find(p => p.id === id);
    if (!professor) return res.status(404).send('Professor não encontrado');
    res.render('editarProfessor', { professor });
});

app.post('/professores', (req, res) => {
    const { nome, disciplina, email } = req.body;
    const novoProfessor = { 
        id: professores.length + 1, 
        nome, 
        disciplina, 
        email 
    };
    professores.push(novoProfessor);
    res.redirect('/professores');
});

app.post('/professores/:id/editar', (req, res) => {
    const id = parseInt(req.params.id);
    const professor = professores.find(p => p.id === id);
    if (!professor) return res.status(404).send('Professor não encontrado');
    
    professor.nome = req.body.nome;
    professor.disciplina = req.body.disciplina;
    professor.email = req.body.email;
    res.redirect('/professores');
});

app.post('/professores/excluir/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = professores.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).send('Professor não encontrado');
    professores.splice(index, 1);
    res.redirect('/professores');
});

// ========== CRUD TURMAS ==========
app.get('/turmas', (req, res) => {
    res.render('listarTurmas', { turmas });
});

app.get('/turmas/nova', (req, res) => res.render('cadastrarTurma'));

app.get('/turmas/ver/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const turma = turmas.find(t => t.id === id);
    if (!turma) return res.status(404).send('Turma não encontrada');
    res.render('detalharTurma', { turma });
});

app.get('/turmas/:id/editar', (req, res) => {
    const id = parseInt(req.params.id);
    const turma = turmas.find(t => t.id === id);
    if (!turma) return res.status(404).send('Turma não encontrada');
    res.render('editarTurma', { turma });
});

app.post('/turmas', (req, res) => {
    const { nome, turno, capacidade } = req.body;
    const novaTurma = { 
        id: turmas.length + 1, 
        nome, 
        turno, 
        capacidade: parseInt(capacidade) 
    };
    turmas.push(novaTurma);
    res.redirect('/turmas');
});

app.post('/turmas/:id/editar', (req, res) => {
    const id = parseInt(req.params.id);
    const turma = turmas.find(t => t.id === id);
    if (!turma) return res.status(404).send('Turma não encontrada');
    
    turma.nome = req.body.nome;
    turma.turno = req.body.turno;
    turma.capacidade = parseInt(req.body.capacidade);
    res.redirect('/turmas');
});

app.post('/turmas/excluir/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = turmas.findIndex(t => t.id === id);
    if (index === -1) return res.status(404).send('Turma não encontrada');
    turmas.splice(index, 1);
    res.redirect('/turmas');
});

app.listen(port, () => {
    console.log(`Servidor em execução: http://localhost:${port}`);
});