import TableView from "../../_views/tableView.js";
import { DEFAULT_PROFILE_PICTURE } from "../../config.js";

class AuthenticationLogTableView extends TableView {
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
        <td data-cell="Email">
          <div>-</div>
        </td>
        <td data-cell="Remote IP">
          <div>-</div>
        </td>
        <td data-cell="User-agent">
          <div>-</div>
        </td>
        <td data-cell="Successful">
          <div>-</div>
        </td>
      </tr>
    `;
  }

  // prettier-ignore
  _generatetHtml(authenticationLog) {
    const fullDate = new Date(authenticationLog.createdAt).toDateString();
    return `
      <tr class="table-row">
        <td data-cell="Timestamp"><div>${fullDate}</div></td>
        <td data-cell="Email"><div>${authenticationLog.email}</div></td>
        <td data-cell="Remote IP"><div>${authenticationLog.remoteIp}</div></td>
        <td data-cell="User-agent"><div>${authenticationLog.userAgent}</div></td>
        <td data-cell="Successful"><div>${authenticationLog.isSuccessful}</div></td>
      </tr>
    `;
  }
}

export default new AuthenticationLogTableView();
