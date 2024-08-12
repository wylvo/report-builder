import TableView from "../../_views/tableView.js";
import { DEFAULT_PROFILE_PICTURE } from "../../config.js";

class AuthenticationLogTableView extends TableView {
  #tableCellMaxCharacterLength = 30;

  constructor() {
    super(document.querySelector(".authentication-log"));
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
        <td data-cell="User-agent">
          <div>-</div>
        </td>
        <td data-cell="Client IP">
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
    const isSuccessful = authenticationLog.isSuccessful ? { class: "good", text: "Yes"} : { class: "attention", text: "No"}

    return `
      <tr class="table-row">
        <td data-cell="Timestamp" title="${authenticationLog.createdAt}">
          <div>${authenticationLog.createdAt} (${this.timeAgo(authenticationLog.createdAt)})</div>
        </td>
        <td data-cell="Email" title="${authenticationLog.email}">
          <div>${authenticationLog.email ?? "N/A"}</div>
        </td>
        <td data-cell="User-agent" title="${authenticationLog.userAgent}">
          <div>${authenticationLog.userAgent}</div>
        </td>
        <td data-cell="Client IP" title="${authenticationLog.clientIp}">
          <div>${authenticationLog.clientIp}</div>
        </td>
        <td data-cell="Successful">
          <div><p class="${isSuccessful.class}">${isSuccessful.text}</p></div>
        </td>
      </tr>
    `;
  }
}

export default new AuthenticationLogTableView();
