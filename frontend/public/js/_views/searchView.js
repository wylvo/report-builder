export class SearchView {
  constructor(targetTableElement) {
    this._targetTableElement = targetTableElement;
    this._form = document.querySelector(".table-filter");
    this._inputFilterSearch = document.querySelector(".table-filter-search");
    this._filterBy = document.querySelector(".table-filter-by");

    this.#addHandlerOnChangeFilterBy();
  }

  query() {
    return this._inputFilterSearch.value;
  }

  filterBy() {
    return this._filterBy.value;
  }

  clearQuery() {
    return (this._inputFilterSearch.value = "");
  }

  #addHandlerOnChangeFilterBy() {
    this._filterBy.addEventListener("change", () => {
      this.clearQuery();
    });
  }

  addHandlerClearSearch(handler) {
    this._form.addEventListener("input", (e) => {
      if (e.target.value === "") {
        this._form.requestSubmit();
        handler();
      }
    });
  }

  addHandlerSearch(handler) {
    this._form.addEventListener("submit", function (e) {
      e.preventDefault();
      handler();
    });
  }
}

export default new SearchView();
