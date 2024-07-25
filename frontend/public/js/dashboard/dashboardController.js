import * as model from "./dashboardModel.js";

import notificationsView from "../_views/notificationsView.js";
import dashboardView from "./views/dashboardView.js";

const ctx = document.getElementById("myChart");

new Chart(ctx, {
  type: "pie",
  data: {
    labels: ["Red", "Orange", "Yellow", "Green", "Blue"],
    datasets: [
      {
        label: "# of Votes",
        data: [12, 19, 3, 5, 2, 3],
        borderWidth: 1,
      },
    ],
  },
  options: {
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Chart.js Pie Chart",
      },
    },
  },
});

const init = async function () {
  try {
    await model.init();

    dashboardView.renderAll(model.state.stats);

    console.log(model.state);
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
  }
};

init();
