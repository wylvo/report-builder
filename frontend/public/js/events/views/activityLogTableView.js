import TableView from "../../_views/tableView.js";
import { DEFAULT_PROFILE_PICTURE } from "../../config.js";

export class ActivityLogTableView extends TableView {
  constructor() {
    super(document.querySelector(".activity-log"));

    this._table = this.targetTableElement.querySelector("tbody");
    this._total = this.targetTableElement.querySelector(
      ".table-meta-data .total-count"
    );
    this._results = this.targetTableElement.querySelector(
      ".table-meta-data .results-count"
    );
  }

  #clearTable() {
    this._table.innerHTML = "";
  }

  renderTableSpinner() {
    this.#clearTable();

    const html = `
      <tr class="table-row">
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

  _generateEmptyRowHtml() {
    return `
      <tr class="table-row">
        <td data-cell="User">
          <div>-</div>
        </td>
        <td data-cell="Timestamp">
          <div>-</div>
        </td>
        <td data-cell="URL">
          <div>-</div>
        </td>
        <td data-cell="Method">
          <div>-</div>
        </td>
        <td data-cell="Status Code">
          <div>-</div>
        </td>
      </tr>
    `;
  }

  // prettier-ignore
  _generatetHtml(activityLog) {
    const operation =
      activityLog.method === "DELETE"
        ? { class: "attention", text: "DELETE" }
        : activityLog.method === "PUT"
        ? { class: "warning", text: "UPDATE" }
        : activityLog.method === "POST"
        ? { class: "good", text: "CREATE" }
        : { class: "", text: activityLog.method };

    const statusCodeClass =
      activityLog.statusCode < 400 ? "good": "attention";

    const user = this.users.find((user) => user.username === activityLog.username)
    const userProfilePicture = user?.profilePictureURI
      ? user.profilePictureURI
      : DEFAULT_PROFILE_PICTURE;

    return `
      <tr class="table-row">
        <td data-cell="User" title="${user?.fullName}">
          <div>
            <img class="table-row-cell-pp" src="${userProfilePicture}" alt="Profile picture of ${user?.fullName || "N/A"}" />
            <p>${user?.fullName}</p>
          </div>
        </td>
        <td data-cell="Timestamp" title="${activityLog.createdAt}">
          <div>${activityLog.createdAt} (${this.timeAgo(activityLog.createdAt)})</div>
        </td>
        <td data-cell="URL" title="${activityLog.url}">
          <div>${activityLog.url}</div>
        </td>        
        <td data-cell="Method" title="${activityLog.method}">
          <div><p class="${operation.class}">${operation.text}</p></div>
        </td>
        <td data-cell="Status Code">
          <div><p class="${statusCodeClass}">${activityLog.statusCode}</p></div>
        </td>
      </tr>
      `;
  }
}

export default new ActivityLogTableView();
