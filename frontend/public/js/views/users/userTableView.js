import TableView from "../tableView.js";

class UserTableView extends TableView {
  constructor() {
    super();
  }

  _generateEmptyRowHtml() {
    return `
      <tr class="table-row">
        <td data-cell="Picture">
          <div>N/A</div>
        </td>
        <td data-cell="Full Name">
          <div>-</div>
        </td>
        <td data-cell="Email">
          <div>-</div>
        </td>
        <td data-cell="Username">
          <div>-</div>
        </td>
        <td data-cell="Initials">
          <div>-</div>
        </td>
        <td data-cell="Role">
          <div>-</div>
        </td>
        <td data-cell="Status">
          <div>-</div>
        </td>
        <td data-cell="Actions">
          <div></div>
        </td>
      </tr>
    `;
  }

  // prettier-ignore
  _generatetHtml(user) {
    const isActive = user.isActive
    ? { class: `class="good"`, text: "Active" }
    : { class: `class="attention"`, text: "Inactive" };
    console.log(user);
    return `
      <tr class="table-row">
        <td data-cell="Picture">
          <div>
            <img class="table-row-cell-pp" src="${user.profilePictureURL}" alt="Picture of ${user.fullName}" />
          </div>
        </td>
        <td data-cell="Full Name"><div>${user.fullName}</div></td>
        <td data-cell="Email">
          <div><a class="table-row-link" href="#${user.id}">${user.email}</a></div>
        </td>
        <td data-cell="Username"><div>${user.username}</div></td>
        <td data-cell="Initials"><div>${user.initials}</div></td>
        <td data-cell="Role"><div>${user.role}</div></td>
        <td data-cell="Status">
          <div><p ${isActive.class}>${isActive.text}</p></div>
        </td>
        <td data-cell="Actions" data-id="${user.id}" class="table-row-buttons">
          <div>
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

  addHandlerUniqueUserPerTab(handlerUnsavedReport, handlerUniqueReport) {
    document.addEventListener("click", function (e) {
      if (e.target && e.target.closest(".table-row-link")) {
        const id = e.target.getAttribute("href").slice(1);
        const hasReportInTab = handlerUnsavedReport(handlerUniqueReport, id, e);
        if (!hasReportInTab) e.preventDefault();
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

export default new UserTableView();
