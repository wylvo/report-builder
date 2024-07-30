import View from "../../_views/View.js";
import TableView from "../../_views/tableView.js";

class DashboardView extends View {
  // prettier-ignore
  constructor() {
    super();

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

    this.date = new Date();

    this.weekdayFormatter = new Intl.DateTimeFormat("en", { weekday: "long" });
    this.monthFormatter = new Intl.DateTimeFormat("en", { month: "long" });

    // All quick insights
    this.insightReportsToday = document.querySelector(".insights .reports-today");
    this.insightReportsByWeek = document.querySelector(".insights .reports-by-week");
    this.insightReportsByMonth = document.querySelector(".insights .reports-by-month");
    this.insightReportsByYear = document.querySelector(".insights .reports-by-year");
    this.insightReportsCount = document.querySelector(".insights .reports-count");

    // All canvas
    this.assgignedToUsersCanvas = document.querySelector("#assigned-to-users");
    this.pieChartCanvas = () => document.querySelector("#pie-chart");
    this.lineChartCanvas = () => document.querySelector("#line-chart");
    this.reportsByStoreNumbersCanvas = document.querySelector("#reports-by-store-numbers");

    // All tables
    this.recentActivityTableEl = document.querySelector(".activity");
    this.recentActivityTableView = new TableView(this.recentActivityTableEl);
    this.recentlyCreatedReportsTableEl = document.querySelector(".reports");
    this.recentlyCreatedReportsTableView = new TableView(this.recentlyCreatedReportsTableEl);

    this.pieChartSelectEl = document.querySelector(".pie-chart-select");
    this.lineChartSelectEl = document.querySelector(".line-chart-select");
  }

  // prettier-ignore
  renderAll(stats) {
    console.log(stats);

    const date = this.date
    const weekObject = stats.reportsByWeek.find((obj) => obj.week == this.getWeekNumber(date));
    const monthObject = stats.reportsByMonth.find((obj) => obj.month == date.getMonth() + 1);
    const yearObject = stats.reportsByYear.find((obj) => obj.year == date.getFullYear());

    this.insightReportsByWeek.textContent =`${weekObject?.reports ? weekObject.reports : 0}`.escapeHTML();
    this.insightReportsByMonth.textContent =`${monthObject?.reports ? monthObject.reports : 0}`.escapeHTML();
    this.insightReportsByYear.textContent =`${yearObject?.reports ? yearObject.reports : 0}`.escapeHTML();
    this.insightReportsCount.textContent = `${stats.reportsCount}`.escapeHTML();

    // Assigned to users
    this.chart(
      this.assgignedToUsersCanvas,
      "bar",
      {
        labels: stats.reportsAssignedToUsers.map((user) => user.fullName.escapeHTML()),
        fill: false,
        datasets: [{
          label: "Reports assgined",
          data: stats.reportsAssignedToUsers.map((user) => `${user.reports}`.escapeHTML()),
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
        labels: stats.reportsByStoreNumbers.map((store) => store.number.escapeHTML()),
        fill: false,
        datasets: [
          {
            label: "Reports",
            data: stats.reportsByStoreNumbers.map((store) => 
              `${store.reports - (store.reportsOnCall + store.reportsProcedural + store.reportsOnCallAndProcedural)}`.escapeHTML()
            ),
            borderWidth: 1,
            barThickness: 10,
          },
          {
            label: "Reports On-call",
            data: stats.reportsByStoreNumbers.map((store) => `${store.reportsOnCall}`.escapeHTML()),
            borderWidth: 1,
            barThickness: 10,
          },
          {
            label: "Reports Procedural",
            data: stats.reportsByStoreNumbers.map((store) => `${store.reportsProcedural}`.escapeHTML()),
            borderWidth: 1,
            barThickness: 10,
          },
          {
            label: "Reports On-call & Procedural",
            data: stats.reportsByStoreNumbers.map((store) => `${store.reportsOnCallAndProcedural}`.escapeHTML()),
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
        labels: labels.map((label) => label.escapeHTML()),
        fill: false,
        datasets: [
          {
            label: "Reports",
            data: datasetsData.map((data) =>
              typeof data === "string" ? data.escapeHTML() : data
            ),
            backgroundColor: "#d7e0f8",
            borderColor: "rgb(255, 99, 132)",
          },
          {
            label: "Reports",
            data: datasetsData.map((data) =>
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
        labels: labels.map((label) => label.escapeHTML()),
        datasets: [
          {
            label: "Reports",
            data: datasetsData.map((data) =>
              typeof data === "string" ? data.escapeHTML() : data
            ),
            backgroundColor: this.backgroundColor,
            borderColor: this.borderColor,
          },
        ],
      },
    });
  }

  tables() {}

  formatMonth(month) {
    return this.monthFormatter.format(
      new Date(this.date.getFullYear(), Number(month), this.date.getDate())
    );
  }

  addHandlerPieChartSelectOnChange(handler) {
    this.pieChartSelectEl.addEventListener("change", (e) => {
      const parentEl = this.pieChartSelectEl.parentElement.parentElement;

      const canvas = document.createElement("canvas");
      canvas.setAttribute("id", "pie-chart");

      this.pieChartCanvas().remove();
      parentEl.insertAdjacentElement("beforeend", canvas);

      handler(e.target.value, canvas);
    });
  }

  addHandlerLineChartSelectOnChange(handler) {
    this.lineChartSelectEl.addEventListener("change", (e) => {
      const parentEl = this.lineChartSelectEl.parentElement.parentElement;

      const canvas = document.createElement("canvas");
      canvas.setAttribute("id", "line-chart");

      this.lineChartCanvas().remove();
      parentEl.insertAdjacentElement("beforeend", canvas);

      handler(e.target.value, canvas);
    });
  }
}

export default new DashboardView();
