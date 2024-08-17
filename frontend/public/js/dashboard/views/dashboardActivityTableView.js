import TableView from "../../_views/tableView.js";
import { DEFAULT_PROFILE_PICTURE } from "../../config.js";

class DashboardActivityTableView extends TableView {
  #tableCellMaxCharacterLength = 30;

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

  _generateEmptyRowHtml() {
    return `
      <tr>
        <td data-cell="User">-</td>
        <td data-cell="Timestamp">-</td>
        <td data-cell="Method">-</td>
        <td data-cell="URL">-</td>
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

    const user = this.users.find((user) => user.username === activityLog.username)
    const userProfilePicture = user?.profilePictureURI
      ? user.profilePictureURI
      : DEFAULT_PROFILE_PICTURE;

    return `
      <tr>
        <td data-cell="User" title="${user?.fullName}">
          <img class="table-row-cell-pp" src="${userProfilePicture}" alt="Profile picture of ${user?.fullName || "N/A"}" />
          <p>${user?.fullName}</p>
        </td>
        <td data-cell="Timestamp" title="${activityLog.createdAt}"><span>${this.timeAgo(activityLog.createdAt)}</span></td>
        <td data-cell="Method" title="${activityLog.method}">
          <span class="status ${operation.class}">${operation.text}</span>
        </td>
        <td data-cell="URL" title="${activityLog.url}">
          <span>${activityLog.url}</span>
        </td>
      </tr>
      `;
  }
}

export default new DashboardActivityTableView();
