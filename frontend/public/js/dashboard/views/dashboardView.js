import View from "../../_views/View.js";
import TableView from "../../_views/tableView.js";

class DashboardView extends View {
  // Inputs keys
  #DATE_UNITS = "*";

  // prettier-ignore
  constructor() {
    super();

    // Current Date
    this.date = new Date();

    // Date formatters
    this.weekdayFormatter = new Intl.DateTimeFormat("en", { weekday: "long" });
    this.monthFormatter = new Intl.DateTimeFormat("en", { month: "long" });

    // All quick insights
    this.insightReportsToday = document.querySelector(".insights .reports-today");
    this.insightReportsCount = document.querySelector(".insights .reports-count");
    this.dateUnitContainers = document.querySelectorAll(".insight");
    this.dateUnitSelectElements;

    // All canvas
    this.assgignedToUsersCanvas = document.querySelector("#assigned-to-users");
    this.reportsByStoreNumbersCanvas = document.querySelector("#reports-by-store-numbers");
    this.pieChartCanvas = () => document.querySelector("#pie-chart");
    this.lineChartCanvas = () => document.querySelector("#line-chart");

    // Charts
    this.pieChartSelectElement = document.querySelector(".pie-chart-select");
    this.lineChartSelectElement = document.querySelector(".line-chart-select");

    this.backgroundColor = [
      "rgba(255, 99, 132, 0.35)",
      "rgba(255, 159, 64, 0.35)",
      "rgba(255, 205, 86, 0.35)",
      "rgba(75, 192, 192, 0.35)",
      "rgba(54, 162, 235, 0.35)",
      "rgba(153, 102, 255, 0.35)",
      "rgba(201, 203, 207, 0.35)",
    ];
    this.borderColor = [
      "rgb(255, 99, 132)",
      "rgb(255, 159, 64)",
      "rgb(255, 205, 86)",
      "rgb(75, 192, 192)",
      "rgb(54, 162, 235)",
      "rgb(153, 102, 255)",
      "rgb(201, 203, 207)",
    ];
  }

  initializeAllDateUnitSelects() {
    const dateUnitSelectElements = [
      ...document.querySelectorAll(".date-unit-select"),
    ];

    const keyValue = (array) => array.map((element) => [element.name, element]);

    return new Map(keyValue(dateUnitSelectElements));
  }

  // prettier-ignore
  formatMonth(monthNumber) {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return months[monthNumber - 1] || "Invalid month number";
  }

  generateDateUnitSelectHtml(className, options) {
    return `
      <select class="date-unit-select" name="${className}">
        ${options.join("")}
      </select>
    `;
  }

  generateDateUnitSelectElement(className, options) {
    return this.htmlStringToElement(
      this.generateDateUnitSelectHtml(className, options)
    );
  }

