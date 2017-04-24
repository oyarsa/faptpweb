/**
 * Objeto com os dados de entrada para o solver. Será criado a partir do JSON submetido
 * pelo usuário e modificado a partir dos controles da interface (principalmente para
 * informações indisponíveis na entrada).
 * Estão disponíveis um {@link https://github.com/oyarsa/faptp/raw/master/schemas/entrada_exemplo.json exemplo}
 * e o {@link https://github.com/oyarsa/faptp/raw/master/schemas/entrada_schema.json schema}.
 */
let entrada = null

/**
 * Objeto com os parâmetros de configuração para o solver. Será modificado
 * partir dos controles da interface, tendo uma valor default inicial.
 * @property {string} algoritmo Nome do algoritmo a ser utiliado.
*    Valores possíveis: <tt>AG, HySST, SA-ILS, WDJU</tt>
 * @property {number} tempo Tempo de execução máximo, em segundos.
 * @property {object} parametros Parâmetros de configuração do algoritmo.
 *     Valores possíveis:
 *     <ul>
 *        <li><tt>AG: TaxaMut, NIndiv, %Cruz, CruzOper, NMut, NTour, GIter, GNViz, GAlfa</tt></li>
 *        <li><tt>HySST: MaxLevel, TStart, TStep, IterHc, IterMut</tt></li>
 *        <li><tt>SA-ILS: FracTime, SAlfa, t0, SAiter, SAreaq, SAchances, ILSiter, ILSpmax, ILSp0</tt></li>
 *        <li><tt>WDJU: StagLimit, JumpFactor </tt></li>
 *     </ul>
 * @property {string} fo Qual a função a ser usada (preferências ou grades).
 *    Valores possíveis: pref, grades
 * @property {object} pesos Pesos da função objetivo, se for usada a de preferências.
 * @property {number} numeroDiasLetivos Número de dias letivos por semana.
 * @property {number} numeroHorarios Número de horários por dia.
 * @property {number} numeroPeriodos Número de períodos/turmas/currículos.
 * @property {number} numeroAlunos Número de alunos matriculados.
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
        SAlfa: 0.935,
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
 * Aplicação parcial (currying) de <tt>fn</tt>.
 *
 * @example
 * const mult = (x, y) => x * y
 * const multBy2 = curry(mult, 2)
 * multBy2(10) === 20
 *
 * @param {function} fn Função a ser parcialmente aplicada.
 * @param {...*} args1 Os primeiros argumentos de fn
 * @returns {function} Uma função que recebe os argumentos restantes, aplicando args1
 *                     juntamente com eles para de fato executar a função.
 */
function curry(fn, ...args1) {
    return (...args2) => fn(...args1, ...args2);
}

/**
 * Recebe o JSON enviado como entrada via upload, armazenando
 * no objeto global {@link entrada}.
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
 * Registra mudança na configuração para parâmetros numéricos, transportando
 * o novo valor para o objeto {@link config}. Para isso, o input deve possuir
 * a classe <tt>numeric-conf</tt>, além do atributo <tt>data-field</tt>, que diz a  qual
 * campo do objeto ele diz respeito. O atributo <tt>data-cat</tt> é usado para indicar
 * a qual sub-objeto ele pertence, mas é opcional.
 * @param {Event} evt Evento ativado quando o input é modificado.
 */
function handle_numeric_config(evt) {
    console.log('config')

    const input = evt.target
    const categoria = input.getAttribute('data-cat')
    const obj = categoria ? config[categoria] : config
    const campo = input.getAttribute('data-field')
    obj[campo] = Number.parseFloat(input.value)
}

/**
 * Registra mudança no algoritmo selecionado, exibindo os inputs
 * de seus parâmetros e escondendo os restantes.
 * @param {Event} evt Evento ativado quando o select de algoritmos é modificado.
 */
function handle_algo(evt) {
    console.log('algoritmo')

    const nome = evt.target.value
    config.algoritmo = nome

    document.querySelectorAll('.algo-div').forEach((a) => {
        if (a.getAttribute('data-cat') == nome)
            a.removeAttribute('hidden')
        else
            a.setAttribute('hidden', true)
    })
}

/**
 * Registra mudança no tipo de fo selecionada, mostrando os inputs para os
 * pesos se <tt>Preferências</tt> for selecionado, ou então mostrando os parâmetros
 * do GRASP se <tt>Grade</tt> for selecionado.
 * @param {Event} evt Evento ativado quando o select de fo é modificado.
 */
function handle_fo(evt) {
    console.log('FO')

    const nome = evt.target.value
    config.fo = nome

    const pesos = document.getElementById('pesos-div')
    const grasp = document.getElementById('grasp-div')
    if (nome == 'pref') {
        pesos.removeAttribute('hidden')
        grasp.setAttribute('hidden', true)
    } else {
        pesos.setAttribute('hidden', true)
        grasp.removeAttribute('hidden')
    }
}

