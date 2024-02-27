class SearchView {
  #form = document.querySelector(".table-filter");
  #inputFilterSearch = document.querySelector(".table-filter-search");
  #filterBy = document.querySelector(".table-filter-by");

  constructor() {
    this.#addHandlerOnChangeFilterBy();
  }

  query() {
    return this.#inputFilterSearch.value;
  }

  filterBy() {
    return this.#filterBy.value;
  }

  #clearQuery() {
    return (this.#inputFilterSearch.value = "");
  }

  #addHandlerOnChangeFilterBy() {
    this.#filterBy.addEventListener("change", () => {
      this.#clearQuery();
    });
  }

  addHandlerClearSearch(handler) {
    this.#form.addEventListener("input", (e) => {
      if (e.target.value === "") {
        this.#form.requestSubmit();
        handler();
      }
    });
  }

  addHandlerSearch(handler) {
    this.#form.addEventListener("submit", function (e) {
      e.preventDefault();
      handler();
    });
  }
}

export default new SearchView();
