/**
 * Objeto com os dados de entrada para o solver. Será modificado a partir
 * dos controles da interface (principalmente para informações indisponíveis
 * na entrada).
 */
let entrada = null

/**
 * Objeto com os parâmetros de configuração para o solver. Será modificado
 * partir dos controles da interface, tendo uma valor default inicial.
 * @property {string} algoritmo Nome do algoritmo a ser utiliado.
 *    Valores possíveis: AG, HySST, SA-ILS, WDJU
 * @property {number} tempo Tempo de execução máximo, em segundos.
 * @property {object} parametros Parâmetros de configuração do algoritmo.
 *    Valores possíveis:
 *        AG: TaxaMut NIndiv %Cruz CruzOper NMut NTour GIter GNViz GAlfa
 *        HySST: MaxLevel TStart TStep IterHc IterMut
 *        SA-ILS: FracTime SAlfa t0 SAiter SAreaq SAchances ILSiter ILSpmax ILSp0
 *        WDJU: StagLimit JumpFactor
 * @property {string} fo Qual a função a ser usada (preferências ou grades).
 *    Valores possíveis: pref, grades
 * @property {object} pesos Pesos da função objetivo, se for usada a de preferências.
 * @property {number} numeroDiasLetivos Número de dias letivos por semana.
 * @property {number} numeroHorarios Número de horários por dia.
 */
let config = {
    algoritmo: 'AG',
    tempo: 180,
    parametros: {
        // AG
        NIndiv: 20,
        '%Cruz': 30,
        NMut: 4,
        NTour: 4,
        AGIter: 20,
        CruzOper: 'CX',
        TaxaMut: 15,
        // GRASP
        GIter: 15,
        GNViz: 4,
        GAlfa: 20,
        // HySST
        MaxLevel: 15,
        TStart: 5,
        TStep: 5,
        IterHc: 5,
        IterMut: 5,
        // SA-ILS
        FracTime: 100,
        SAlfa: 0.97,
        t0: 1,
        SAiter: 100,
        SAreaq: 250,
        SAchance: 0,
        ILSiter: 10,
        ILSpmax: 10,
        ILSp0: 1,
        // WDJU
        StagLimit: 10,
        JumpFactor: 0.001
    },
    fo: 'pref',
    pesos: {
        Janelas: 2,
        IntervalosTrabalho: 1.5,
        NumDiasAula: 3.5,
        AulasSabado: 4.667,
        AulasSeguidas: 4,
        AulasSeguidasDificil: 2.5,
        AulaDificilUltimoHorario: 2.333,
        PreferenciasProfessores: 3.167,
        AulasProfessores: 1.667
    },
    numeroHorarios: 4,
    numeroDiasLetivos: 6
}

/**
 * Recebe o JSON enviado como entrada via upload, armazenando
 * no objeto global `entrada`.
 * @param {Event} evt Evento ativado quando um arquivo for enviado.
 */
function recebe_upload(evt) {
    const reader = new FileReader()

    reader.onload = (evt) => {
        entrada = JSON.parse(evt.target.result)
        load_file()
    }

    reader.readAsText(evt.target.files[0])
}

/**
 * Recupera um professor a partir de sua ID.
 * @param {string} id Identificação do professor.
 * @returns {object} Professor.
 */
function get_professor(id) {
    return entrada.professores.find(p => p.id == id)
}

/**
 * Recupera uma disciplina a partir de sua ID.
 * @param {string} id Identificação da disciplina.
 * @returns {object} Disciplina.
 */
function get_disciplina(id) {
    return entrada.disciplinas.find(d => d.id == id)
}

function handle_config(evt) {
    console.log('config');
    const input = evt.target;
    const categoria = input.getAttribute('data-cat')
    const obj = categoria ? config[categoria] : config
    const campo = input.getAttribute('data-field')
    obj[campo] = Number(input.value)
}

function handle_algo(evt) {

}

function handle_fo(evt) {

}

