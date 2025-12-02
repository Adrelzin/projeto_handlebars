const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const bodyParser = require('body-parser');
const db = require('./config/database');
const port = 3000;

// Importar models
const Material = require('./models/material.model');
const Professor = require('./models/professor.model');
const Turma = require('./models/turma.model');
const Aluno = require('./models/aluno.model');
const Servidor = require('./models/servidor.model');
const Retirada = require('./models/retirada.model');

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(express.static('public'));
app.engine('handlebars', exphbs.engine({ 
    defaultLayout: false,
    helpers: {
        eq: function(a, b) {
            return a === b;
        }
    }
}));

app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(bodyParser.urlencoded({extended: true}));

// Relacionamentos
Aluno.belongsTo(Turma, { foreignKey: 'turmaId', as: 'Turma', onDelete: 'SET NULL' });
Turma.hasMany(Aluno, { foreignKey: 'turmaId', as: 'Alunos' });

Retirada.belongsTo(Aluno, { foreignKey: 'alunoId', as: 'Aluno', onDelete: 'CASCADE' });
Retirada.belongsTo(Material, { foreignKey: 'materialId', as: 'Material', onDelete: 'CASCADE' });
Retirada.belongsTo(Professor, { foreignKey: 'professorId', targetKey: 'professorId', as: 'Professor', onDelete: 'CASCADE' });

Aluno.hasMany(Retirada, { foreignKey: 'alunoId', as: 'Retiradas' });
Material.hasMany(Retirada, { foreignKey: 'materialId', as: 'Retiradas' });
Professor.hasMany(Retirada, { foreignKey: 'professorId', sourceKey: 'professorId', as: 'Retiradas' });

// Sincronizar e popular banco
db.sync({force: true}).then(async () => {
    console.log('Banco sincronizado');
    console.log('Inserindo dados iniciais...');
    
    await Material.bulkCreate([
        { nome: "Caderno 10 matérias", quantidade: 50},
        { nome: "Lápis HB", quantidade: 200},
        { nome: "Borracha branca", quantidade: 100},
    ]);
    
    await Professor.bulkCreate([
        { nome: "Eric Sales", disciplina: "Dev. Web", email: "Eric@ifpe.com" },
        { nome: "Rogério Amaral", disciplina: "Matemática", email: "Rogerio@ifpe.com" },
        { nome: "Havana Alves", disciplina: "Programação 1", email: "Havana@ifpe.com" },
    ]);
    
    await Turma.bulkCreate([
        { nome: "1º Ano A", turno: "Manhã", capacidade: 30 },
        { nome: "1º Ano B", turno: "Manhã", capacidade: 28 },
        { nome: "2º Ano A", turno: "Manhã", capacidade: 32 },
    ]);
    
    await Aluno.bulkCreate([
        { nome: "Pedro Oliveira", matricula: "2024001", dataNascimento: "2010-05-15", turmaId: 1 },
        { nome: "Julia Santos", matricula: "2024002", dataNascimento: "2010-08-22", turmaId: 1 },
        { nome: "Lucas Silva", matricula: "2024003", dataNascimento: "2011-03-10", turmaId: 2 },
    ]);
    
    await Servidor.bulkCreate([
        { nome: "Carlos Mendes", cargo: "Secretário", setor: "Secretaria", matricula: "SRV001", telefone: "(81) 98765-4321", email: "carlos@escola.com" },
        { nome: "Fernanda Lima", cargo: "Coordenadora", setor: "Coordenação", matricula: "SRV002", telefone: "(81) 98765-4322", email: "fernanda@escola.com" },
    ]);
    
    await Retirada.bulkCreate([
        { alunoId: 1, materialId: 1, quantidade: 2, dataRetirada: "2024-11-01", horaRetirada: "08:30:00", responsavelEntrega: "Carlos Mendes", finalidade: "Aula de Matemática" },
        { alunoId: 2, materialId: 2, quantidade: 5, dataRetirada: "2024-11-02", horaRetirada: "09:15:00", responsavelEntrega: "Fernanda Lima", finalidade: "Projeto de Arte" },
        { professorId: 1, materialId: 3, quantidade: 3, dataRetirada: "2024-11-03", horaRetirada: "10:00:00", responsavelEntrega: "Carlos Mendes", finalidade: "Aula de Matemática" },
    ]);
    
    console.log('Dados iniciais inseridos!');
});

