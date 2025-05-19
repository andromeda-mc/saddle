import { WebsocketStateClient } from "./websocketStateClient.svelte";
import * as t from "io-ts";

const State = t.union([
  t.literal("starting"),
  t.literal("running"),
  t.literal("stopping"),
  t.literal("stopped"),
]);

const QueueDump = t.array(t.string);
const QueueUpdate = t.type({ data: t.literal("queue"), queue: QueueDump });

// ListServers
const Mod = t.tuple([t.string, t.string]);

const Server = t.type({
  software: t.union([
    t.literal("Vanilla"),
    t.literal("Paper"),
    t.literal("Fabric"),
    t.literal("Forge"),
  ]),
  java: t.string,
  java_ver: t.string,
  software_version: t.string,
  mc_version: t.string,
  autostart: t.boolean,
  autorestart: t.boolean,
  mods: t.array(Mod),
  datapacks: t.array(Mod),
});

const ServerList = t.type({
  data: t.literal("serverlist"),
  servers: t.record(t.string, Server),
  states: t.record(t.string, State),
  queue: QueueDump,
});

export const con = $state(
  new WebsocketStateClient({
    exceptionCondition: (response) => response.data === "exception",
    jobs: {
      auth: {
        messageTemplate: { data: "auth", hash: "%s" },
        returnType: t.type({ data: t.literal("welcome") }),
      },
      listservers: {
        messageTemplate: { data: "listservers" },
        returnType: ServerList,
      },
      startServer: {
        messageTemplate: { data: "startserver", server_name: "%s" },
        returnType: QueueUpdate,
      },
      stopServer: {
        messageTemplate: { data: "stopserver", server_name: "%s" },
        returnType: QueueUpdate,
      },
    },
    startState: {
      authed: false,
      servers: {} as Record<string, t.TypeOf<typeof Server>>,
      states: {} as Record<string, t.TypeOf<typeof State>>,
      cpu_percent: 0,
      memory_percent: 0,
    },
  })
);

con.addMessageListener((m) => {
  switch (m.data) {
    case "serverstate":
      con.state.states[m.server] = m.state;

		case "sysstats":
			con.state.cpu_percent = m.cpu;
			con.state.memory_percent = m.mem;
  }
});