/**
 * Modifica valor de horas desejadas do professor a quem
 * o input modificado pertence.
 * @param {Event} evt Evento ativado quando o número de horas é modificado;
 */
function registra_horas(evt) {
    console.log('horas')
    const input = evt.target
    const id = input.parentNode.parentNode.getAttribute('data-id')
    get_professor(id).preferenciasHoras = parseInt(input.value, 10)
}

/**
 * Modifica a lista de disciplinas desejadas do professor a quem
 * o input modificado pertecence.
 * @param {Event} evt Evento ativado quando as disciplinas desejadas são modificadas.
 */
function registra_discs(evt) {
    console.log('discs')
    const input = evt.target
    const id = input.parentNode.parentNode.getAttribute('data-id')
    const disciplinas = input.value.split('\n').map(s => s.trim())
    get_professor(id).preferenciasDiscs = disciplinas
}

/**
 * Modifica a dificuldade da disciplina (se é ou não difícil) a quem
 * o input modificado pertence.
 * @param {Event} evt Evento ativado quando a dificuldade da disciplina é modificada
 */
function registra_dificil(evt) {
    console.log('dificil')
    const input = evt.target
    const id = input.parentNode.parentNode.getAttribute('data-id')
    get_disciplina(id).dificil = input.checked
}

/**
 * Gera uma matriz de zeros NxM, onde N é o número de dias letivos e
 * M é o número de horários por dia. Ambos os valores são obtidos através
 * da configuração vigente (veja {@link config}).
 * @returns {number[][]} Matriz NxM de zeros.
 */
function matriz_vazia() {
    let cols = config.numeroDiasLetivos
    let rows = config.numeroHorarios
    let array = []
    let row = []

    while (cols--) row.push(1)
    while (rows--) array.push(row.slice())
    return array
}

/**
 * Modifica a disponibilidade do professor no dia e horário associados
 * ao input modificado.
 * @param {Event} evt Evento ativado quando o controle é modificado.
 */
function registra_disponibilidade(evt) {
    console.log('disponibilidade')
    const input = evt.target

    const id = input.getAttribute('data-id')
    const prof = get_professor(id)
    const dia = parseInt(input.getAttribute('data-dia'), 10)
    const horario = parseInt(input.getAttribute('data-horario'), 10)

    prof.disponibilidade[horario][dia] = input.checked
}

/**
 * Desenha a matriz de disponibilidades do professor `prof` no elemento `cell`.
 * @param {Element} cell Elemento onde a matriz será desenhada.
 * @param {object} prof Professor cuja matriz será desenhada.
 */
function render_matriz(cell, prof) {
    if (!prof.hasOwnProperty('disponibilidade'))
        prof.disponibilidade = matriz_vazia()

    const table = document.createElement('table')
    cell.appendChild(table)

    const header = document.createElement('thead')
    table.appendChild(header)

    const hr = document.createElement('tr')
    header.appendChild(hr)

    const headers = [' ', 'S', 'T', 'Q', 'Q', 'S', 'S', 'D']
    headers.forEach(h => {
        const th = document.createElement('th')
        th.appendChild(document.createTextNode(h))
        hr.appendChild(th)
    })

    const body = document.createElement('tbody')
    table.appendChild(body)

    for (let i = 0; i < config.numeroHorarios; i++) {
        const tr = document.createElement('tr')
        body.appendChild(tr)

        const td = document.createElement('td')
        td.appendChild(document.createTextNode((i + 1) + '°'))
        tr.appendChild(td)

        for (let j = 0; j < config.numeroDiasLetivos; j++) {
            const td = document.createElement('td')
            tr.appendChild(td)

            const checkbox = document.createElement('input')
            td.appendChild(checkbox)

            checkbox.type = 'checkbox'
            checkbox.checked = prof.disponibilidade[i][j]
            checkbox.setAttribute('data-dia', j)
            checkbox.setAttribute('data-horario', i)
            checkbox.setAttribute('data-id', prof.id)
            checkbox.addEventListener('change', registra_disponibilidade, false)
        }
    }
}

