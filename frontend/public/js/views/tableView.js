import View from "./View.js";

export default class tableView extends View {
  _table = document.querySelector("tbody");
  _count = document.querySelector(".table-meta-data .count");
  _data;

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
    this._data = array;

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

  updateTotalCount(array) {
    this._count.textContent = array.length;
  }
}
