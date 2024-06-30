import { WebSocketServer } from "ws";

export function returnHardWareStatus(
  message: WsRequest,
  sender: ExtWebSocket,
  wss: WebSocketServer
) {
  const receipientType = message.headers.receiverType;
  const senderId = message.headers.senderId;
  const hardwareClient = Array.from(wss.clients).find((client) => {
    const extWs = client as ExtWebSocket;
    return extWs.id === senderId && extWs.type === receipientType;
  });

  const response: WsResponse = {
    headers: {
      type: "update",
      online: hardwareClient ? true : false,
    },
  };

  sender.send(JSON.stringify(response));
}

export function alertDashboardOnConnect(
  connectedClient: ExtWebSocket,
  wss: WebSocketServer
) {
  const dashboardClient = Array.from(wss.clients).find((client) => {
    const extWs = client as ExtWebSocket;
    return (
      extWs.id === connectedClient.id && extWs.type != connectedClient.type
    );
  });

  const response: WsResponse = {
    headers: {
      type: "update",
      online: true,
    },
  };

  dashboardClient?.send(JSON.stringify(response));
}

export function alertDashboardOnDisconnect(
  connectedClient: ExtWebSocket,
  wss: WebSocketServer
) {
  const dashboardClient = Array.from(wss.clients).find((client) => {
    const extWs = client as ExtWebSocket;
    return (
      extWs.id === connectedClient.id && extWs.type != connectedClient.type
    );
  });

  const response: WsResponse = {
    headers: {
      type: "update",
      online: false,
    },
  };

  dashboardClient?.send(JSON.stringify(response));
}