app.get('/', (req, res) => res.render('home'));

// LISTAR
app.get('/materiais', async (req, res) => {
    const materiais = await Material.findAll();
    res.render('materiais', { lista: true, materiais: materiais.map(m => m.toJSON()) });
});

// FORM NOVO 
app.get('/materiais/novo', (req, res) => {
    res.render('materiais', { form: true });
});

// FORM EDITAR 
app.get('/materiais/:id/editar', async (req, res) => {
    const material = await Material.findByPk(req.params.id);
    if (!material) {
        return res.status(404).send('Material não encontrado');
    }
    res.render('materiais', { form: true, material: material.toJSON() });
});

// DETALHAR 
app.get('/materiais/ver/:id', async (req, res) => {
    const material = await Material.findByPk(req.params.id);
    if (!material) {
        return res.status(404).send('Material não encontrado');
    }
    res.render('materiais', { detalhe: true, material: material.toJSON() });
});

// CRIAR
app.post('/materiais', async (req, res) => {
    await Material.create({ nome: req.body.nome, quantidade: parseInt(req.body.quantidade) });
    res.redirect('/materiais');
});

// EDITAR 
app.post('/materiais/:id/editar', async (req, res) => {
    const material = await Material.findByPk(req.params.id);
    if (!material) {
        return res.status(404).send('Material não encontrado');
    }
    material.nome = req.body.nome;
    material.quantidade = parseInt(req.body.quantidade);
    await material.save();
    res.redirect('/materiais');
});

// EXCLUIR
app.post('/materiais/excluir/:id', async (req, res) => {
    try {
        await Retirada.destroy({ where: { materialId: req.params.id } });
        
        await Material.destroy({ where: { id: req.params.id } });
        
        res.redirect('/materiais');
    } catch (error) {
        console.error('Erro ao excluir:', error);
        res.status(500).send('Erro ao excluir material');
    }
});

// PROFESSORES
app.get('/professores', async (req, res) => {
    const professores = await Professor.findAll();
    res.render('professores', { lista: true, professores: professores.map(p => p.toJSON()) });
});
app.get('/professores/novo', (req, res) => {
    res.render('professores', { form: true });
});
app.get('/professores/:id/editar', async (req, res) => {
    const professor = await Professor.findByPk(req.params.id);
    if (!professor) {
        return res.status(404).send('Professor não encontrado');
    }
    res.render('professores', { form: true, professor: professor.toJSON() });
});
app.get('/professores/ver/:id', async (req, res) => {
    const professor = await Professor.findByPk(req.params.id);
    if (!professor) {
        return res.status(404).send('Professor não encontrado');
    }
    res.render('professores', { detalhe: true, professor: professor.toJSON() });
});
app.post('/professores', async (req, res) => {
    await Professor.create(req.body);
    res.redirect('/professores');
});
app.post('/professores/:id/editar', async (req, res) => {
    const professor = await Professor.findByPk(req.params.id);
    professor.nome = req.body.nome;
    professor.disciplina = req.body.disciplina;
    professor.email = req.body.email;
    await professor.save();
    res.redirect('/professores');
});
app.post('/professores/excluir/:id', async (req, res) => {
    await Professor.destroy({ where: { id: req.params.id } });
    res.redirect('/professores');
});

// TURMAS
app.get('/turmas', async (req, res) => {
    const turmas = await Turma.findAll();
    res.render('turmas', { lista: true, turmas: turmas.map(t => t.toJSON()) });
});

app.get('/turmas/nova', (req, res) => {
    res.render('turmas', { form: true });
});

