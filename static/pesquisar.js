/**
 * Registra evento de pesquisa.
 */
window.onload = function () {
    document.getElementById('solucao-pesquisar').addEventListener('click', pesquisar, false)
}
/**
 * Faz requisição para o endpoint de pesquisa.
 */
function pesquisar() {
    const id = parseInt(document.getElementById('solucao-id').value)
    const xhr = new XMLHttpRequest()
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
/**
 * Cria um elemento contendo um link para um arquivo na memória contendo
 * uma string de um JSON.
 * @param {string} data String de um JSON.
 * @param {string} filename Nome do arquivo.
 * @param {string} text Texto do link.
 * @returns {HTMLAchorElement} Elemento âncora com link para o arquvo na memória.
 */
function json_file_download(data, filename, text) {
    const url = document.createElement('a')
    url.href = window.URL.createObjectURL(new Blob([data], { type: 'text/json' }))
    url.download = `${filename}.json`
    url.textContent = text
    return url
}
/**
 * Mostra links para download dos objetos da resposta do serivdor.
 * @param {object} res Resposta contendo três sub-objetos:
 *     <tt>input</tt>, <tt>configuracao</tt> e <tt>saida</tt>.
 */
function disponibilizar_solucao(res) {
    const solucao = document.getElementById('solucao')
    solucao.innerHTML = ""
    solucao.classList.add('box')

    solucao.appendChild(json_file_download(res.entrada, 'input', 'Entrada'))
    solucao.appendChild(document.createElement('br'))

    solucao.appendChild(json_file_download(res.configuracao, 'config', 'Configuração'))
    solucao.appendChild(document.createElement('br'))

    solucao.appendChild(json_file_download(res.saida, 'solucao', 'Solução (JSON)'))
    solucao.appendChild(document.createElement('br'))

    const solucao_html = document.createElement('a')
    solucao.appendChild(solucao_html)
    solucao_html.href = `/horario/${res.id}`
    solucao_html.textContent = 'Solução (HTML)'
}
