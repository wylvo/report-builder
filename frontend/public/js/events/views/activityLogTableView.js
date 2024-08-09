import TableView from "../../_views/tableView.js";
import { DEFAULT_PROFILE_PICTURE } from "../../config.js";

class ActivityLogTableView extends TableView {
  #tableCellMaxCharacterLength = 30;

  constructor() {
    super();
  }

  _generateEmptyRowHtml() {
    return `
      <tr class="table-row">
        <td data-cell="Timestamp">
          <div>-</div>
        </td>
        <td data-cell="Username">
          <div>-</div>
        </td>
        <td data-cell="Method">
          <div>-</div>
        </td>
        <td data-cell="Status Code">
          <div>-</div>
        </td>
        <td data-cell="URL">
          <div>-</div>
        </td>
      </tr>
    `;
  }

  // prettier-ignore
  _generatetHtml(activityLog) {
    const fullDate = new Date(activityLog.createdAt).toDateString();

    const username = this.users.find((user) => user.username === activityLog.username)
    const profilePicture = username?.profilePictureURI
      ? username.profilePictureURI
      : DEFAULT_PROFILE_PICTURE;

    return `
      <tr class="table-row">
        <td data-cell="Timestamp"><div>${fullDate}</div></td>
        <td data-cell="Username">
          <div>
            <img class="table-row-cell-pp" src="${profilePicture}" alt="Profile picture of ${username?.fullName || "N/A"}" />
          </div>
        </td>
        <td data-cell="Method"><div>${activityLog.method}</div></td>
        <td data-cell="Status Code"><div>${activityLog.statusCode}</div></td>
        <td data-cell="URL"><div>${activityLog.url}</div></td>
      </tr>
    `;
  }
}

export default new ActivityLogTableView();