app.get('/turmas/:id/editar', async (req, res) => {
    const turma = await Turma.findByPk(req.params.id);
    if (!turma) {
        return res.status(404).send('Turma não encontrada');
    }
    res.render('turmas', { form: true, turma: turma.toJSON() });
});

app.get('/turmas/ver/:id', async (req, res) => {
    const turma = await Turma.findByPk(req.params.id, {
        include: [{ model: Aluno, as: 'Alunos' }]
    });
    if (!turma) {
        return res.status(404).send('Turma não encontrada');
    }
    res.render('turmas', { detalhe: true, turma: turma.toJSON() });
});

app.post('/turmas', async (req, res) => {
    await Turma.create({ nome: req.body.nome, turno: req.body.turno, capacidade: parseInt(req.body.capacidade) });
    res.redirect('/turmas');
});
app.post('/turmas/:id/editar', async (req, res) => {
    const turma = await Turma.findByPk(req.params.id);
    if (!turma) {
        return res.status(404).send('Turma não encontrada');
    }
    turma.nome = req.body.nome;
    turma.turno = req.body.turno;
    turma.capacidade = parseInt(req.body.capacidade);
    await turma.save();
    res.redirect('/turmas');
});
app.post('/turmas/excluir/:id', async (req, res) => {
    await Turma.destroy({ where: { id: req.params.id } });
    res.redirect('/turmas');
});

// LISTAR
app.get('/alunos', async (req, res) => {
    const alunos = await Aluno.findAll({ include: [{ model: Turma, as: 'Turma' }] });
    res.render('alunos', { lista: true, alunos: alunos.map(a => a.toJSON()) });
});

// FORM NOVO
app.get('/alunos/novo', async (req, res) => {
    const turmas = await Turma.findAll();
    res.render('alunos', { form: true, turmas: turmas.map(t => t.toJSON()) });
});

// FORM EDITAR
app.get('/alunos/:id/editar', async (req, res) => {
    const aluno = await Aluno.findByPk(req.params.id);
    const turmas = await Turma.findAll();
    if (!aluno) {
        return res.status(404).send('Aluno não encontrado');
    }
    res.render('alunos', { form: true, aluno: aluno.toJSON(), turmas: turmas.map(t => t.toJSON()) });
});

// DETALHAR
app.get('/alunos/ver/:id', async (req, res) => {
    const aluno = await Aluno.findByPk(req.params.id, { include: [{ model: Turma, as: 'Turma' }] });
    if (!aluno) {
        return res.status(404).send('Aluno não encontrado');
    }
    res.render('alunos', { detalhe: true, aluno: aluno.toJSON() });
});

// CRIAR 
app.post('/alunos', async (req, res) => {
    await Aluno.create(req.body);
    res.redirect('/alunos');
});

// EDITAR 
app.post('/alunos/:id/editar', async (req, res) => {
    await Aluno.update(req.body, { where: { id: req.params.id } });
    res.redirect('/alunos');
});

// EXCLUIR
app.post('/alunos/excluir/:id', async (req, res) => {
    try {
        // Deletar retiradas relacionadas primeiro
        await Retirada.destroy({ where: { alunoId: req.params.id } });
        // Deletar o aluno
        await Aluno.destroy({ where: { id: req.params.id } });
        res.redirect('/alunos');
    } catch (error) {
        console.error('Erro ao excluir:', error);
        res.status(500).send('Erro ao excluir aluno');
    }
});

