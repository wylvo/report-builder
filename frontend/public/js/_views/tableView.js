import View from "./View.js";

export default class TableView extends View {
  _table = document.querySelector("tbody");
  _total = document.querySelector(".table-meta-data .total-count");
  _results = document.querySelector(".table-meta-data .results-count");

  constructor() {
    super();
  }

  #clearTable() {
    this._table.innerHTML = "";
  }

  _generateRowElement(data) {
    if (!data) return this.htmlStringToElement(this._generateEmptyRowHtml());
    return this._escapeHtml(data);
  }

  renderAll(array) {
    this.#clearTable();

    if (!Array.isArray(array) || (Array.isArray(array) && array.length === 0))
      return this._table.appendChild(this._generateRowElement());
    array.forEach((data) => {
      this._table.appendChild(this._generateRowElement(data).newElement);
    });
  }

  // prettier-ignore
  render(data) {
    if(!window.location.hash) window.location.hash = data.id;
    this._table.insertBefore(this._generateRowElement(data).newElement, this._table.firstChild);
    return data.tableRowEl;
  }

  renderTableSpinner() {
    this.#clearTable();

    const html = `
      <tr class="table-row">
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td>
          <div class="icons icon-spinner alt">
            <svg>
              <g class="spinner">
                <use href="/img/icons.svg#icon-loader"></use>
              </g>
            </svg>
          </div>
        </td>
        <td></td>
        <td></td>
      </tr>
    `;

    const element = this.htmlStringToElement(html);
    this._table.appendChild(element);
  }

  update(data) {
    const { currentElement, newElement } = this._generateRowElement(data);
    currentElement.replaceWith(newElement);
    return newElement;
  }

  updateTotalCount(total) {
    if (Array.isArray(total)) this._total.textContent = total.length;
    else this._total.textContent = total;
  }

  updateResultCount(total) {
    if (Array.isArray(total)) this._results.textContent = total.length;
    else this._results.textContent = total;
  }
}
