import TableView from "../../_views/tableView.js";
import { DEFAULT_PROFILE_PICTURE } from "../../config.js";

class ReportTableView extends TableView {
  #btnAllReports = document.querySelector("#table-reports");
  #btnAllDeletedReports = document.querySelector("#table-delete-reports");
  #tableCellMaxCharacterLength = 30;
  isDeletedViewActive = false;

  constructor() {
    super();
  }

  _generateEmptyRowHtml() {
    return `
      <tr class="table-row">
        <td data-cell="TECH">
          <div>N/A</div>
        </td>
        <td data-cell="Call Date">
          <div>-</div>
        </td>
        <td data-cell="Title">
          <div>-</div>
        </td>      
        <td data-cell="Status">
          <div>-</div>
        </td>
        <td data-cell="Assigned To">
          <div>-</div>
        </td>        
        <td data-cell="Store">
          <div>-</div>
        </td>
        <td data-cell="Employee">
          <div>-</div>
        </td>
        <td data-cell="Procedural">
          <div>-</div>
        </td>
        <td data-cell="Type">
          <div>-</div>
        </td>
        <td data-cell="Actions">
          <div></div>
        </td>
      </tr>
    `;
  }

  // prettier-ignore
  _generatetHtml(report) {
    const date = new Date(`${report.call.date} ${report.call.time}`).toDateString();
    const time = report.call.dateTime.split(" ").slice(1, 3).join(" ");
    const formattedDate = `${date}, ${time}`;
    const status = {
      class: report.call.status.includes("In Progress") ? "warning" : "good",
      text: report.call.status
    }
    const isProcedural = report.incident.isProcedural
      ? { class: `class="attention"`, text: "Yes" }
      : { class: "", text: "No" };


    const createdBy = this.users.find((user) => user.username === report.createdBy)
    const profilePicture = createdBy?.profilePictureURI
      ? createdBy.profilePictureURI
      : DEFAULT_PROFILE_PICTURE;

    const isOnCallClass = report.isOnCall ? "on-call" : "";
    const assignedTo = this.users.find((user) => user.username === report.assignedTo)

    const storeNumbers =
      this.formatArray(report.store.numbers, this.#tableCellMaxCharacterLength);
    const incidentTypes =
      this.formatArray(report.incident.types, this.#tableCellMaxCharacterLength);

    const buttons = !report.isDeleted 
      ? `
        <div>
          <button ${report.isWebhookSent ? "disabled" : ""} class="btn teams icons">
            <svg>
              <use href="/img/icons.svg#icon-ms-teams"></use>
            </svg>
          </button>
          <button class="btn delete icons">
            <svg>
              <use href="/img/icons.svg#icon-delete"></use>
            </svg>
          </button>
        </div>
      `
      :`
        <div>
          <button class="btn undo icons">
            <svg>
              <use href="/img/icons.svg#icon-undo"></use>
            </svg>
          </button>
        </div>
      `;

    return `
      <tr class="table-row">
        <td data-cell="Created By">
          <div>
            <picture class="${isOnCallClass}">
              <img class="table-row-cell-pp" src="${profilePicture}" alt="Profile picture of ${createdBy?.fullName || "N/A"}" />
            </picture>
          </div>
        </td>
        <td data-cell="Date"><div>${formattedDate}</div></td>
        <td data-cell="Title">
          <div><a class="table-row-link" href="#${report.id}">${report.incident.title}</a></div>
        </td>
        <td data-cell="Status">
          <div><p class="${status.class}">${status.text}</p></div>
        </td>
        <td data-cell="Assigned To">
          <div>
            ${assignedTo?.fullName || "N/A"}
          </div>
        </td>        
        <td data-cell="Store"><div>${storeNumbers}</div></td>
        <td data-cell="Employee"><div>${report.store.employee.name}</div></td>
        <td data-cell="Type"><div>${incidentTypes}</div></td>
        <td data-cell="Procedural">
          <div><p ${isProcedural.class}>${isProcedural.text}</p></div>
        </td>
        <td data-cell="Actions" data-id="${report.id}" class="table-row-buttons">
            ${buttons}
        </td>
      </tr>
      `;
  }

  addHandlerClickAllReports(handler, handlerClearSearch) {
    this.#btnAllReports.addEventListener("click", () => {
      this.isDeletedViewActive = false;
      handler();
      handlerClearSearch();
      this.#btnAllDeletedReports.removeAttribute("aria-selected");
      this.#btnAllReports.setAttribute("aria-selected", "true");
    });
  }

  addHandlerClickAllDeletedReports(handler, handlerClearSearch) {
    this.#btnAllDeletedReports.addEventListener("click", () => {
      this.isDeletedViewActive = true;
      handler();
      handlerClearSearch();
      this.#btnAllReports.removeAttribute("aria-selected");
      this.#btnAllDeletedReports.setAttribute("aria-selected", "true");
    });
  }

  addHandlerUniqueReportPerTab(handlerUnsavedReport, handlerUniqueReport) {
    document.addEventListener("click", function (e) {
      if (e.target && e.target.closest(".table-row-link")) {
        const id = e.target.getAttribute("href").slice(1);
        const hasReportInTab = handlerUnsavedReport(handlerUniqueReport, id, e);
        if (!hasReportInTab) e.preventDefault();
      }
    });
  }

  addHandlerSend(handler) {
    document.addEventListener("click", function (e) {
      if (e.target && e.target.closest(".teams")) {
        const parentElement =
          e.target.closest(".teams").parentElement.parentElement;
        const id = parentElement.dataset.id;
        handler(id);
      }
    });
  }

  addHandlerDelete(handler) {
    document.addEventListener("click", function (e) {
      if (e.target && e.target.closest(".delete")) {
        const parentElement =
          e.target.closest(".delete").parentElement.parentElement;
        const id = parentElement.dataset.id;
        handler(id);
      }
    });
  }

  addHandlerUndoDelete(handler) {
    document.addEventListener("click", function (e) {
      if (e.target && e.target.closest(".undo")) {
        const parentElement =
          e.target.closest(".undo").parentElement.parentElement;
        const id = parentElement.dataset.id;
        handler(id);
      }
    });
  }
}

export default new ReportTableView();
