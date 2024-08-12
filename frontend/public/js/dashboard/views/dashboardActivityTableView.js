import TableView from "../../_views/tableView.js";
import { DEFAULT_PROFILE_PICTURE } from "../../config.js";

class DashboardActivityTableView extends TableView {
  #tableCellMaxCharacterLength = 30;

  constructor() {
    super(document.querySelector(".activity-log"));
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
        <td data-cell="User">
          <img class="table-row-cell-pp" src="${userProfilePicture}" alt="Profile picture of ${user?.fullName || "N/A"}" />
          <p>${user?.fullName}</p>
        </td>
        <td data-cell="Timestamp"><span>${this.timeAgo(activityLog.createdAt)}</span></td>
        <td data-cell="Method">
          <span class="status ${operation.class}">${operation.text}</span>
        </td>
        <td data-cell="URL">
          <span>${activityLog.url}</span>
        </td>
      </tr>
      `;
  }
}

export default new DashboardActivityTableView();
