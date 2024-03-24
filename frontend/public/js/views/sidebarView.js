import View from "./View.js";

class SidebarView extends View {
  constructor() {
    super();
    this._sidebar = document.querySelector(".sidebar");
    this._subMenus = this._sidebar.querySelectorAll(".menu > ul > li");
    this._btnMenu = document.querySelector(".menu-btn");

    this._addHandlerResizeSidebar();
    this._addHandlerClickMenuButton();
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

  _addHandlerClickMenuButton() {
    this._btnMenu.addEventListener("click", () =>
      this._sidebar.classList.toggle("active")
    );
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
}

export default new SidebarView();
