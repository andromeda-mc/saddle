import { VersionsService, type CancelablePromise, type Version } from "modrinthjs";
import { con } from "./client.svelte";
import { getVers } from "./modrinthWrapper";

export function installMod(server_name: string, p_id: string, version: Version, isDatapack: boolean) {
	const installed = Object.fromEntries(con.state.servers[server_name][isDatapack ? "datapacks" : "mods"]);

	if (installed[p_id] === version.id) return console.log(`Skipping ${version.name}, as it is already installed`);

	con.runJob(isDatapack ? "installDatapack" : "installMod", server_name, p_id, version.id, version.files[0].url);
}

export async function installModWithDependencies(
	server_name: string,
	version: Version,
	installList: Record<string, boolean>,
	skipOptional?: boolean
) {
	console.log("Installing: " + version.name);
	const isDatapack = version.loaders![0] === "datapack";

	installMod(server_name, version.project_id, version, isDatapack);

	for (const dep of version.dependencies ?? []) {
		console.log("Checking: " + dep.project_id);
		if (skipOptional ? dep.dependency_type !== "required" : !installList[dep.project_id!]) {
			console.log(`Ignoring ${dep.project_id}`);
			continue;
		}

		let dependency: Version;

		if (dep.version_id) {
			// has specific needed version specified
			dependency = await VersionsService.getVersion(dep.version_id);
		} else {
			// has no specific version specified
			dependency = (await getVers(server_name, dep.project_id!, isDatapack))[0];
		}

		installModWithDependencies(server_name, dependency, installList, true);
	}
}