/**
 * Modifica valor de horas desejadas do professor a quem
 * o input modificado pertence.
 * @param {object} prof Professor a quem pertence o input de horas.
 * @param {Event} evt Evento ativado quando o número de horas é modificado.
 */
function registra_horas(prof, evt) {
    console.log('horas')
    prof.preferenciasHoras = Number.parseInt(evt.target.value, 10)
}

/**
 * Modifica a lista de disciplinas desejadas do professor a quem
 * o input modificado pertecence.
 * @param {object} prof Professor a quem pertence o input de disciplinas.
 * @param {Event} evt Evento ativado quando as disciplinas desejadas são modificadas.
 */
function registra_discs(prof, evt) {
    console.log('discs')
    prof.preferenciasDiscs = evt.target.value.split('\n').map(s => s.trim())
}

/**
 * Modifica a dificuldade da disciplina (se é ou não difícil) a quem
 * o input modificado pertence.
 * @param {object} disc Disciplina a quem pertence o input de dificuldade.
 * @param {Event} evt Evento ativado quando a dificuldade da disciplina é modificada.
 */
function registra_dificil(disc, evt) {
    console.log('dificil')
    disc.dificil = evt.target.checked
}

/**
 * Modifica a oferta da disciplina (se é ou não ofertada) a quem
 * o input modificado pertence.
 * @param {object} disc Disciplina a quem pertence o input de dificuldade.
 * @param {Event} evt Evento ativado quando a ofertada da disciplina é modificada.
 */
function registra_ofertada(disc, evt) {
    console.log('ofertada')
    disc.ofertada = evt.target.checked
}

/**
 * Gera uma matriz <tt>n x m</tt>, onde cada célula é preenchida por <tt>value</tt>.
 * @param {number} n Número de linhas da matriz.
 * @param {number} m Número de colunas da matriz.
 * @param {*} value Valor que irá preencher as células da matriz.
 * @returns {Array<Array>} Matriz <tt>n x m</tt> de zeros.
 */
function matriz(n, m, value) {
    const array = []
    const row = []

    while (m--) row.push(value)
    while (n--) array.push(row.slice())
    return array
}

/**
 * Modifica a disponibilidade do professor no dia e horário associados
 * ao input modificado.
 * @param {Event} evt Evento ativado quando o controle é modificado.
 */
function registra_disponibilidade(prof, horario, dia, evt) {
    console.log('disponibilidade')
    prof.disponibilidade[horario][dia] = evt.target.checked
}

/**
 * Desenha a matriz de disponibilidades do professor <tt>prof</tt> no elemento <tt>cell</tt>.
 * @param {Node} cell Elemento onde a matriz será desenhada.
 * @param {object} prof Professor cuja matriz será desenhada.
 */
