import type { Terminal } from "@battlefieldduck/xterm-svelte";
import { WebsocketStateClient } from "./websocketStateClient.svelte";
import * as t from "io-ts";

const State = t.union([t.literal("starting"), t.literal("running"), t.literal("stopping"), t.literal("stopped")]);

const QueueDump = t.array(t.string);
const QueueUpdate = t.type({ data: t.literal("queue"), queue: QueueDump });

// ListServers
const Mod = t.tuple([t.string, t.string]);

export const Software = t.union([t.literal("Vanilla"), t.literal("Paper"), t.literal("Fabric"), t.literal("Forge")]);

const Server = t.type({
	software: Software,
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

// Properties

const genericProperty = t.tuple([
	t.string, // readable name
	t.union([t.literal("boolean"), t.literal("string"), t.literal("integer")]), // type
	t.string, // default value
	t.string, // popup description as html
]);

const stringDropdownProperty = t.tuple([
	t.string, // readable name
	t.literal("string_dropdown"), // type
	t.string, // default value
	t.string, // popup description as html
	t.record(t.string, t.string), // values formatted as: {[value]: [readable value]}
]);

// @ts-ignore
const integerRangeProperty: t.TupleC<
	[t.StringC, t.LiteralC<"integer_range">, t.StringC, t.StringC, t.NumberC, t.NumberC]
	// @ts-ignore
> = t.tuple([
	t.string, // readable name
	t.literal("integer_range"), // type
	t.string, // default value
	t.string, // popup description as html
	t.number, // min value
	t.number, // max value
]);

const PropertyMeta = t.union([genericProperty, stringDropdownProperty, integerRangeProperty]);

//                                     name      value     meta
export const legacyProperty = t.tuple([t.string, t.string, PropertyMeta]);

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
			writeConsole: {
				messageTemplate: {
					data: "console_write",
					server_name: "%s",
					content: "%s",
				},
			},
			subscribeLogging: {
				messageTemplate: {
					data: "startconsolelogging",
					server_name: "%s",
				},
				returnType: t.type({ data: t.literal("log_history"), log: t.string }),
			},
			unsubscribeLogging: {
				messageTemplate: { data: "stopconsolelogging" },
			},
			getProperties: {
				messageTemplate: { data: "getproperties", server_name: "%s" },
				returnType: t.type({
					data: t.literal("properties"),
					server_name: t.string,
					properties: t.array(legacyProperty), // TODO: Implement new properties type
				}),
			},
			deleteServer: {
				messageTemplate: { data: "deleteserver", name: "%s" },
				returnType: QueueUpdate,
			},
		},
		startState: {
			authed: false,
			servers: {} as Record<string, t.TypeOf<typeof Server>>,
			states: {} as Record<string, t.TypeOf<typeof State>>,
			cpu_percent: 0,
			memory_percent: 0,
			terminals: {} as Record<string, Terminal>,
		},
	})
);

con.addMessageListener((m) => {
	switch (m.data) {
		case "serverstate":
			con.state.states[m.server] = m.state;
			if (m.state === "starting") con.state.terminals[m.server].reset();

		case "sysstats":
			con.state.cpu_percent = m.cpu;
			con.state.memory_percent = m.mem;

		case "console_logging":
			if (!con.state.terminals[m.console]) return;
			con.state.terminals[m.console].write(m.msg);

		case "serverlist":
			const data = m as t.TypeOf<typeof ServerList>;
			con.state.servers = data.servers;
			con.state.states = data.states;
	}
});
