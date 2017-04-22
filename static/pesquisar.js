window.onload = () => {
    document.getElementById('solucao-pesquisar').addEventListener('click', pesquisar, false)
}

function pesquisar() {
    const id = Number.parseInt(document.getElementById('solucao-id').value)

    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            const res = JSON.parse(xhr.responseText)
            if (xhr.status === 200)
                disponibilizar_solucao(res)
            else
                alert('Erro: ' + res.message)
        }
    }
    xhr.open('GET', `/solucao/${id}`, true)
    xhr.send()
}

function json_file_download(data, filename, text) {
    const url = document.createElement('a');
    url.href = window.URL.createObjectURL(new Blob([data], { type: 'text/json' }))
    url.download = `${filename}.json`
    url.textContent = text
    return url
}

function disponibilizar_solucao(res) {
    const solucao = document.getElementById('solucao')
    solucao.innerHTML = ""

    solucao.appendChild(json_file_download(res.entrada, 'input', 'Entrada'))
    solucao.appendChild(document.createElement('br'))
    solucao.appendChild(json_file_download(res.configuracao, 'config', 'Configuração'))
    solucao.appendChild(document.createElement('br'))
    solucao.appendChild(json_file_download(res.saida, 'solucao', 'Solução'))
}
