// import express from "express";

// const app = express();

// app.get("/", (req, res) => {
//   res.send("Hello, World!");
// });

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

import express from "express";
import cors from "cors";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import { User } from "./models/UserModels.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
app.use(cors());
app.use(express.urlencoded({ extended: false }));
// extend the websocket library to add new properties
interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
  id: string | null;
  type: string | null;
}

interface messageType {
  type: string;
  message: string;
  sender: string;
  receiverID: string;
}

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// server.on("upgrade", function upgrade(request, socket, head) {
//   // wss.handleUpgrade(request, socket, head, function done(ws) {
//   //   wss.emit('connection', ws, request);
//   // });
//   console.log("upgrade required");
//   console.log(request);
// });

// declare an array to hold all the connected clients
var connectedClients: Array<WebSocket> = [];

let interval: NodeJS.Timeout;

wss.on("connection", (ws: WebSocket, request) => {
  const extWs = ws as ExtWebSocket;
  console.log("A new client connected");

  console.log("THis is the number of clients: ", wss.clients.size);
  // get the parameters from the request object
  const { searchParams } = new URL(
    request.url!,
    `http://${request.headers.host}`
  );

  //assign the paraeters to the websocket object
  extWs.id = searchParams.get("id");
  extWs.type = searchParams.get("type");
  extWs.isAlive = true;

  extWs.on("error", console.error);

  // when a pong is received, set the "isAlive" of the client to true
  extWs.on("pong", () => {
    console.log("Pong received");
    extWs.isAlive = true;
  });

  // extWs.on("message", (message) => {
  //   console.log("Received:", message);
  //   extWs.send(`Got your message: ${message}`);
  // });

  /// Alert the dashboard when hardware is online
  alertDashboardOnConnectOrDisconnect(extWs, "online");

  extWs.on("message", (message) => {
    // const mes = message.toJSON()
    const messageObject: messageType = JSON.parse(message.toString());
    console.log("message object: ", messageObject);

    if (messageObject.type == "checkIfOnline") {
      console.log("Check if online message");
      checkOnlineStatus(messageObject, extWs);
    } else if (messageObject.type == "updateTankLevel") {
      //update the database, and write the cureent tank water level
      let tankMonitorId = extWs.id;
      updateTankLevel(tankMonitorId, Number(messageObject.message));
      //send a message to the dashboard, so that it can update the level being shown
      let receipient = connectedClients.find((client) => {
        return (
          extWs.id === messageObject.receiverID && extWs.type === "dashboard"
        );
      });
      console.log(messageObject);
      //console.log("Command goes to: ", receipient);
      receipient?.send(JSON.stringify(messageObject));
    } else if (messageObject.type == "comm") {
      console.log("Command message");
      let receipient = Array.from(wss.clients).find((client: WebSocket) => {
        const extWs = client as ExtWebSocket;
        return (
          extWs.id === messageObject.receiverID &&
          extWs.type !== messageObject.sender
        );
      });
      //console.log("Command goes to: ", receipient);
      receipient?.send(JSON.stringify(messageObject));
    }
  });

  // extWs.send("Hello, client! Welcome to the WebSocket server.");

  // const interval = setInterval(function ping() {
  //   wss.clients.forEach(function each(ws) {
  //     if (extWs.isAlive === false) return extWs.terminate();
  //     alertDashboardOnConnectOrDisconnect(extWs, "offline");
  //     extWs.isAlive = false;
  //     extWs.ping();
  //   });
  // }, 5000);



  extWs.on("close", () => {
    console.log("A client disconnected!");
    clearInterval(interval);
    alertDashboardOnConnectOrDisconnect(extWs, "offline");
    // client.terminate();
    // connectedClients = connectedClients.filter((item) => item !== client);
    // alertDashboardOnConnectOrDisconnect(client, "offline");
    //console.log("This is the client that disconnected", client);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});




function checkOnlineStatus(message: messageType, client: WebSocket) {
  let receipient = Array.from(wss.clients).find((client) => {
    const extWs = client as ExtWebSocket;
    return extWs.id === message.receiverID && extWs.type === "hardware";
  });
  if (receipient) {
    console.log("Found a recipient");
    const response = {
      type: "checkIfOnline",
      message: "online",
      sender: "server",
      receiverID: message.receiverID,
    };
    client.send(JSON.stringify(response));
  } else {
    console.log("Found no recipient");
    const response = {
      type: "checkIfOnline",
      message: "offline",
      sender: "server",
      receiverID: message.receiverID,
    };
    client.send(JSON.stringify(response));
  }
}


function alertDashboardOnConnectOrDisconnect(hardwareClient: WebSocket, messageType: string) {
  const dashboardClient = Array.from(wss.clients).find((client) => {
    const extWs = client as ExtWebSocket;
    return (hardwareClient as ExtWebSocket).id === extWs.id && extWs.type === "dashboard";
  });



  if (dashboardClient) {
    const response = {
      type: "checkIfOnline",
      message: messageType,
      sender: "server",
      receiverID: (dashboardClient as ExtWebSocket).id,
    };

    dashboardClient.send(JSON.stringify(response));
  }
}

async function updateTankLevel(
  tankMonitorId: string | null,
  newTankLastLevel: Number
) {
  try {
    let res = await User.updateOne(
      { "tankMonitor.tankMonitorId": tankMonitorId },
      { $set: { "tankMonitor.tankLastLevel": newTankLastLevel } }
    );
    return res;
  } catch (err) {
    throw new Error();
  }
}

//functions
/*
notify the dashboard if the hardware is online and do same when the hardware goes offline
forward a message from the dashboard to hardware  and do same from hardware to dashboard
 */
