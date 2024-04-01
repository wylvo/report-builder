import View from "../View.js";
import reportTabsView from "../reports/reportTabsView.js";
import userTabsView from "../users/userTabsView.js";

import dashboadHtml from "../dashboard/dashboadHtml.js";
import reportHtml from "../reports/reportsHtml.js";
import usersHtml from "../users/usersHtml.js";
import meHtml from "../me/meHtml.js";

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

    this._addHandlerResizeSidebar();
    this._addHandlerClickMenuButton();
    // this._addHandlerClickSidebarSubMenus();
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

  render(data, link) {
    const linkName = link.split("-")[0];

    if (linkName === "dashboard") this.#generateElement(dashboadHtml(data));
    if (linkName === "reports") this.#generateElement(reportHtml());
    if (linkName === "users") this.#generateElement(usersHtml());
    if (linkName === "me") this.#generateElement();
  }

  addHandlerClickSidebarMenus(handler) {
    this._menus.forEach((element) => {
      element.addEventListener("click", async (e) => {
        const id = e.target.closest("li").id;
        this.render(null, id);
        await handler(id.split("-")[0]);
      });
    });
  }

  _addHandlerClickMenuButton() {
    this._btnMenu.addEventListener("click", () =>
      this._sidebar.classList.toggle("active")
    );
  }

  // _addHandlerClickSidebarSubMenus() {
  //   this._subMenus.forEach((element) => {
  //     element.addEventListener("click", this._expand.bind(this));

  //     if (element.classList.contains("active"))
  //       element.querySelector("ul").style.display = "block";
  //   });
  // }

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
}

export default new SidebarView();
