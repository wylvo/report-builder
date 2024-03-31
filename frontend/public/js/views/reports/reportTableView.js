import TableView from "../tableView.js";

class ReportTableView extends TableView {
  constructor() {
    super();
  }

  update(data) {
    const { currentElement, newElement } = this._generateRowElement(data);

    currentElement.replaceWith(newElement);

    return newElement;
  }

  _generateEmptyRowHtml() {
    return `
      <tr class="table-row">
        <td data-cell="TECH">
          <div>N/A</div>
        </td>
        <td data-cell="Date">
          <div>-</div>
        </td>
        <td data-cell="Title">
          <div>-</div>
        </td>
        <td data-cell="Phone">
          <div>-</div>
        </td>
        <td data-cell="Num">
          <div>-</div>
        </td>
        <td data-cell="Employee">
          <div>-</div>
        </td>
        <td data-cell="DM">
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

    const isOnCallClass = report.tech.isOnCall ? "on-call" : ""

    return `
    <tr class="table-row">
      <td data-cell="TECH">
        <div><p class="table-row-cell-pp ${isOnCallClass}">${report.tech.initials}</p></div>
      </td>
      <td data-cell="Date"><div>${formattedDate}</div></td>
      <td data-cell="Title">
        <div><a class="table-row-link" href="#${report.id}">${report.incident.title}</a></div>
      </td>
      <td data-cell="Status">
        <div><p class="${status.class}">${status.text}</p></div>
      </td>
      <td data-cell="Num"><div>${report.store.number}</div></td>
      <td data-cell="Employee"><div>${report.store.employee.name}</div></td>
      <td data-cell="DM"><div>${report.store.districtManager.name}</div></td>
      <td data-cell="Type"><div>${report.incident.type}</div></td>
      <td data-cell="Procedural">
        <div><p ${isProcedural.class}>${isProcedural.text}</p></div>
      </td>
      <td data-cell="Actions" data-id="${report.id}" class="table-row-buttons">
        <div>
          <button ${
            report.isWebhookSent ? "disabled" : ""
          } class="table-row-teams-btn icons">
            <svg>
              <use href="/img/icons.svg#icon-ms-teams"></use>
            </svg>
          </button>
          <button class="table-row-delete-btn icons">
            <svg>
              <use href="/img/icons.svg#icon-delete"></use>
            </svg>
          </button>
        </div>
      </td>
    </tr>
    `;
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
      if (e.target && e.target.closest(".table-row-teams-btn")) {
        const parentElement = e.target.closest(".table-row-teams-btn")
          .parentElement.parentElement;
        const id = parentElement.dataset.id;
        handler(id);
      }
    });
  }

  addHandlerDelete(handler) {
    document.addEventListener("click", function (e) {
      if (e.target && e.target.closest(".table-row-delete-btn")) {
        const parentElement = e.target.closest(".table-row-delete-btn")
          .parentElement.parentElement;
        const id = parentElement.dataset.id;
        handler(id);
      }
    });
  }
}

export default new ReportTableView();
