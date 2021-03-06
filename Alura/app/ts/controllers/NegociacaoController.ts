import { Negociacao, Negociacoes, NegociacaoParcial } from '../models/index';
import { NegociacoesView, MensagemView } from '../views/index';
import { domInject, meuDecoratorDeClasse, throttle } from '../helpers/decorators/index';
import { NegociacaoService } from '../services/index';
import { imprimir } from '../helpers/index';

@meuDecoratorDeClasse()
export class NegociacaoController {

  @domInject('#data')
  private _inputData: JQuery;
  @domInject('#valor')
  private _inputValor: JQuery;
  @domInject('#quantidade')
  private _inputQuantidade: JQuery;

  private _negociacoes = new Negociacoes();
  private _negociacoesView = new NegociacoesView('#negociacoesView');
  private _mensagemView = new MensagemView('#mensagemView');
  private _service = new NegociacaoService();

  constructor() {
    this._negociacoesView.update(this._negociacoes);
  }

  @throttle()
  adicionar(): void {
    const data = new Date(this._inputData.val().replace(/-/g, ','));

    if (!this._ehDiaUtil(data)) {
      this._mensagemView.update('As negociações só podem ser executadas em dias úteis.');
      return;
    }

    const negociacao = new Negociacao(
      data,
      parseInt(this._inputQuantidade.val()),
      parseFloat(this._inputValor.val())
    );

    this._negociacoes.adicionar(negociacao);
    this._negociacoesView.update(this._negociacoes);
    this._mensagemView.update('Negociação adicionada com sucesso!');

    imprimir(negociacao, this._negociacoes);
  }

  private _ehDiaUtil(data: Date): boolean {
    const diaDaSemana = data.getDay();
    return diaDaSemana != DiasDaSemana.Sabado && diaDaSemana != DiasDaSemana.Domingo;
  }

  @throttle()
  async importarDados(): Promise<void> {

    try {

      function _isOK(res: Response): Response {
        if (res.ok)
          return res
        else
          throw new Error(res.statusText);
      }
      const negociacoesParaImportar = await this._service.obterNegociacoes(_isOK);
      const negociacoesJaImportadas = this._negociacoes.paraArray();

      negociacoesParaImportar
        .filter(negociacao =>
          !negociacoesJaImportadas.some((negociacaoImportada: Negociacao) => negociacao.ehIgual(negociacaoImportada)))
        .forEach(negociacao => this._negociacoes.adicionar(negociacao));

      this._negociacoesView.update(this._negociacoes);

    } catch (err) {
      this._mensagemView.update(err.message)
    }

  }

}

enum DiasDaSemana {
  Domingo,
  Segunda,
  Terca,
  Quarta,
  Quinta,
  Sexta,
  Sabado
}