// SERVIDORES
app.get('/servidores', async (req, res) => {
    const servidores = await Servidor.findAll();
    res.render('servidores', { lista: true, servidores: servidores.map(s => s.toJSON()) });
});
app.get('/servidores/novo', (req, res) => {
    res.render('servidores', { form: true });
});
app.get('/servidores/:id/editar', async (req, res) => {
    const servidor = await Servidor.findByPk(req.params.id);
    if (!servidor) {
        return res.status(404).send('Servidor não encontrado');
    }
    res.render('servidores', { form: true, servidor: servidor.toJSON() });
});
app.get('/servidores/ver/:id', async (req, res) => {
    const servidor = await Servidor.findByPk(req.params.id);
    if (!servidor) {
        return res.status(404).send('Servidor não encontrado');
    }
    res.render('servidores', { detalhe: true, servidor: servidor.toJSON() });
});
app.post('/servidores', async (req, res) => {
    await Servidor.create(req.body);
    res.redirect('/servidores');
});
app.post('/servidores/:id/editar', async (req, res) => {
    await Servidor.update(req.body, { where: { id: req.params.id } });
    res.redirect('/servidores');
});
app.post('/servidores/excluir/:id', async (req, res) => {
    await Servidor.destroy({ where: { id: req.params.id } });
    res.redirect('/servidores');
});

// RETIRADAS

app.get('/retiradas', async (req, res) => {
    try {
        const { busca, tipo } = req.query;
        const { Op } = require('sequelize');
        
        let include = [
            { model: Aluno, as: 'Aluno', required: false },
            { model: Professor, as: 'Professor', required: false },
            { model: Material, as: 'Material', required: true }
        ];
        
        if (busca && busca.trim() !== '') {
            if (tipo === 'aluno') {
                include[0] = { 
                    model: Aluno, 
                    as: 'Aluno', 
                    required: true,
                    where: {
                        nome: { [Op.like]: `%${busca}%` }
                    }
                };
            } else if (tipo === 'professor') {
                include[1] = { 
                    model: Professor, 
                    as: 'Professor', 
                    required: true,
                    where: {
                        nome: { [Op.like]: `%${busca}%` }
                    }
                };
            } else {
                include = [
                    { 
                        model: Aluno, 
                        as: 'Aluno', 
                        required: false,
                        where: {
                            nome: { [Op.like]: `%${busca}%` }
                        }
                    },
                    { 
                        model: Professor, 
                        as: 'Professor', 
                        required: false,
                        where: {
                            nome: { [Op.like]: `%${busca}%` }
                        }
                    },
                    { model: Material, as: 'Material', required: true }
                ];
            }
        }
        
        const retiradas = await Retirada.findAll({
            include: include,
            order: [['dataRetirada', 'DESC'], ['horaRetirada', 'DESC']]
        });
        
        let resultadosFiltrados = retiradas;
        
        if (busca && busca.trim() !== '' && !tipo) {
            resultadosFiltrados = retiradas.filter(r => {
                const nomeAluno = r.Aluno ? r.Aluno.nome.toLowerCase() : '';
                const nomeProfessor = r.Professor ? r.Professor.nome.toLowerCase() : '';
                const buscaLower = busca.toLowerCase();
                return nomeAluno.includes(buscaLower) || nomeProfessor.includes(buscaLower);
            });
        }
        
        res.render('retiradas', { 
            lista: true, 
            retiradas: resultadosFiltrados.map(r => r.toJSON()),
            busca: busca || '',
            tipo: tipo || ''
        });
    } catch (error) {
        console.error('Erro ao listar retiradas:', error);
        res.status(500).send('Erro ao listar retiradas: ' + error.message);
    }
});

//Nova retirada
app.get('/retiradas/nova', async (req, res) => {
    const alunos = await Aluno.findAll();
    const professores = await Professor.findAll();
    const materiais = await Material.findAll();
    res.render('retiradas', { 
        form: true, 
        alunos: alunos.map(a => a.toJSON()), 
        professores: professores.map(p => p.toJSON()),
        materiais: materiais.map(m => m.toJSON()) 
    });
});

//Editar retirada
app.get('/retiradas/:id/editar', async (req, res) => {
    const retirada = await Retirada.findByPk(req.params.id);
    const alunos = await Aluno.findAll();
    const professores = await Professor.findAll();
    const materiais = await Material.findAll();
    if (!retirada) {
        return res.status(404).send('Retirada não encontrada');
    }
    res.render('retiradas', { 
        form: true, 
        retirada: retirada.toJSON(), 
        alunos: alunos.map(a => a.toJSON()),
        professores: professores.map(p => p.toJSON()),
        materiais: materiais.map(m => m.toJSON()) 
    });
});