/**
 * Desenha uma linha do professor na tabela de professores, contendo
 * seu ID, nome e controles para número de horas e disciplinas desejadas.
 * @param {object} prof Professor a ser representado na tabela.
 */
function render_professor(prof) {
    const table = document.getElementById('professores').getElementsByTagName('tbody')[0]
    const linha = table.insertRow(table.rows.length)

    linha.setAttribute('data-id', prof.id)
    linha.insertCell(0).innerHTML = prof.id
    linha.insertCell(1).innerHTML = prof.nome
    linha.insertCell(2).innerHTML = "<input type=number placeholder='Horas' class='horas-pref' min='0'/>"
    linha.cells[2].getElementsByTagName('input')[0]
        .addEventListener('change', registra_horas, false)
    linha.insertCell(3).innerHTML = "<textarea placeholder='Disciplinas' class='disc-pref'></textarea>"
    linha.cells[3].getElementsByTagName('textarea')[0]
        .addEventListener('change', registra_discs, false)
    render_matriz(linha.insertCell(4), prof)
}

/**
 * Percorre a lista de professores de {@link entrada}, desenhando uma linha para cada
 * na tabela de professores. Sobrescreve a tabela pré-existente.
 */
function render_preferencias_professor() {
    document.getElementById('professores').getElementsByTagName('tbody')[0].innerHTML = ""
    entrada.professores.forEach(render_professor)
}

/**
 * Desenha uma linha para disciplina na tabela de disciplinas, contendo
 * sua ID, seu nome e um checkbox para indicar se ela é uma disciplina difícil.
 * @param {object} disc Disciplina a ser representada na tabela.
 */
function render_disciplina(disc) {
    const table = document.getElementById('disciplinas').getElementsByTagName('tbody')[0]

    const linha = table.insertRow(table.rows.length)
    linha.setAttribute('data-id', disc.id)
    linha.insertCell(0).innerHTML = disc.id
    linha.insertCell(1).innerHTML = disc.nome
    linha.insertCell(2).innerHTML = disc.periodo
    linha.insertCell(3).innerHTML = "<input type='checkbox' class='disc-dificil'/>"
    linha.cells[3].getElementsByTagName('input')[0]
        .addEventListener('change', registra_dificil, false)
}

/**
 * Percorre a lista de disciplinas em {@link entrada}, desenhando uma linha para cada
 * na tabela de disciplinas. Sobrescreve a tabela pré-existente.
 */
function render_disciplinas_dificeis() {
    document.getElementById('disciplinas').getElementsByTagName('tbody')[0].innerHTML = ""
    entrada.disciplinas.forEach(render_disciplina)
}

/**
 * Carrega as tabelas de disciplinas e professores a partir da entrada
 * recém recebida.
 */
function load_file() {
    render_preferencias_professor()
    render_disciplinas_dificeis()
}

/**
 * Envia os objetos {@link entrada} e {@link config} juntos num JSON
 * para o servidor.
 */
function enviar_json() {
    if (entrada === null) {
        alert('Selecione um arquivo de entrada.')
        return
    }

    const json = {
        'entrada': entrada,
        'configuracao': config
    }

    const xhr = new XMLHttpRequest()
    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200)
                console.log(xhr.responseText)
            else
                alert('Erro no servidor')
        }
        console.log(xhr.responseText)
    }
    xhr.open('POST', '/gerar_horario', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(JSON.stringify(json))
}

/**
 * Registra os eventos de mudança para o controle de upload da entrada e
 * envio para o servidor.
 */
window.onload = function() {
    document.getElementById('entrada-upload').addEventListener('change', recebe_upload, false)
    document.getElementById('gerar-btn').addEventListener('click', enviar_json, false)

    document.querySelectorAll('.numeric-conf')
        .forEach(e => e.addEventListener('change', handle_config, false))

    document.getElementById('algoritmo-select').addEventListener('change', handle_algo, false);
    document.getElementById('fo-select').addEventListener('change', handle_fo, false);
}
