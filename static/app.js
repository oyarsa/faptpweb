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
    }
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

function render_professor(prof)
{
    var texto = "<span>#(" + prof.id + ") " + prof.nome + "</span>";
    var horas = "<input type=number placeholder='Horas'/>";
    var disciplinas = "<input placeholder='Disciplinas'/>";

    var final =
        "<div class='prof' id='" + prof.id + "'>" +
            texto + " " + horas + " " + disciplinas +
        "</div>";

    document.getElementById('professores').innerHTML += final;
}

function render_preferencias_professor()
{
    document.getElementById('professores').innerHTML = "";
    entrada.professores.forEach(render_professor);
}

function render_disciplina(disc)
{
    var texto = "<span>" + disc.id + " - " + disc.nome + "(" + disc.periodo + ")";
    var checkbox = "<input type='checkbox'/>";

    var final =
        "<div class='disc' id='" + disc.id + "'>" +
            texto + checkbox +
        "</div>";

    document.getElementById('disciplinas').innerHTML += final;
}

function render_disciplinas_dificeis()
{
    document.getElementById('disciplinas').innerHTML = "";
    entrada.disciplinas.forEach(render_disciplina);
}

function load_file()
{
    console.log(entrada);
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
