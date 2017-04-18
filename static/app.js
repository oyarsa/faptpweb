var entrada = null;

var config = {
    'algoritmo': 'AG',
    'parametros': {
        'PopTam': 20,
        'pCruz': 0.3,
        'ntMut': 4,
        'torTam': 4,
        'graspMaxIt': 15,
        'numVizinhos': 2,
        'alfa': 0.2,
        'agMaxIt': 20,
        'opCruz': 'CX',
        'probMutacao': 0.15
    },
    'pesos': {
        'Janelas': 2,
        'IntervalosTrabalho': 1.5,
        'NumDiasAula': 3.5,
        'AulasSabado': 4.667,
        'AulasSeguidas': 4,
        'AulasSeguidasDificil': 2.5,
        'AulaDificilUltimoHorario': 2.333,
        'PreferenciasProfessores': 3.167,
        'AulasProfessores': 1.667
    },
    'numeroHorarios': 4,
    'numeroDiasLetivos': 6
};

function recebe_upload(evt)
{
    var reader = new FileReader();

    reader.onload = function(evt) {
        entrada = JSON.parse(evt.target.result);
        load_file();
    };

    reader.readAsText(evt.target.files[0]);
}

function get_professor(id)
{
    return entrada.professores.find(function(p) { return p.id == id; });
}

function get_disciplina(id)
{
    return entrada.disciplinas.find(function(d) { return d.id == id; });
}

function registra_horas(evt)
{
    console.log('horas');
    var input = evt.target;
    var id = input.parentNode.parentNode.getAttribute('id');
    get_professor(id).preferenciasHoras = parseInt(input.value, 10);
}

function registra_discs(evt)
{
    console.log('discs');
    var input = evt.target;
    var id = input.parentNode.parentNode.getAttribute('id');
    var disciplinas = input.value.split('\n').map(function(s) { return s.trim(); });
    get_professor(id).preferenciasDiscs = disciplinas;
}

function registra_dificil(evt)
{
    console.log('dificil');
    var input = evt.target;
    var id = input.parentNode.parentNode.getAttribute('id');
    get_disciplina(id).dificil = input.checked;
}

function matriz_vazia()
{
    var cols = config.numeroDiasLetivos;
    var rows = config.numeroHorarios;

    var array = [], row = [];
    while (cols--) row.push(0);
    while (rows--) array.push(row.slice());
    return array;
}

function registra_disponibilidade(evt)
{
    console.log('disponibilidade');
    var input = evt.target;

    var id = input.getAttribute('id');
    var prof = get_professor(id);
    var dia = parseInt(input.getAttribute('dia'), 10);
    var horario = parseInt(input.getAttribute('horario'), 10);

    if (!prof.hasOwnProperty('disponibilidade')) {
        prof.disponibilidade = matriz_vazia();
    }
    prof.disponibilidade[horario][dia] = input.checked;
}

function render_matriz(cell, profid)
{
    var table = document.createElement('table');
    cell.appendChild(table);

    var header = document.createElement('thead');
    table.appendChild(header);

    var hr = document.createElement('tr');
    header.appendChild(hr);

    var headers = ['Horário', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    headers.forEach(function(h) {
        var th = document.createElement('th');
        th.appendChild(document.createTextNode(h));
        hr.appendChild(th);
    });

    var body = document.createElement('tbody');
    table.appendChild(body);

    for (var i = 0; i < config.numeroHorarios; i++) {
        var tr = document.createElement('tr');
        body.appendChild(tr);

        var td = document.createElement('td');
        td.appendChild(document.createTextNode((i+1) + '°'));
        tr.appendChild(td);

        for (var j = 0; j < config.numeroDiasLetivos; j++) {
            td = document.createElement('td');
            tr.appendChild(td);

            var checkbox = document.createElement('input');
            td.appendChild(checkbox);

            checkbox.type = 'checkbox';
            checkbox.setAttribute('dia') = j;
            checkbox.setAttribute('horario') = i;
            checkbox.setAttribute('id') = profid;
            checkbox.addEventListener('change', registra_disponibilidade, false);
        }
    }
}

function render_professor(prof)
{
    var table = document.getElementById('professores')
        .getElementsByTagName('tbody')[0];
    var linha = table.insertRow(table.rows.length);
    linha.setAttribute('id', prof.id);
    linha.insertCell(0).innerHTML = prof.id;
    linha.insertCell(1).innerHTML = prof.nome;
    linha.insertCell(2).innerHTML = "<input type=number placeholder='Horas' class='horas-pref' min='0'/>";
    linha.cells[2].getElementsByTagName('input')[0].addEventListener('change', registra_horas, false);
    linha.insertCell(3).innerHTML = "<textarea placeholder='Disciplinas' class='disc-pref'></textarea>";
    linha.cells[3].getElementsByTagName('textarea')[0].addEventListener('change', registra_discs, false);
    render_matriz(linha.insertCell(4), prof.id);
}

function render_preferencias_professor()
{
    document.getElementById('professores').getElementsByTagName('tbody')[0].innerHTML = "";
    entrada.professores.forEach(render_professor);
}

function render_disciplina(disc)
{
    var table = document.getElementById('disciplinas').getElementsByTagName('tbody')[0];

    var linha = table.insertRow(table.rows.length);
    linha.setAttribute('id', disc.id);
    linha.insertCell(0).innerHTML = disc.id;
    linha.insertCell(1).innerHTML = disc.nome;
    linha.insertCell(2).innerHTML = "<input type='checkbox' class='disc-dificil'/>";
    linha.cells[2].getElementsByTagName('input')[0].addEventListener('change', registra_dificil, false);
}

function render_disciplinas_dificeis()
{
    document.getElementById('disciplinas').getElementsByTagName('tbody')[0].innerHTML = "";
    entrada.disciplinas.forEach(render_disciplina);
}

function load_file()
{
    render_preferencias_professor();
    render_disciplinas_dificeis();
}

function enviar_json()
{
    if (entrada === null) {
        alert('Selecione um arquivo de entrada.');
        return;
    }

    var json = {
        'entrada': entrada,
        'configuracao': config
    };

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            console.log(xhr.responseText);
        }
    };
    xhr.open('POST', '/gerar_horario', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(json));
}

window.onload = function() {
    document.getElementById('entrada-upload')
        .addEventListener('change', recebe_upload, false);

    document.getElementById('gerar-btn')
        .addEventListener('click', enviar_json, false);
};
