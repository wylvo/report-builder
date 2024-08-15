import { PaginationView } from "../../_views/paginationView.js";

export class AuthenticationLogPaginationView extends PaginationView {
  // prettier-ignore
  constructor() {
    super(document.querySelector(".authentication-log"));
    
    this._rowsPerPageSelect = this._targetTableElement.querySelector(".table-rows-per-page");
    this._rowsPerPage = +this._targetTableElement.querySelector(".table-rows-per-page").value;
    this._paginationElements = Array.from(this._targetTableElement.querySelectorAll(".table-pagination"));
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

export default new AuthenticationLogPaginationView();
