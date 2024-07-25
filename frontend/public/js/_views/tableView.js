import View from "./View.js";

export default class TableView extends View {
  _total = document.querySelector(".table-meta-data .total-count");
  _results = document.querySelector(".table-meta-data .results-count");

  constructor(targetTableElement) {
    super();
    this._table = targetTableElement
      ? targetTableElement.querySelector("tbody")
      : document.querySelector("tbody");
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

  highlight(tableRowEl) {
    if (!tableRowEl.classList.contains("highlight"))
      tableRowEl.classList.add("highlight");
  }

  unhighlight(tableRowEl) {
    if (tableRowEl.classList.contains("highlight"))
      tableRowEl.classList.remove("highlight");
  }

  formatArray(arr, maxLength) {
    // Initialize an empty string to store the formatted result
    let formattedStr = "";

    // Initialize remainingCount with the total number of elements in the array
    let remainingCount = arr.length;

    // Loop through each element in the array
    for (let i = 0; i < arr.length; i++) {
      let element = arr[i];

      // Check if adding the next element would exceed the maxLength
      // +2 accounts for the ", " that separates elements
      if (formattedStr.length + element.length + 2 > maxLength) break; // If it would exceed, exit the loop

      // If formattedStr is not empty, append ", " before adding the next element
      if (formattedStr.length > 0) formattedStr += ", ";

      // Add the current element to formattedStr
      formattedStr += element;

      // Decrease remainingCount as we've added an element to the string
      remainingCount--;
    }

    // If there are remaining elements, append ", and x more" to the string
    if (remainingCount > 0) formattedStr += `, and ${remainingCount} more`;

    // Return the final formatted string
    return formattedStr;
  }
}