  // prettier-ignore
  renderAll(stats) {
    console.log(stats);

    const date = this.date;

    this.dateUnitContainers.forEach((container) => {
      const className = container.classList[1];
      let options;
  
      if (className === "reports-by-week-select") {
        options = stats.reportsByWeek?.map((data, i) => {
          let week = `Week Of ${String(data.weekStart)}`.escapeHTML();
          if (i === 0) (week = `This Week`), (container.firstElementChild.textContent = data.reports);
          if (i === 1) week = `Last Week`;
          return `<option value="${i}">Calls ${week}</option>`;
        });
      }

      if (className === "reports-by-month-select") {
        options = stats.reportsByMonth?.map((data, i) => {
          let month = `In ${this.formatMonth(data.month)}, ${data.year}`.escapeHTML();
          if (i === 0) (month = `This Month`), (container.firstElementChild.textContent = data.reports);
          if (i === 1) month = `Last Month`;
          return `<option value="${i}">Calls ${month}</option>`;
        });
      }

      if (className === "reports-by-year-select") {
        options = stats.reportsByYear?.map((data, i) => {
          let year = String(data.year).escapeHTML()
          if (i === 0) (year = `This Year`), (container.firstElementChild.textContent = data.reports);
          return `<option value="${i}">Calls In ${year}</option>`;
        });
      }

      if (!options) return;

      const dateUnitSelectElement = this.generateDateUnitSelectElement(className, options);
      container.lastElementChild.replaceWith(dateUnitSelectElement);
    })
    
    this.dateUnitSelectElements = this.initializeAllDateUnitSelects();
    this.insightReportsToday.textContent = `${stats.reportsToday}`.escapeHTML()
    this.insightReportsCount.textContent = `${stats.reportsCount}`.escapeHTML();

    // Assigned to users
    this.chart(
      this.assgignedToUsersCanvas,
      "bar",
      {
        labels: stats.reportsAssignedToUsers?.map((user) => user.fullName.escapeHTML()),
        fill: false,
        datasets: [{
          label: "Reports assgined",
          data: stats.reportsAssignedToUsers?.map((user) => `${user.reports}`.escapeHTML()),
          borderWidth: 1,
          barThickness: 30,
          backgroundColor: this.backgroundColor,
          borderColor: this.borderColor,
        }],
      },
      {
        aspectRatio: "1",
        scales: {
          y: {
            stacked: true,
            grid: {
              display: true,
              color: "rgba(255,99,132,0.2)"
            }
          }
        }
      }
    );

    // By store numbers
    this.chart(
      this.reportsByStoreNumbersCanvas,
      "bar",
      {
        labels: stats.reportsByStoreNumbers?.map((store) => store.number.escapeHTML()),
        fill: false,
        datasets: [
          {
            label: "Reports",
            data: stats.reportsByStoreNumbers?.map((store) => 
              `${store.reports - (store.reportsOnCall + store.reportsProcedural + store.reportsOnCallAndProcedural)}`.escapeHTML()
            ),
            borderWidth: 1,
            barThickness: 10,
          },
          {
            label: "Reports On-call",
            data: stats.reportsByStoreNumbers?.map((store) => `${store.reportsOnCall}`.escapeHTML()),
            borderWidth: 1,
            barThickness: 10,
          },
          {
            label: "Reports Procedural",
            data: stats.reportsByStoreNumbers?.map((store) => `${store.reportsProcedural}`.escapeHTML()),
            borderWidth: 1,
            barThickness: 10,
          },
          {
            label: "Reports On-call & Procedural",
            data: stats.reportsByStoreNumbers?.map((store) => `${store.reportsOnCallAndProcedural}`.escapeHTML()),
            borderWidth: 1,
            barThickness: 10,
          }
        ],
      },
      {
        responsive: true,
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            grid: {
              display: true,
              color: "rgba(255,99,132,0.2)"
            }
          }
        }
      }
    );
  }

  // Chartjs wrapper function
  chart(canvasElement, type, data, options) {
    if (!window?.Chart) return;
    new Chart(canvasElement, { type, data, options });
  }

  lineChart(canvasElement, labels, datasetsData) {
    if (!window?.Chart) return;
    new Chart(canvasElement, {
      type: "line",
      data: {
        labels: labels?.map((label) => label.escapeHTML()),
        fill: false,
        datasets: [
          {
            label: "Reports",
            data: datasetsData?.map((data) =>
              typeof data === "string" ? data.escapeHTML() : data
            ),
            backgroundColor: "#d7e0f8",
            borderColor: "rgb(255, 99, 132)",
          },
          {
            label: "Reports",
            data: datasetsData?.map((data) =>
              typeof data === "string" ? data.escapeHTML() : data
            ),
            type: "bar",
            backgroundColor: this.borderColor,
            borderColor: this.backgroundColor,
          },
        ],
      },
      options: {
        aspectRatio: "1",
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            grid: {
              display: true,
              color: "rgba(255,99,132,0.2)",
            },
          },
        },
      },
    });
  }

  pieChart(canvasElement, labels, datasetsData) {
    if (!window?.Chart) return;
    new Chart(canvasElement, {
      type: "pie",
      data: {
        labels: labels?.map((label) => label.escapeHTML()),
        datasets: [
          {
            label: "Reports",
            data: datasetsData?.map((data) =>
              typeof data === "string" ? data.escapeHTML() : data
            ),
            backgroundColor: this.backgroundColor,
            borderColor: this.borderColor,
          },
        ],
      },
    });
  }

  addHandlerWeekSelectOnChange(handler) {
    const byWeek = this.dateUnitSelectElements.get("reports-by-week-select");
    byWeek.addEventListener("change", (e) => {
      console.log(e.target.value);

      const data = handler(e.target.value);
      byWeek.previousElementSibling.textContent =
        `${data.reports}`.escapeHTML();
    });
  }

  addHandlerMonthSelectOnChange(handler) {
    const byMonth = this.dateUnitSelectElements.get("reports-by-month-select");
    byMonth.addEventListener("change", (e) => {
      console.log(e.target.value);

      const data = handler(e.target.value);
      byMonth.previousElementSibling.textContent =
        `${data.reports}`.escapeHTML();
    });
  }

  addHandlerYearSelectOnChange(handler) {
    const byYear = this.dateUnitSelectElements.get("reports-by-year-select");
    byYear.addEventListener("change", (e) => {
      console.log(e.target.value);

      const data = handler(e.target.value);
      byYear.previousElementSibling.textContent =
        `${data.reports}`.escapeHTML();
    });
  }

  addHandlerPieChartSelectOnChange(handler) {
    this.pieChartSelectElement.addEventListener("change", (e) => {
      const parentEl = this.pieChartSelectElement.parentElement.parentElement;

      const canvas = document.createElement("canvas");
      canvas.setAttribute("id", "pie-chart");

      this.pieChartCanvas().remove();
      parentEl.insertAdjacentElement("beforeend", canvas);

      handler(e.target.value, canvas);
    });
  }

  addHandlerLineChartSelectOnChange(handler) {
    this.lineChartSelectElement.addEventListener("change", (e) => {
      const parentEl = this.lineChartSelectElement.parentElement.parentElement;

      const canvas = document.createElement("canvas");
      canvas.setAttribute("id", "line-chart");

      this.lineChartCanvas().remove();
      parentEl.insertAdjacentElement("beforeend", canvas);

      handler(e.target.value, canvas);
    });
  }
}

export default new DashboardView();
