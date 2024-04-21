import View from "./View.js";

export default class TableView extends View {
  _table = document.querySelector("tbody");
  _count = document.querySelector(".table-meta-data .count");

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

  update(data) {
    const { currentElement, newElement } = this._generateRowElement(data);
    currentElement.replaceWith(newElement);
    return newElement;
  }

  updateTotalCount(array) {
    this._count.textContent = array.length;
  }
}
