import View from "./View.js";

export class PaginationView extends View {
  // prettier-ignore
  constructor(targetTableElement) {
    super();
    
    this._targetTableElement = targetTableElement;
    this._rowsPerPageSelect = document.querySelector(".table-rows-per-page");
    this._rowsPerPage = +document.querySelector(".table-rows-per-page").value;
    this._paginationElements = Array.from(document.querySelectorAll(".table-pagination"));
  }

  rowsPerPage() {
    return this._rowsPerPage;
  }

  renderAll(pages) {
    this._clearPagination();
    this._paginationElements.forEach((element) => {
      element.appendChild(this.htmlStringToElement(this._generateHtml(pages)));
    });
  }

  // prettier-ignore
  _generateHtml(page) {
    if(page.start) page.start = page.start.toString().escapeHTML();
    if(page.previous) page.previous = page.previous.toString().escapeHTML();
    if(page.current) page.current = page.current.toString().escapeHTML();
    if(page.next) page.next = page.next.toString().escapeHTML();
    if(page.end) page.end = page.end.toString().escapeHTML();

    return `
      <div>
        <button ${!page.start ? "disabled" : ""} data-page="${page.start}" class="table-pagination-btn">
          <svg class="icons">
            <use href="/img/icons.svg#icon-double-chevron-left"></use>
          </svg>
        </button>
        <button ${!page.previous ? "disabled" : ""} data-page="${page.previous}" class="table-pagination-btn">
          <svg class="icons">
            <use href="/img/icons.svg#icon-chevron-left"></use>
          </svg>
        </button>
        <span class="table-pagination-text">${page.current}</span>
        <button ${!page.next ? "disabled" : ""} data-page="${page.next}" class="table-pagination-btn">
          <svg class="icons">
            <use href="/img/icons.svg#icon-chevron-right"></use>
          </svg>
        </button>
          <button ${!page.end ? "disabled" : ""} data-page="${page.end}" class="table-pagination-btn">
          <svg class="icons">
            <use href="/img/icons.svg#icon-double-chevron-right"></use>
          </svg>
        </button>
      </div>
    `;
  }

  _clearPagination() {
    this._paginationElements.forEach((element) => {
      element.innerHTML = "";
    });
  }

  addHandlerClickPage(handler) {
    this._paginationElements.forEach((element) => {
      element.addEventListener("click", function (e) {
        const btn = e.target.closest(".table-pagination-btn");
        if (!btn) return;

        const page = +btn.dataset.page;
        handler(page);
      });
    });
  }

  addHandlerOnChangeRowsPerPage(handler) {
    this._rowsPerPageSelect.addEventListener("change", (e) => {
      const rows = +e.target.value;
      handler(rows);
    });
  }
}

export default new PaginationView();
