import os
import json
import sys
from subprocess import PIPE, run, STDOUT, CalledProcessError
from flask import Flask, request, abort, render_template, Response

FAPTP = sys.argv[1]
INPUT_FILE = 'intemp'
OUTPUT_FILE = 'outtemp'
CONFIG_FILE = 'conftemp'
app = Flask(__name__)


def executar_solver(dados):
    entrada = dados['entrada']
    configuracao = dados['configuracao']

    with open(INPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(entrada, f)

    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(configuracao, f)

    args = [faptp, '-i', INPUT_FILE, '-o', OUTPUT_FILE, '-c', CONFIG_FILE]
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

    return saida


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/gerar_horario', methods=['POST'])
def gerar_horario():
    dados = request.json
    print(dados)

    try:
        saida = executar_solver(dados)
        return Response(saida, mimetype='application/json')
    except:
        abort(401)


if __name__ == '__main__':
    app.run(port=int("80"), debug=True)
