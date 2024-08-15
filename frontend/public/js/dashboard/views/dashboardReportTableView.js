import TableView from "../../_views/tableView.js";
import { DEFAULT_PROFILE_PICTURE } from "../../config.js";

class DashboardReportTableView extends TableView {
  #tableCellMaxCharacterLength = 30;

  constructor() {
    super(document.querySelector(".reports"));
  }

  _generateEmptyRowHtml() {
    return `
      <tr>
        <td data-cell="Created By">-</td>
        <td data-cell="Created">-</td>
        <td data-cell="Date">-</td>
        <td data-cell="Title">-</td>
        <td data-cell="Status">-</td>
        <td data-cell="Assigned To">-</td>
        <td data-cell="Procedural">-</td>
      </tr>
    `;
  }

  // prettier-ignore
  _generatetHtml(report) {
    const date = new Date(`${report.call.date} ${report.call.time}`).toDateString();
    const time = report.call.dateTime.split(" ").slice(1, 3).join(" ");
    const formattedDate = `${date}, ${time}`;
    const status = {
      class: report.call.status.includes("In Progress") ? "in-progress" : "completed",
      text: report.call.status
    }
    const isProcedural = report.incident.isProcedural
      ? { class: "attention", text: "Yes" }
      : { class: "", text: "No" };

    const isOnCallClass = report.isOnCall ? "on-call" : "";

    const createdBy = this.users.find((user) => user.username === report.createdBy)
    const profilePictureCreatedBy = createdBy?.profilePictureURI
      ? createdBy.profilePictureURI
      : DEFAULT_PROFILE_PICTURE;

    const assignedTo = this.users.find((user) => user.username === report.assignedTo)
    const profilePictureAssignedTo = assignedTo?.profilePictureURI
    ? assignedTo.profilePictureURI
    : DEFAULT_PROFILE_PICTURE;

    return `
      <tr>
        <td data-cell="Created By">
          <img class="table-row-cell-pp" src="${profilePictureCreatedBy}" alt="Profile picture of ${createdBy?.fullName || "N/A"}" />
          <p>${createdBy?.fullName}</p>
        </td>
        <td data-cell="Created">${this.timeAgo(report.createdAt)}</td>
        <td data-cell="Date"><span class="${isOnCallClass}">${formattedDate}</span></td>
        <td data-cell="Title">
          <a class="table-row-link" href="/reports#${report.id}">${report.incident.title}</a>
        </td>
        <td data-cell="Status">
          <span class="status ${status.class}">${status.text}</span>
        </td>
        <td data-cell="Assigned To">
          <img class="table-row-cell-pp" src="${profilePictureAssignedTo}" alt="Profile picture of ${assignedTo?.fullName || "N/A"}" />
          <p>${assignedTo?.fullName}</p>
        </td>
        <td data-cell="Procedural">
          <span class="status ${isProcedural.class}">${isProcedural.text}</span>
        </td>
      </tr>
      `;
  }
}

export default new DashboardReportTableView();
