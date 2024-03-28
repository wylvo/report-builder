import View from "./View.js";
import tabsView from "./tabsView.js";

class SidebarView extends View {
  constructor() {
    super();
    this._sidebar = document.querySelector(".sidebar");
    this._menus = this._sidebar.querySelectorAll(".menu > ul");
    this._subMenus = this._sidebar.querySelectorAll(".menu > ul > li");
    this._btnMenu = document.querySelector(".menu-btn");

    this._main = document.querySelector(".main");
    this._mainHeader = this._main.querySelector(".header");
    this._mainContent = this._main.querySelector(".section-col");

    console.log(this._menus);

    this._addHandlerResizeSidebar();
    this._addHandlerClickMenuButton();
    this._addHandlerClickSidebarMenus();
    this._addHandlerClickSidebarSubMenus();
  }

  _expand(event) {
    const clickedElement = event.currentTarget;

    this._subMenus.forEach((sibling) => {
      if (sibling !== clickedElement) {
        sibling.classList.remove("active");

        const menu = sibling.querySelector("ul");
        if (menu) {
          menu.style.display = "none";
          menu
            .querySelectorAll("li")
            .forEach((menuItem) => menuItem.classList.remove("active"));
        }
      }
    });

    // if (
    //   !event.target
    //     .closest("li")
    //     .parentElement.parentElement.classList.contains("active")
    // ) {
    clickedElement.classList.toggle("active");
    const clickedSubmenu = clickedElement.querySelector("ul");

    if (clickedSubmenu)
      clickedSubmenu.style.display =
        clickedSubmenu.style.display === "none" ||
        clickedSubmenu.style.display === ""
          ? "block"
          : "none";
    // }
  }

