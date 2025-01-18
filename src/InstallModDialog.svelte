<script>
    import { ProjectsService, VersionsService } from "modrinthjs";
    import { capitalize } from "./utils.js";
    import { getVers } from "./modrinth_wrapper.js";

    export let mod_install_vid;
    export let mod_install_pid;
    export let installMod;
    export let serverlist_entry;

    function install(version, deny_optional) {
        console.log("Installing: " + version.name);
        const datapack_mode = version.loaders[0] === "datapack";

        installMod(
            version.project_id,
            version.id,
            version.files[0].url,
            datapack_mode,
        );

        for (let i = 0; i < version.dependencies.length; i++) {
            const depend = version.dependencies[i];

            if (
                deny_optional
                    ? depend.dependency_type != "required"
                    : !document.getElementById("installModDep" + i).checked
            ) {
                continue;
            }

            let dependency;
            if (depend.version_id) {
                // has specific needed version specified
                dependency = VersionsService.getVersion(depend.version_id);
            } else if (datapack_mode) {
                // has a datapack dependency but no version specified
                dependency = getVers(
                    "datapack",
                    serverlist_entry.mc_version,
                    depend.project_id,
                );
            } else {
                // has a mod dependency but no version specified
                dependency = getVers(
                    serverlist_entry.software,
                    serverlist_entry.mc_version,
                    depend.project_id,
                );
            }

            dependency.then((d) => {
                if (d.constructor === Array) {
                    d = d[0];
                }
                install(d, true);
            });
        }
    }
</script>

<div
    class="modal fade"
    tabindex="-1"
    id="installModModal"
    aria-hidden="true"
    aria-labelledby=""
    data-bs-backdrop="static"
>
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            {#if mod_install_pid && mod_install_vid}
                {#await Promise.all( [VersionsService.getVersion(mod_install_vid), ProjectsService.getProject(mod_install_pid)], )}
                    <div class="modal-header">
                        <div
                            class="spinner-border"
                            style="--bs-spinner-border-width: 0.25rem"
                        />
                        <h5 class="modal-title">Loading...</h5>
                    </div>
                    <div class="modal-body" />
                {:then [version, project]}
                    <div class="modal-header">
                        <h5 class="modal-title">
                            Installing {project.title} ({version.version_number})
                        </h5>
                        <button
                            type="button"
                            class="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        />
                    </div>
                    <div class="modal-body">
                        <table
                            class="table table-striped table-bordered table-responsive"
                        >
                            <thead>
                                <tr>
                                    <th scope="col">Install?</th>
                                    <th scope="col">Mod name</th>
                                    <th scope="col">Version</th>
                                    <th scope="col">Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <input
                                            type="checkbox"
                                            disabled="true"
                                            checked="true"
                                        />
                                    </td>
                                    <td>{project.title}</td>
                                    <td>{version.version_number}</td>
                                    <td />
                                </tr>
                                {#each version.dependencies as dep_ob, i}
                                    <tr>
                                        <td>
                                            <input
                                                type="checkbox"
                                                disabled={dep_ob.dependency_type !=
                                                    "optional"}
                                                checked={dep_ob.dependency_type ==
                                                    "required"}
                                                id="installModDep{i}"
                                            />
                                        </td>
                                        <td>
                                            {#await ProjectsService.getProject(dep_ob.project_id)}
                                                <em>Loading...</em>
                                            {:then dep_pj}
                                                {dep_pj.title}
                                            {:catch}
                                                <strong
                                                    >Failed to load project</strong
                                                >
                                            {/await}
                                        </td>
                                        <td
                                            >{#if dep_ob.version_id}
                                                {#await ProjectsService.getProject(dep_ob.version_id)}
                                                    <em>Loading...</em>
                                                {:then dep_ver}
                                                    {dep_ver.version_number}
                                                {:catch}
                                                    <strong
                                                        >Failed to load version</strong
                                                    >
                                                {/await}
                                            {/if}</td
                                        >
                                        <td>
                                            {capitalize(dep_ob.dependency_type)}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            data-bs-toggle="modal"
                            data-bs-target="#modManager">Cancel</button
                        >
                        <button
                            type="button"
                            class="btn btn-primary"
                            data-bs-toggle="modal"
                            data-bs-target="#modManager"
                            on:click={() => install(version)}>Install</button
                        >
                    </div>
                {:catch error}
                    <div class="modal-header">
                        <h5 class="modal-title">Failed to load!</h5>
                        <button
                            type="button"
                            class="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        />
                    </div>
                    <div class="modal-body">
                        Failed to fetch data: {error.message}
                    </div>
                {/await}
            {/if}
        </div>
    </div>
</div>
