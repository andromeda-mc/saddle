import { ProjectsService, VersionsService } from "modrinthjs";
import { con } from "./client.svelte";

export function search(serverName: string, query: string, isDatapack: boolean) {
	const mc_version = con.state.servers[serverName].mc_version;
	const software = isDatapack ? "datapack" : con.state.servers[serverName].software;

	let facets;

	if (software === "datapack") {
		facets = [["versions:" + mc_version], ["project_type:datapack"]];
	} else {
		const type = software === "Paper" ? "plugin" : "mod";

		facets = [
			["versions:" + mc_version],
			["server_side:optional", "server_side:required"],
			["categories:" + software.toLowerCase()],
			["project_type:" + type],
		];
	}

	return ProjectsService.searchProjects(query, JSON.stringify(facets));
}

export function getVers(serverName: string, id: string, isDatapack?: boolean) {
	let { software }: { software: string } = con.state.servers[serverName];
	const { mc_version }: { mc_version: string } = con.state.servers[serverName];

	if (isDatapack) software = "datapack";

	return VersionsService.getProjectVersions(id, `["${software.toLowerCase()}"]`, `["${mc_version}"]`);
}
