import { SearchView } from "../../_views/searchView.js";

export class ActivityLogSearchView extends SearchView {
  // prettier-ignore
  constructor() {
    super(document.querySelector(".activity-log"));

    this._form = this._targetTableElement.querySelector(".table-filter");
    this._inputFilterSearch = this._targetTableElement.querySelector(".table-filter-search");
    this._filterBy = this._targetTableElement.querySelector(".table-filter-by");
  }

  addHandlerClearSearch(handler) {
    this._form.addEventListener("input", (e) => {
      if (e.target.value === "") {
        this._form.requestSubmit();
        handler(this);
      }
    });
  }

  addHandlerSearch(handler) {
    this._form.addEventListener("submit", (e) => {
      e.preventDefault();
      handler(this);
    });
  }
}

export default new ActivityLogSearchView();
