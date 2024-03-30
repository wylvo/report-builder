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

  #dashboardHtml(data) {
    return `
      <div>
        <div class="header">
          <div class="left">
            <h1>Dashboard</h1>
            <ul class="breadcrumb">
              <li><a href="#"> Dashboard </a></li>
              /
              <li><a href="#" class="active">Analytics</a></li>
            </ul>
          </div>
          <a href="#" class="report">
            <i class="bx bx-cloud-download"></i>
            <span>Download JSON</span>
          </a>
        </div>

        <!-- INSIGHTS -->
        <ul class="insights">
          <li>
            <i class='bx bx-calendar-week' ></i>
            <span class="info">
              <h3>28</h3>
              <p>Reports This Week</p>
            </span>
          </li>
          <li>
            <i class='bx bx-calendar' ></i>
            <span class="info">
              <h3>94</h3>
              <p>Reports This Month</p>
            </span>
          </li>
          <li>
            <i class='bx bx-calendar-event'></i>
            <span class="info">
              <h3>464</h3>
              <p>Reports This Year</p>
            </span>
          </li>
          <li>
          <i class='bx bx-food-menu'></i>
          <span class="info">
            <h3>1,074</h3>
            <p>Total Reports</p>
          </span>
        </li>
        </ul>

        <!-- ANALYTICS 1 -->
        <div class="bottom-data">
          <div class="reports">
            <div class="header">
              <i class="bx bx-food-menu"></i>
              <h3>Recently Created Reports</h3>
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

          <!-- ANALYTICS 2 -->
          <div class="analytics-grouping">
            <div class="analytics">
              <div class="header">
                <i class='bx bx-group' ></i>
                <h3>By Users</h3>
              </div>
              <ul class="list">
                <li class="user">
                  <div class="list-title">
                    <img src="img/profile.jpg" />
                    <p>William Evora</p>
                  </div>
                  <div class="reports-container">
                    <p class="count">145</p>
                    <i class="bx bx-food-menu"></i>
                  </div>
                </li>
                <li class="user">
                  <div class="list-title">
                    <img src="img/profile.jpg" />
                    <p>Vasileios Nikitaras</p>
                  </div>
                  <div class="reports-container">
                    <p class="count">135</p>
                    <i class="bx bx-food-menu"></i>
                  </div>
                </li>
                <li class="user">
                  <div class="list-title">
                    <img src="img/profile.jpg" />
                    <p>Robert Tam</p>
                  </div>
                  <div class="reports-container">
                    <p class="count">111</p>
                    <i class="bx bx-food-menu"></i>
                  </div>
                </li>
              </ul>
            </div>
            <div class="analytics">
              <div div class="header">
                <i class='bx bx-detail'></i>
                <h3>By Incident Type</h3>
              </div>
              <ul class="list">
                <li class="type">
                  <div class="list-title">
                    <i class='bx bx-bug' ></i>
                    <p>Bugs</p>
                  </div>
                  <div class="reports-container">
                    <p class="count">127</p>
                    <i class="bx bx-food-menu"></i>
                  </div>
                </li>
                <li class="type">
                  <div class="list-title">
                    <i class='bx bx-globe' ></i>
                    <p>Networking</p>
                  </div>
                  <div class="reports-container">
                    <p class="count">97</p>
                    <i class="bx bx-food-menu"></i>
                  </div>
                </li>
                <li class="type">
                  <div class="list-title">
                    <i class='bx bx-window-alt' ></i>
                    <p>Software</p>
                  </div>
                  <div class="reports-container">
                    <p class="count">58</p>
                    <i class="bx bx-food-menu"></i>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <!-- ANALYTICS 3 -->
          <div class="analytics">
            <div class="header">
              <i class='bx bx-store'></i>
              <h3>By Stores</h3>
            </div>
            <ul class="list">
              <li class="store">
                <div class="store-title">
                  <i class='bx bx-store'></i>
                  <p>116</p>
                </div>
                <div class="reports-container">
                  <p class="count">72</p>
                  <i class="bx bx-food-menu"></i>
                </div>
              </li>
              <li class="store">
                <div class="store-title">
                  <i class='bx bx-store'></i>
                  <p>211</p>
                </div>
                <div class="reports-container">
                  <p class="count">36</p>
                  <i class="bx bx-food-menu"></i>
                </div>
              </li>
              <li class="store">
                <div class="store-title">
                  <i class='bx bx-store'></i>
                  <p>101</p>
                </div>
                <div class="reports-container">
                  <p class="count">12</p>
                  <i class="bx bx-food-menu"></i>
                </div>
              </li>
              <li class="store">
                <div class="store-title">
                  <i class='bx bx-store'></i>
                  <p>116</p>
                </div>
                <div class="reports-container">
                  <p class="count">72</p>
                  <i class="bx bx-food-menu"></i>
                </div>
              </li>
              <li class="store">
                <div class="store-title">
                  <i class='bx bx-store'></i>
                  <p>211</p>
                </div>
                <div class="reports-container">
                  <p class="count">36</p>
                  <i class="bx bx-food-menu"></i>
                </div>
              </li>
              <li class="store">
                <div class="store-title">
                  <i class='bx bx-store'></i>
                  <p>101</p>
                </div>
                <div class="reports-container">
                  <p class="count">12</p>
                  <i class="bx bx-food-menu"></i>
                </div>
              </li>
              <li class="store">
                <div class="store-title">
                  <i class='bx bx-store'></i>
                  <p>116</p>
                </div>
                <div class="reports-container">
                  <p class="count">72</p>
                  <i class="bx bx-food-menu"></i>
                </div>
              </li>
            </ul>
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
