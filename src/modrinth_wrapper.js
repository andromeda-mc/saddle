import { ProjectsService, VersionsService } from "modrinthjs";

export async function searchMods(software, version, query) {
    const type = software === "Paper" ? "plugin" : "mod";
    const facets = [["versions:" + version], ["server_side:optional", "server_side:required"], ["categories:" + software.toLowerCase()], ["project_type:" + type]];
    return await ProjectsService.searchProjects(query, JSON.stringify(facets));
}


export async function searchDatapacks(version, query) {
    const facets = [["versions:" + version], ["project_type:datapack"]];
    return await ProjectsService.searchProjects(query, JSON.stringify(facets));
}


export async function getVers(software, version, id) {
    // software = datapack for datapack mode
    return await VersionsService.getProjectVersions(id, `["${software.toLowerCase()}"]`, `["${version}"]`);
}
