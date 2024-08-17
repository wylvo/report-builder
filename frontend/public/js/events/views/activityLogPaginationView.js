import { PaginationView } from "../../_views/paginationView.js";

export class ActivityLogPaginationView extends PaginationView {
  // prettier-ignore
  constructor() {
    super(document.querySelector(".activity-log"));

    this._rowsPerPageSelect = this._targetTableElement.querySelector(".table-rows-per-page");
    this._rowsPerPage = +this._targetTableElement.querySelector(".table-rows-per-page").value;
    this._paginationElements = Array.from(this._targetTableElement.querySelectorAll(".table-pagination"));
  }

  addHandlerClickPage(handler) {
    this._paginationElements.forEach((element) => {
      element.addEventListener("click", (e) => {
        const btn = e.target.closest(".table-pagination-btn");
        if (!btn) return;

        const page = +btn.dataset.page;
        handler(page, this);
      });
    });
  }

  addHandlerOnChangeRowsPerPage(handler) {
    this._rowsPerPageSelect.addEventListener("change", (e) => {
      const rows = +e.target.value;
      handler(rows, this);
    });
  }
}

export default new ActivityLogPaginationView();