//Detalhar retirada
app.get('/retiradas/ver/:id', async (req, res) => {
    const retirada = await Retirada.findByPk(req.params.id, {
        include: [
            { model: Aluno, as: 'Aluno' },
            { model: Professor, as: 'Professor' },
            { model: Material, as: 'Material' }
        ]
    });
    if (!retirada) {
        return res.status(404).send('Retirada não encontrada');
    }
    res.render('retiradas', { detalhe: true, retirada: retirada.toJSON() });
});

//Criar retiradas
app.post('/retiradas', async (req, res) => {
    try{
        const { materialId, quantidade, tipoRetirada } = req.body;

        const material = await Material.findByPk(materialId);

        if (!material) {
            return res.status(404).send('Material não encontrado');
        }

        if (material.quantidade < parseInt(quantidade)){
            return res.status(400).send(`Estoque insuficiente! Disponível: ${material.quantidade}, Solicitado: ${quantidade}`);
        }

        // Limpar os IDs sem uso
        const dadosRetirada = { ...req.body };
        if (tipoRetirada === 'aluno') {
            delete dadosRetirada.professorId;
        } else {
            delete dadosRetirada.alunoId;
        }
        delete dadosRetirada.tipoRetirada;

        await Retirada.create(dadosRetirada);

        material.quantidade -= parseInt(quantidade);
        await material.save();

        res.redirect('/retiradas');
    }catch(error){
        console.error('Erro ao criar retirada:', error);
        res.status(500).send('Erro ao criar retirada: ' + error.message);
    }
});

app.post('/retiradas/:id/editar', async (req, res) => {
    try {
        const retirada = await Retirada.findByPk(req.params.id);
        
        if (!retirada) {
            return res.status(404).send('Retirada não encontrada');
        }
        
        const { materialId, quantidade, tipoRetirada } = req.body;
        const quantidadeAnterior = retirada.quantidade;
        const materialAnteriorId = retirada.materialId;
        
        if (materialAnteriorId != materialId || quantidadeAnterior != quantidade) {
            
            const materialAnterior = await Material.findByPk(materialAnteriorId);
            materialAnterior.quantidade += quantidadeAnterior;
            await materialAnterior.save();
            
            const materialNovo = await Material.findByPk(materialId);
            
            if (materialNovo.quantidade < parseInt(quantidade)) {
                materialAnterior.quantidade -= quantidadeAnterior;
                await materialAnterior.save();
                return res.status(400).send(`Estoque insuficiente! Disponível: ${materialNovo.quantidade}, Solicitado: ${quantidade}`);
            }
            
            materialNovo.quantidade -= parseInt(quantidade);
            await materialNovo.save();
        }
        
        // Limpar os IDs sem uso
        const dadosAtualizacao = { ...req.body };
        if (tipoRetirada === 'aluno') {
            dadosAtualizacao.professorId = null;
        } else {
            dadosAtualizacao.alunoId = null;
        }
        delete dadosAtualizacao.tipoRetirada;
        
        await Retirada.update(dadosAtualizacao, { where: { id: req.params.id } });
        res.redirect('/retiradas');
        
    } catch (error) {
        console.error('Erro ao editar retirada:', error);
        res.status(500).send('Erro ao editar retirada: ' + error.message);
    }
});

// Excluir retirada
app.post('/retiradas/excluir/:id', async (req, res) => {
    try {
        const retirada = await Retirada.findByPk(req.params.id);
        
        if (!retirada) {
            return res.status(404).send('Retirada não encontrada');
        }
        
        const material = await Material.findByPk(retirada.materialId);
        material.quantidade += retirada.quantidade;
        await material.save();
        
        await Retirada.destroy({ where: { id: req.params.id } });
        
        res.redirect('/retiradas');
    } catch (error) {
        console.error('Erro ao excluir retirada:', error);
        res.status(500).send('Erro ao excluir retirada: ' + error.message);
    }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
