import os
import pprint
import json
import sys
import sqlite3
from subprocess import PIPE, run, STDOUT, CalledProcessError
from flask import Flask, request, abort, render_template, jsonify

FAPTP = sys.argv[1]
DBNAME = "faptp.db"
INPUT_FILE = 'intemp'
OUTPUT_FILE = 'outtemp'
CONFIG_FILE = 'conftemp'
app = Flask(__name__)

def init_db():
    conn = sqlite3.connect(DBNAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS Solucoes
                (id INTEGER PRIMARY KEY, entrada TEXT, config TEXT, saida TEXT)''')
    conn.commit()
    conn.close()


def insert_solucao(entrada, config, saida):
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


def executar_solver(dados):
    entrada = dados['entrada']
    configuracao = dados['configuracao']

    with open(INPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(entrada, f)

    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(configuracao, f)

    args = [FAPTP, '-i', INPUT_FILE, '-o', OUTPUT_FILE, '-c', CONFIG_FILE]
    processo = run(args, universal_newlines=True)

    try:
        processo.check_returncode()
    except CalledProcessError as e:
        print('Erro ao executar o processo, código: {}, mensagem: {}'
              .format(e.returncode, e.stderr))
        raise
    finally:
        os.remove(INPUT_FILE)
        os.remove(CONFIG_FILE)

    with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
        saida = f.read()
    os.remove(OUTPUT_FILE)

    pk = insert_solucao(entrada, configuracao, saida)
    return saida, pk


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/gerar_horario', methods=['POST'])
def gerar_horario():
    dados = request.json
    pprint.pprint(dados)

    try:
        saida, pk = executar_solver(dados)
        return jsonify(saida=saida, id=pk)
    except Exception as e:
        print(e)
        abort(401)


if __name__ == '__main__':
    init_db()
    app.run(port=int("80"), debug=True)
