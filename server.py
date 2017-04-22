import os
import pprint
import json
import sys
import sqlite3
from subprocess import PIPE, run, STDOUT, CalledProcessError
from flask import Flask, request, render_template, jsonify

# Caminho para o executável do solver
FAPTP = sys.argv[1]
# Nome do arquivo do banco do SQLite3
DBNAME = "faptp.db"
# Nome arquivo temporário para a entrada
INPUT_FILE = 'intemp'
# Nome arquivo temporário para a saída
OUTPUT_FILE = 'outtemp'
# Nome arquivo temporário para a configuração
CONFIG_FILE = 'conftemp'

app = Flask(__name__)


def init_db():
    "Inicializa o banco, criando a tabela se ela não existir"
    conn = sqlite3.connect(DBNAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS Solucoes
                (id INTEGER PRIMARY KEY, entrada TEXT, config TEXT, saida TEXT)''')
    conn.commit()
    conn.close()


def insert_solucao(entrada, config, saida):
    """Insere os JSONs de entrada e configuração recebidos, além da saída
    gerada após solucionar o problema, no banco.

    Retorna a chave da tupla inserida.
    """
    entrada = json.dumps(entrada)
    config = json.dumps(config)
    saida = json.dumps(saida)
    sql = '''INSERT INTO Solucoes (entrada, config, saida)
             VALUES (?, ?, ?)'''

    conn = sqlite3.connect(DBNAME)
    c = conn.cursor()
    c.execute(sql, (entrada, config, saida))
    pk = c.lastrowid
    conn.commit()
    conn.close()

    return pk


def recupera_solucao(pk):
    "A partir da `pk`, recupera os dados de entrada, configuração e solução."
    sql = 'SELECT * FROM Solucao WHERE id = ?'

    conn = sqlite3.connect(DBNAME)
    c.execute(sql, (pk,))
    tupla = c.fetchone()

    if tupla is None:
        result = None
    else:
        key, entrada, config, saida = tupla
        result = dict(id=key, entrada=entrada, configuracao=config, saida=saida)

    conn.close()
    return result


def executar_solver(dados):
    """Executa o solver a partir dos dados de entrada. `dados` deve conter
    dois dicts: `entrada` e `configuracao`. O primeiro será a entrada do solver,
    enquant o segundo será usado para a configuração dos parâmetros e modo de
    execução (qual algoritmo, qual FO, pesos da FO se aplicável).

    Retorna um par, onde o primeiro elemento é o JSON gerado pelo solver
    contendo a solução, e o segundo elemento é a chave da tupla no banco de
    dados, sendo possíveis recuperar a entrada e configuração utilizados,
    além da própria solução.
    """
    entrada = dados['entrada']
    configuracao = dados['configuracao']

    with open(INPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(entrada, f)

    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(configuracao, f)

    args = [FAPTP, '-i', INPUT_FILE, '-o', OUTPUT_FILE, '-c', CONFIG_FILE]

    try:
        processo = run(args, universal_newlines=True)
        processo.check_returncode()
    except CalledProcessError as e:
        print('Erro ao executar o processo, código: {}, mensagem: {}'
              .format(e.returncode, e.stderr))
        raise
    except FileNotFoundError as e:
        print('Executável do faptp não encontrado: {}'.format(e.strerror))
        raise
    finally:
        os.remove(INPUT_FILE)
        os.remove(CONFIG_FILE)

    with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
        saida = f.read()
    os.remove(OUTPUT_FILE)

    pk = insert_solucao(entrada, configuracao, saida)
    return saida, pk


def error(status_code, message):
    """Constrói uma resposta que envia um código de erro e um JSON com
    uma mensagem de explicação.
    """
    res = jsonify(message=message)
    res.status_code = status_code
    return res


@app.route('/')
def home():
    "Rota principal, renderiza o formulário"
    return render_template('index.html')


@app.route('/gerar_horario', methods=['POST'])
def gerar_horario():
    """Endpoint de execução do solver. Recebe por POST um JSON com dois campos:
    um JSON `configuracao` com os parâmetros de configuração do solver, e outro
    JSON `entrada` com os dados de entrada para o solver.

    Se a execução do solver for bem sucedida, a resposta contém um JSON com dois
    campos: `saida`, que contém o JSON com a solução, e `id` que contém a
    identificação dessa execução no banco de dados, que pode ser usada para
    recuperar os dados de entrada e configuração, além da saída.
    """
    dados = request.json
    pprint.pprint(dados)

    try:
        saida, pk = executar_solver(dados)
        return jsonify(saida=saida, id=pk)
    except Exception as e:
        print('Exceção: ', e)
        return error(401, "Impossível executar o solver")


@app.route('/solucao/<int:key>/')
def solucao(key):
    """Endpoint de recuperação de uma solução a partir de sua chave.

    Se a chave existir, retorna um JSON com três campos: `entrada`, um
    objeto com os dados de entrada fornecidos, `configuracao`, um objeto com
    os parâmetros de configuração e `saida`, o resultado da execução do solver.
    Se a chave não existir, é retornado um código 400 com uma mensagem.
    """
    dados = recupera_solucao(key)
    if dados is None:
        print('Solução não encontrada')
        return error(400, "Solução não encontrada")
    else:
        return jsonify(dados)


if __name__ == '__main__':
    init_db()
    app.run(port=int("80"), debug=True)
