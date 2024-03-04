// Send AJAX Request To Microsoft Teams Webhook URL Endpoint With (Adaptive) Card JSON In Body
export const send = async (card) => {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(card),
  };

  return await fetch(process.env.MS_TEAMS_WEBHOOK_URL, requestOptions);
};
