import TableView from "../../_views/tableView.js";
import { DEFAULT_PROFILE_PICTURE } from "../../config.js";

class UserTableView extends TableView {
  constructor() {
    super();
  }

  _generateEmptyRowHtml() {
    return `
      <tr class="table-row">
        <td data-cell="Full Name">
          <div>-</div>
        </td>
        <td data-cell="Username">
          <div>-</div>
        </td>        
        <td data-cell="Email">
          <div>-</div>
        </td>
        <td data-cell="Role">
          <div>-</div>
        </td>
        <td data-cell="Status">
          <div>-</div>
        </td>
        <td data-cell="Reports Related">
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
    const status = user.active
      ? { btnClassAndIcon: "disable", class: `class="good"`, text: "Active" }
      : { btnClassAndIcon: "enable", class: `class="attention"`, text: "Inactive" };

    const profilePicture = user.profilePictureURI
      ? user.profilePictureURI
      : DEFAULT_PROFILE_PICTURE;

    return `
      <tr class="table-row">
        <td data-cell="Full Name" title="${user.fullName}">
          <div>
            <img class="table-row-cell-pp" src="${profilePicture}" alt="Profile picture of ${user.fullName}" />
            <p>${user.fullName}</p>
          </div>
        </td>
        <td data-cell="Username"><div>${user.username}</div></td>
        <td data-cell="Email">
          <div><a class="table-row-link" href="#${user.username}">${user.email ? user.email : "N/A"}</a></div>
        </td>
        <td data-cell="Role"><div>${user.role}</div></td>
        <td data-cell="Status">
          <div><p ${status.class}>${status.text}</p></div>
        </td>
        <td data-cell="Reports Related">
          <div>${user.reportsRelated}</div>
        </td>
        <td data-cell="Actions" data-id="${user.id}"  data-username="${user.username}" class="table-row-buttons">
          <div>
            <button class="btn status ${status.btnClassAndIcon}-user icons">
              <svg>
                <use href="/img/icons.svg#icon-${status.btnClassAndIcon}"></use>
              </svg>
            </button>
            <button class="btn delete icons">
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
        const username = e.target.getAttribute("href").slice(1);
        const hasReportInTab = handlerUnsavedReport(
          handlerUniqueReport,
          username,
          e
        );
        if (!hasReportInTab) e.preventDefault();
      }
    });
  }

  addHandlerDelete(handler) {
    document.addEventListener("click", function (e) {
      if (e.target && e.target.closest(".delete")) {
        const parentElement =
          e.target.closest(".delete").parentElement.parentElement;
        const username = parentElement.dataset.username;
        handler(username);
      }
    });
  }

  // prettier-ignore
  addHandlerStatus(handler) {
    document.addEventListener("click", function (e) {
      if (e.target && (e.target.closest(".disable-user") || e.target.closest(".enable-user"))) {
        const parentElement =
          (e.target.closest(".disable-user") || e.target.closest(".enable-user"))
            .parentElement
            .parentElement;
        const username = parentElement.dataset.username;
        handler(username);
      }
    });
  }
}

export default new UserTableView();