  #clearMain() {
    this._main.innerHTML = "";
  }

  render(link) {
    const linkName = link.split("-")[0];

    if (linkName === "dashboard") this.#generateElement(this.#dashboardHtml());
    if (linkName === "reports") {
      this.#generateElement(this.#reportsHtml());
      tabsView.renderAll();
    }
    if (linkName === "users") this.#generateElement(this.#usersHtml());
    if (linkName === "me") this.#generateElement(this.#meHtml());
  }

  _addHandlerClickMenuButton() {
    this._btnMenu.addEventListener("click", () =>
      this._sidebar.classList.toggle("active")
    );
  }

  _addHandlerClickSidebarMenus() {
    this._menus.forEach((element) => {
      element.addEventListener("click", (e) => {
        const link = e.target.closest("li");
        this.render(link.id);
      });
    });
  }

  _addHandlerClickSidebarSubMenus() {
    this._subMenus.forEach((element) => {
      element.addEventListener("click", this._expand.bind(this));

      if (element.classList.contains("active"))
        element.querySelector("ul").style.display = "block";
    });
  }

  _addHandlerResizeSidebar() {
    window.addEventListener("resize", () => {
      if (window.innerWidth < 768) {
        this._sidebar.classList.add("active");
      } else {
        this._sidebar.classList.remove("active");
      }
    });
  }

  #generateElement(html) {
    const mainElement = this.htmlStringToElement(html);
    this.#clearMain();

    [...mainElement.children].forEach((childElement) =>
      this._main.insertAdjacentElement("beforeend", childElement)
    );
    // this._main.insertAdjacentElement()
  }

  #dashboardHtml() {
    return `
      <div>
        <div class="header">
          <div class="left">
            <h1>Dashboard</h1>
            <ul class="breadcrumb">
              <li><a href="#"> Dashboard </a></li>
              /
              <li><a href="#" class="active">Reports</a></li>
            </ul>
          </div>
          <a href="#" class="report">
            <i class="bx bx-cloud-download"></i>
            <span>Download JSON</span>
          </a>
        </div>

        <!-- Insights -->
        <ul class="insights">
          <li>
            <i class="bx bx-calendar-check"></i>
            <span class="info">
              <h3>1,074</h3>
              <p>Paid Orders</p>
            </span>
          </li>
          <li>
            <i class="bx bx-show-alt"></i>
            <span class="info">
              <h3>3,944</h3>
              <p>Site Visit</p>
            </span>
          </li>
          <li>
            <i class="bx bx-line-chart"></i>
            <span class="info">
              <h3>14,721</h3>
              <p>Searches</p>
            </span>
          </li>
          <li>
            <i class="bx bx-dollar-circle"></i>
            <span class="info">
              <h3>1,074</h3>
              <p>Total Sales</p>
            </span>
          </li>
        </ul>
        <!-- End of Insights -->

        <div class="bottom-data">
          <div class="orders">
            <div class="header">
              <i class="bx bx-list-ul"></i>
              <h3>Recently Created Reports</h3>
              <i class="bx bx-filter"></i>
              <i class="bx bx-search"></i>
            </div>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Store</th>
                  <th>Procedural</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <img src="img/profile.jpg" />
                    <p>William Evora</p>
                  </td>
                  <td>20-03-2024</td>
                  <td><span class="status completed">Completed</span></td>
                  <td>101</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>
                    <img src="img/profile.jpg" />
                    <p>William Evora</p>
                  </td>
                  <td>19-03-2024</td>
                  <td><span class="status inprogress">In Progress</span></td>
                  <td>211</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td>
                    <img src="img/profile.jpg" />
                    <p>William Evora</p>
                  </td>
                  <td>14-03-2024</td>
                  <td><span class="status completed">Completed</span></td>
                  <td>505</td>
                  <td>No</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Reminders -->
          <div class="reminders">
            <div class="header">
              <i class="bx bx-note"></i>
              <h3>Reminders</h3>
              <i class="bx bx-filter"></i>
            </div>
            <ul class="task-list">
              <li class="completed">
                <div class="task-title">
                  <i class="bx bx-check-circle"></i>
                  <p>Start Our Meeting</p>
                </div>
                <i class="bx bx-dots-vertical-rounded"></i>
              </li>
              <li class="completed">
                <div class="task-title">
                  <i class="bx bx-check-circle"></i>
                  <p>Analyse Our Site</p>
                </div>
                <i class="bx bx-dots-vertical-rounded"></i>
              </li>
              <li class="not-completed">
                <div class="task-title">
                  <i class="bx bx-x-circle"></i>
                  <p>Play Football</p>
                </div>
                <i class="bx bx-dots-vertical-rounded"></i>
              </li>
            </ul>
            <!-- End of Reminders -->
          </div>
        </div>
        
        <!-- NOTIFICATIONS -->
        <div class="notifications"></div>

        <!-- MODAL -->
        <div class="modal-ctn"></div>
        <div class="overlay hidden"></div>
      </div>
    `;
  }

  #reportsHtml() {
    return `
      <div>
        <div class="header">
          <div class="left">
            <h1>Dashboard</h1>
            <ul class="breadcrumb">
              <li><a href="#"> Dashboard </a></li>
              /
              <li><a href="#" class="active">Reports</a></li>
            </ul>
          </div>
          <a href="#" class="report">
            <i class="bx bx-cloud-download"></i>
            <span>Download JSON</span>
          </a>
        </div>

        <section class="section-col">
          <!-- FORM -->
          <div class="container tab-form-ctn">
            <div class="tabs-ctn">
              <ul class="tab-list" role="tablist">
                <!-- <li><a class="tab-btn" id="tab_0" href="#">Form 0</a></li> -->
              </ul>
            </div>
            <div class="tabs-forms"></div>
          </div>

          <!-- TABLE -->
          <div class="container table-ctn">
            <div class="tabs-ctn">
              <ul class="tab-list" role="tablist">
                <li role="presentation">
                  <a class="tab-btn" id="tab_0" href="#" role="tab" tabindex="0"
                    >All Reports</a
                  >
                </li>
                <li role="presentation">
                  <a class="tab-btn" id="tab_0" href="#" role="tab" tabindex="0"
                    >My Reports</a
                  >
                </li>
                <li role="presentation">
                  <a class="tab-btn" id="tab_0" href="#" role="tab" tabindex="0"
                    >Deleted Reports</a
                  >
                </li>
                <li role="presentation"></li>
                <li role="presentation"></li>
                <li role="presentation"></li>
              </ul>
            </div>
            <div class="tabs-forms"></div>

            <div class="table-header">
              <form class="table-filter">
                <div>
                  <label for="table-filter-by">Filter By:</label>
                  <select
                    id="table-filter-by"
                    name="table-filter-by"
                    class="table-filter-by"
                  >
                    <option value="tech">TECH</option>
                    <option value="call.dateTime">Date</option>
                    <option value="incident.title">Title</option>
                    <option value="call.status">Status</option>
                    <option value="call.phone">Phone</option>
                    <option value="store.number">Store</option>
                    <option value="incident.type">Type</option>
                    <option value="incident.isProcedural">Procedural</option>
                    <option value="store.employee.name">Emp</option>
                    <option value="store.districtManager">DM</option>
                    <option value="tech.isOnCall">On-call</option>
                  </select>
                </div>
                <div class="table-filter-search-ctn">
                  <label for="table-filter-search">Filter: </label>
                  <input
                    type="search"
                    name="table-filter-search"
                    id="table-filter-search"
                    class="table-filter-search"
                    placeholder="Search..."
                  />
                </div>
              </form>
              <div class="table-view">
                <div class="table-meta-data">
                  <p>
                    Total Reports:
                    <strong><span class="total-reports">0</span></strong>
                  </p>
                </div>
                <div class="table-pagination">
                  <!-- <button disabled class="table-pagination-btn">
                    <svg class="icons">
                      <use href="/img/icons.svg#icon-chevron-left"></use>
                    </svg>
                  </button>
                  <span data-page="1" class="table-pagination-text">1</span>
                  <button class="table-pagination-btn">
                    <svg class="icons">
                      <use href="/img/icons.svg#icon-chevron-right"></use>
                    </svg>
                  </button> -->
                </div>
              </div>
            </div>
            <div class="table-wrapper">
              <table class="table-content">
                <thead>
                  <tr>
                    <th>TECH</th>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Store</th>
                    <th>Emp</th>
                    <th>DM</th>
                    <th>Type</th>
                    <th>Procedural</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
            <div class="table-footer">
              <div class="table-rows">
                <div>
                  <label for="table-rows-per-page">Rows per page:</label>
                  <select
                    id="table-rows-per-page"
                    name="table-rows-per-page"
                    class="table-rows-per-page"
                  >
                    <option selected value="50">50</option>
                    <option value="100">100</option>
                    <option value="250">250</option>
                    <option value="500">500</option>
                    <option value="1000">1000</option>
                  </select>
                </div>
              </div>
              <div class="table-pagination">
                <!-- <button data-page="" class="table-pagination-btn">
                  <svg class="icons">
                    <use href="/img/icons.svg#icon-chevron-left"></use>
                  </svg>
                </button>
                <span class="table-pagination-text">1</span>
                <button data-page="" class="table-pagination-btn">
                  <svg class="icons">
                    <use href="/img/icons.svg#icon-chevron-right"></use>
                  </svg>
                </button> -->
              </div>
            </div>
          </div>
        </section>

        <!-- NOTIFICATIONS -->
        <div class="notifications"></div>

        <!-- MODAL -->
        <div class="modal-ctn"></div>
        <div class="overlay hidden"></div>
      </div>
    `;
  }

  #usersHtml() {
    return ``;
  }

  #meHtml() {
    return ``;
  }
}

/**
 *
 */

export default new SidebarView();