function render_matriz(cell, prof) {
    if (!prof.hasOwnProperty('disponibilidade'))
        prof.disponibilidade = matriz(config.numeroHorarios, config.numeroDiasLetivos, true)

    const table = document.createElement('table')
    cell.appendChild(table)

    const header = document.createElement('thead')
    table.appendChild(header)

    const hr = document.createElement('tr')
    header.appendChild(hr)

    const headers = [' ', 'S', 'T', 'Q', 'Q', 'S', 'S', 'D']
    headers.forEach((h) => {
        const th = document.createElement('th')
        hr.appendChild(th)
        th.appendChild(document.createTextNode(h))
    })

    const body = document.createElement('tbody')
    table.appendChild(body)

    for (let i = 0; i < config.numeroHorarios; i++) {
        const tr = document.createElement('tr')
        body.appendChild(tr)

        const td = document.createElement('td')
        tr.appendChild(td)
        td.appendChild(document.createTextNode((i + 1) + '°'))

        for (let j = 0; j < config.numeroDiasLetivos; j++) {
            const td = document.createElement('td')
            tr.appendChild(td)

            const checkbox = document.createElement('input')
            td.appendChild(checkbox)

            checkbox.type = 'checkbox'
            checkbox.checked = prof.disponibilidade[i][j]
            checkbox.addEventListener('change', curry(registra_disponibilidade, prof, i, j), false)
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

    const id = linha.insertCell(0)
    id.appendChild(document.createTextNode(prof.id))

    const nome = linha.insertCell(1)
    nome.appendChild(document.createTextNode(prof.nome))

    const horas = linha.insertCell(2)
    const input_horas = document.createElement('input')
    horas.appendChild(input_horas)

    input_horas.placeholder = 'Horas'
    input_horas.min = 0
    input_horas.addEventListener('change', curry(registra_horas, prof), false)

    const disciplinas = linha.insertCell(3)
    const text_discs = document.createElement('textarea')
    disciplinas.appendChild(text_discs)

    text_discs.placeholder = 'Disciplinas'
    text_discs.addEventListener('change', curry(registra_discs, prof), false)

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

    const id = linha.insertCell(0)
    id.appendChild(document.createTextNode(disc.id))

    const nome = linha.insertCell(1)
    nome.appendChild(document.createTextNode(disc.nome))

    const periodo = linha.insertCell(2)
    periodo.appendChild(document.createTextNode(disc.periodo))

    const dificil = linha.insertCell(3)
    const dificil_input = document.createElement('input')
    dificil.appendChild(dificil_input)

    dificil_input.type = 'checkbox'
    dificil_input.checked = !!disc.dificil
    dificil_input.addEventListener('change', curry(registra_dificil, disc), false)

    const ofertada = linha.insertCell(4)
    const ofertada_input = document.createElement('input')
    ofertada.appendChild(ofertada_input)

    ofertada_input.type = 'checkbox'
    ofertada_input.checked = disc.ofertada
    ofertada_input.addEventListener('change', curry(registra_ofertada, disc), false)
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
 * Calcula o número de períodos/turmas/currículos a partir das disciplinas
 * na entrada.
 * @returns {number}  Número de períodos/turmas/currículos.
 */
function calcular_numero_periodos() {
     return new Set(entrada.disciplinas.filter(d => d.ofertada).map(d => d.periodo)).size
}

/**
 * Carrega as tabelas de disciplinas e professores a partir da entrada
 * recém recebida.
 */
function load_file() {
    config.numeroAlunos = entrada.alunoperfis.length
    document.getElementById('numero-alunos').value = config.numeroAlunos
    config.numeroPeriodos = calcular_numero_periodos()
    document.getElementById('numero-periodos').value = config.numeroPeriodos

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

    document.getElementById('solucao').innerHTML = ''

    const json = {
        'entrada': entrada,
        'configuracao': config
    }

    const xhr = new XMLHttpRequest()
    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            const res = JSON.parse(xhr.responseText)
            if (xhr.status === 200)
                disponibilizar_solucao(res)
            else
                alert('Erro no servidor: ' + res.message)
        }
    }
    xhr.open('POST', '/gerar_horario', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(JSON.stringify(json))
}

/**
 * Cria um link para download da solução enviada pelo servidor como um arquivo
 * JSON.
 * @param {object} res Resposta do servidor.
 * @param {number} res.id Identificação da solução.
 * @param {object} res.saida JSON com a solução.
 */
function disponibilizar_solucao(res) {
    const solucao = document.getElementById('solucao')
    solucao.innerHTML = ""

    const texto = document.createElement('h2')
    solucao.appendChild(texto)
    texto.textContent = `Seu código: ${res.id}`

    texto.appendChild(document.createElement('br'))

    const url = document.createElement('a')
    texto.appendChild(url)
    url.href = window.URL.createObjectURL(new Blob([res.saida], { type: 'text/json' }))
    url.download = 'saida.json'
    url.textContent = 'Resultado'

    texto.appendChild(document.createElement('br'))

    const html = document.createElement('a')
    texto.appendChild(html)
    html.href = `/horario/${res.id}`
    html.textContent = 'Visualizar horário'

    window.location.href = '#solucao'
}

/**
 * Configura o valor do elemento para corresponder àquele em {@link config}.
 * O Elemento precisa ter o atributo <tt>data-field</tt>, que irá corresponder à
 * propriedade em <tt>config</tt>. O atributo <tt>data-cat</tt> é opcional, e se existir
 * diz respeito ao objeto interno em <tt>config</tt>.
 * @param {Element} element Elemento a ser configurado.
 */
function set_param_value(element) {
    const param = element.getAttribute('data-field')
    let obj = config
    let cat = element.getAttribute('data-cat')
    if (cat) obj = obj[cat]
    const value = obj[param]
    element.value = value
}

/**
 * Registra os eventos de mudança para o controle de upload da entrada e
 * envio para o servidor.
 */
window.onload = function() {
    document.getElementById('entrada-upload').addEventListener('change', recebe_upload, false)
    document.getElementById('gerar-btn').addEventListener('click', enviar_json, false)

    document.querySelectorAll('.numeric-conf')
        .forEach(e => e.addEventListener('change', handle_numeric_config, false))
    document.querySelectorAll('.matrix-size')
        .forEach(e => e.addEventListener('change', render_preferencias_professor, false))

    document.getElementById('algoritmo-select').addEventListener('change', handle_algo, false)
    document.getElementById('fo-select').addEventListener('change', handle_fo, false)

    // Coloca todos os inputs em seus defaults, para evitar problemas com eventos
    document.querySelectorAll('select').forEach(e => e.selectedIndex = 0)
    document.querySelectorAll('.numeric-conf').forEach(set_param_value)
}
