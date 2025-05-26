import { goto } from "$app/navigation";
import { page } from "$app/state";
import type { TeamMember } from "modrinthjs";
import { con } from "./client.svelte";

export const capitalize = (string: string) => string.charAt(0).toUpperCase() + string.slice(1);

export function assembleBasePath(u: WebSocket["url"] | URL): string {
	const url = new URL(u);
	return `/${url.protocol.substring(0, url.protocol.length - 1)}/${url.hostname}/`;
}

export const assembleWSPath = (protocol: string, ip: string): string => `${protocol}://${ip}:29836`;

const stripProtocolIp = (str: string): string => str.replace(/\/wss?\/\w*/, "");

export function redirectToLogin(): void {
	console.log("Redirecting to login...");
	goto(assembleBasePath(con.websocket!.url) + "login?" + stripProtocolIp(page.url.pathname));
}

export const assembleModrinthUrl = (slug: string, isDatapack: boolean): string =>
	`https://modrinth.com/${isDatapack ? "datapack" : "mod"}/${slug}`;

export const reduceToOwner = (members: TeamMember[]): TeamMember => members.find((e) => e.role.toLowerCase() === "owner") ?? members[0];

export function format(num: number) {
	return Intl.NumberFormat(undefined, {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(num);
}
