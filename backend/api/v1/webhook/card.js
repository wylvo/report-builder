import { config } from "../router.js";

// Check if object is empty
const isEmptyObject = (object) => {
  for (const property in object) {
    if (Object.hasOwn(object, property)) {
      return false;
    }
  }
  return true;
};

// Parse Report Data Into Readable Variables. Return Report Data & Adaptive Card As JSON
export const setAdaptiveCard = (report) => {
  // Meta Data
  const id = report.id;
  const createdTime = report.createdAt.split(".")[0] + "Z";
  const username = report.assignedTo;
  const techProfilePicture = () => {
    if (username.includes("tam")) return process.env.TECH_PP1;
    if (username.includes("nik")) return process.env.TECH_PP2;
    if (username.includes("evo")) return process.env.TECH_PP3;
    if (username.includes("lar")) return process.env.TECH_PP4;
    if (username.includes("mal")) return process.env.TECH_PP5;
  };
  const appVersion = `v${config.version}`;

  // Call
  const callDate = new Date(report.call.date).toDateString();
  const callTime = report.call.dateTime.split(" ").slice(1, 3).join(" ");
  const callStatus = report.call.status;
  const callStatusColor = () => {
    if (report.call.status.includes("In Progress")) return "Warning";
    if (report.call.status.includes("Completed")) return "Good";
    return "Accent";
  };
  const callPhone = report.call.phone;
  const isOnCall = report.isOnCall;
  const isProcedural = report.incident.isProcedural;
  const isProceduralText = report.incident.isProcedural ? "Yes" : "No";

  // Store Information
  const storeNumber = report.store.numbers;
  const storeEmployeeName = report.store.employee.name;
  const isStoreEmployeeManager = report.store.employee.isStoreManager
    ? "Yes"
    : "No";
  const storeDMName = report.store.districtManager.name;

  // Incident Details
  const incidentTitle = report.incident.title;
  const incidentType = report.incident.types;
  const incidentPos = report.incident.pos;
  const incidentErrorCode = report.incident.error;

  // Incident Transaction Details
  const incidentTransaction = isEmptyObject(report.incident.transaction)
    ? report.incident.transaction
    : {
        type: report.incident.transaction.types,
        number: report.incident.transaction.number,
        hasVarianceReport: report.incident.transaction.hasVarianceReport
          ? "Yes"
          : "No",
      };

  const incidentDetails = report.incident.details;

  // prettier-ignore
  return {
    "type": "message",
    "attachments": [
      {
        "contentType": "application/vnd.microsoft.card.adaptive",
        "content": {
          "type": "AdaptiveCard",
          "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
          "version": "1.5",
          "id": `${id}`,
          "body": [
            {
              "type": "Input.Text",
              "id": "textInput1",
              "isVisible": false,
              "value": `${JSON.stringify(report)}`
            },
            {
              "type": "Image",
              "id": "image1",
              "url": "https://resources.mandmdirect.com/assets/blog/article/2019/09_September/190905/jack-and-jones-1.gif",
              "height": "auto",
              "horizontalAlignment": "Left"
            },
            {
              "type": "ColumnSet",
              "id": "columnSet1",
              "columns": [
                {
                  "type": "Column",
                  "id": "column1",
                  "width": "stretch",
                  "items": [
                    {
                      "type": "TextBlock",
                      "size": "Small",
                      "weight": "Bolder",
                      "text": "Phone Call Report",
                      "isSubtle": true
                    }
                  ],
                  "rtl": false
                }
              ]
            },
            {
              "type": "TextBlock",
              "text": `${incidentTitle}`,
              "wrap": true,
              "size": "ExtraLarge",
              "weight": "Bolder",
              "spacing": "None"
            },
            {
              "type": "ColumnSet",
              "columns": [
                {
                  "type": "Column",
                  "items": [
                    {
                      "type": "Image",
                      "style": "Person",
                      "size": "Medium",
                      "url": techProfilePicture()
                    }
                  ],
                  "width": "auto"
                },
                {
                  "type": "Column",
                  "items": [
                    {
                      "type": "TextBlock",
                      "weight": "Bolder",
                      "text": `${username}`,
                      "wrap": true
                    },
                    {
                      "type": "TextBlock",
                      "spacing": "None",
                      "text": `Created {{DATE(${createdTime},SHORT)}}`,
                      "isSubtle": true,
                      "wrap": true
                    },
                    {
                      "type": "ColumnSet",
                      "spacing": "None",
                      "columns": [
                        {
                          "type": "Column",
                          "width": "auto",
                          "verticalContentAlignment": "Center",
                          "spacing": "None",
                          "items": [
                            {
                              "type": "TextBlock",
                              "size": "Default",
                              "isSubtle": true,
                              "spacing": "None",
                              "text": `${callStatus}`,
                              "wrap": true,
                              "color": callStatusColor(),
                              "horizontalAlignment": "Left"
                            }
                          ]
                        },
                        {
                          "type": "Column",
                          "width": "auto",
                          "items": [
                            {
                              "type": "TextBlock",
                              "text": "• ‎  ‎  ‎ ",
                              "wrap": true
                            }
                          ],
                          "isVisible": isOnCall                              
                        },
                        {
                          "type": "Column",
                          "width": "auto",
                          "verticalContentAlignment": "Center",
                          "spacing": "None",
                          "items": [
                            {
                              "type": "TextBlock",
                              "size": "Default",
                              "isSubtle": true,
                              "spacing": "None",
                              "text": "On-call",
                              "wrap": true,
                              "color": "Accent",
                              "horizontalAlignment": "Left",
                              "isVisible": isOnCall                              
                            }
                          ]
                        },
                        {
                          "type": "Column",
                          "width": "auto",
                          "items": [
                            {
                              "type": "TextBlock",
                              "text": "• ‎  ‎  ‎ ",
                              "wrap": true
                            }
                          ],
                          "isVisible": (isOnCall && isProcedural)                          
                        },
                        {
                          "type": "Column",
                          "width": "stretch",
                          "items": [
                            {
                              "type": "TextBlock",
                              "text": "Procedural",
                              "spacing": "None",
                              "color": "Attention",
                              "isSubtle": false,
                              "weight": "Bolder",
                              "size": "Default",
                              "horizontalAlignment": "Left",
                              "isVisible": isProcedural                              
                            }
                          ]
                        }
                      ]
                    }
                  ],
                  "width": "stretch"
                }
              ]
            },
            {
              "type": "ColumnSet",
              "columns": [
                {
                  "type": "Column",
                  "width": "stretch",
                  "items": [
                    {
                      "type": "TextBlock",
                      "text": "Phone Call",
                      "wrap": true,
                      "size": "Large",
                      "weight": "Bolder",
                      "color": "Accent",
                      "spacing": "None"
                    }
                  ]
                }
              ],
              "spacing": "ExtraLarge"
            },
            {
              "type": "ColumnSet",
              "columns": [
                {
                  "type": "Column",
                  "width": "stretch",
                  "items": [
                    {
                      "type": "FactSet",
                      "facts": [
                        {
                          "title": "Date:",
                          "value": `${callDate}`
                        },
                        {
                          "title": "Status:",
                          "value": `${callStatus}`
                        }
                      ]
                    }
                  ],
                  "rtl": false,
                  "style": "emphasis",
                  "spacing": "None"
                },
                {
                  "type": "Column",
                  "width": "stretch",
                  "items": [
                    {
                      "type": "FactSet",
                      "facts": [
                        {
                          "title": "Time:",
                          "value": `${callTime}`
                        },
                        {
                          "title": "Phone:",
                          "value": `${callPhone}`
                        }
                      ]
                    }
                  ],
                  "style": "emphasis",
                  "spacing": "None"
                }
              ],
              "separator": true
            },
            {
              "type": "ColumnSet",
              "columns": [
                {
                  "type": "Column",
                  "width": "stretch",
                  "items": [
                    {
                      "type": "TextBlock",
                      "text": "Store Information",
                      "wrap": true,
                      "size": "Large",
                      "weight": "Bolder",
                      "color": "Accent",
                      "spacing": "None"
                    }
                  ]
                }
              ],
              "spacing": "ExtraLarge"
            },
            {
              "type": "ColumnSet",
              "columns": [
                {
                  "type": "Column",
                  "width": "stretch",
                  "style": "emphasis",
                  "items": [
                    {
                      "type": "FactSet",
                      "facts": [
                        {
                          "title": "Num:",
                          "value": `${storeNumber}`
                        },
                        {
                          "title": "Emp:",
                          "value": `${storeEmployeeName}`
                        },
                        {
                          "title": "DM:",
                          "value": `${storeDMName}`
                        }
                      ]
                    }
                  ],
                  "spacing": "None"
                },
                {
                  "type": "Column",
                  "width": "stretch",
                  "items": [
                    {
                      "type": "FactSet",
                      "facts": [
                        {
                          "title": "Store Manager:",
                          "value": `${isStoreEmployeeManager}`
                        },
                        {
                          "title": "DM Contacted:",
                          "value": "REMOVED"
                        }
                      ]
                    }
                  ],
                  "style": "emphasis",
                  "spacing": "None"
                }
              ],
              "separator": true
            },
            {
              "type": "ColumnSet",
              "columns": [
                {
                  "type": "Column",
                  "width": "stretch",
                  "items": [
                    {
                      "type": "TextBlock",
                      "text": "Incident Details",
                      "wrap": true,
                      "size": "Large",
                      "weight": "Bolder",
                      "color": "Accent"
                    }
                  ]
                }
              ],
              "spacing": "ExtraLarge"
            },
            {
              "type": "ColumnSet",
              "columns": [
                {
                  "type": "Column",
                  "width": "stretch",
                  "items": [
                    {
                      "type": "FactSet",
                      "facts": [
                        {
                          "title": "Type:",
                          "value": `${incidentType}`
                        },
                        {
                          "title": "Error:",
                          "value": `${incidentErrorCode}`
                        }
                      ]
                    }
                  ],
                  "style": "emphasis",
                  "spacing": "None"
                },
                {
                  "type": "Column",
                  "width": "stretch",
                  "items": [
                    {
                      "type": "FactSet",
                      "facts": [
                        {
                          "title": "POS #:",
                          "value": `${incidentPos}`
                        },
                        {
                          "title": "Procedural:",
                          "value": `${isProceduralText}`
                        }
                      ]
                    }
                  ],
                  "style": "emphasis",
                  "spacing": "None"
                }
              ],
              "horizontalAlignment": "Left",
              "style": "default",
              "separator": true
            },
            {
              "type": "ColumnSet",
              "columns": [
                {
                  "type": "Column",
                  "width": "stretch",
                  "items": [
                    {
                      "type": "FactSet",
                      "facts": [
                        {
                          "title": "Txn Type:",
                          "value": `${incidentTransaction.type}`
                        },
                        {
                          "title": "Inc Report:",
                          "value": `${incidentTransaction.hasVarianceReport}`
                        }
                      ]
                    }
                  ],
                  "style": "emphasis",
                  "spacing": "None"
                },
                {
                  "type": "Column",
                  "width": "stretch",
                  "items": [
                    {
                      "type": "FactSet",
                      "facts": [
                        {
                          "title": "Txn #:",
                          "value": `${incidentTransaction.number}`
                        }
                      ]
                    }
                  ],
                  "style": "emphasis",
                  "spacing": "None"
                }
              ],
              "spacing": "None",
              "isVisible": isEmptyObject(incidentTransaction) ? false : true
            },
            {
              "type": "ColumnSet",
              "columns": [
                {
                  "type": "Column",
                  "width": "stretch",
                  "style": "emphasis",
                  "horizontalAlignment": "Left",
                  "items": [
                    {
                      "type": "Input.Text",
                      "placeholder": "What happened during this incident, actions taken, etc...",
                      "label": "Details:",
                      "id": "incident.details",
                      "value": `${incidentDetails}`,
                      "isMultiline": true,
                    }
                  ],
                  "height": "stretch"
                }
              ],
              "spacing": "None",
              "height": "stretch"
            },
            {
              "type": "ColumnSet",
              "columns": [
                {
                  "type": "Column",
                  "width": "stretch",
                  "horizontalAlignment": "Left",
                  "items": [
                    {
                      "type": "TextBlock",
                      "text": `${id}`,
                      "wrap": true,
                      "size": "Small",
                      "fontType": "Monospace",
                      "weight": "Lighter",
                      "color": "Default",
                      "isSubtle": true
                    }
                  ],
                  "verticalContentAlignment": "Bottom"
                },
                {
                  "type": "Column",
                  "width": "auto",
                  "items": [
                    {
                      "type": "TextBlock",
                      "text": `${appVersion}`,
                      "wrap": true,
                      "fontType": "Monospace",
                      "size": "Small",
                      "weight": "Lighter",
                      "isSubtle": true,
                      "spacing": "None"
                    }
                  ],
                  "verticalContentAlignment": "Bottom",
                  "horizontalAlignment": "Right"
                }
              ],
              "separator": true,
              "horizontalAlignment": "Left"
            }
          ]
        }
      }
    ]
  };
};
