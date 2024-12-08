<script>
    import { Download, Heart, TrashFill, Plus } from "svelte-bootstrap-icons";
    import { format } from "./utils.js";
    import { getVers } from "./modrinth_wrapper.js";

    export let listPromise;
    export let installMod;
    export let installMode = false;
    export let datapackMode = false;
    export let sort = false;
    export let optionalMode = false;
    export let uninstallMod = undefined;
    export let serverlist = undefined;
    export let mgsServer = undefined;
    export let versions = undefined;

    function fix_data(data) {
        if (data.hits) {
            data = data.hits;
        }
        if (sort) {
            return data.sort((a, b) => {
                return a.title.localeCompare(b.title);
            });
        } else {
            return data;
        }
    }

    function install(id, ver_id, install_optional) {
        installMod(id, ver_id.id, ver_id.files[0].url, datapackMode);

        if (ver_id.dependencies.length) {
            for (const depend of ver_id.dependencies) {
                if (depend.dependency_type == "optional" && !install_optional) {
                    continue;
                }

                let depend_ver;
                if (depend.version_id) {
                    depend_ver = VersionsService.getVersion(depend.version_id);
                } else if (datapackMode) {
                    depend_ver = getVers(
                        "datapack",
                        serverlist[mgsServer].mc_version,
                        depend.project_id,
                    );
                } else {
                    depend_ver = getVers(
                        serverlist[mgsServer].software,
                        serverlist[mgsServer].mc_version,
                        depend.project_id,
                    );
                }
                depend_ver.then((d) => {
                    if (d.constructor === Array) {
                        d = d[0];
                    }
                    installMod(
                        d.project_id,
                        d.id,
                        d.files[0].url,
                        datapackMode,
                    );
                });
            }
        }
    }

    function getVersion(data, id) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].id == id) {
                return data[i];
            }
        }
    }

    function updateMod(id, latest_ver) {
        uninstallMod(id, datapackMode);
        install(id, latest_ver, false);
    }
</script>

{#await listPromise}
    <div class="card my-1">
        <div class="d-flex">
            <div class="bg-secondary" style="width: 128px; height: 128px;" />
            <div class="card-body">
                <h5 class="card-title placeholder-glow">
                    <span class="placeholder col-6" />
                </h5>
                <p class="card-text placeholder-glow">
                    <span class="placeholder col-7" />
                    <span class="placeholder col-4" />
                    <span class="placeholder col-5" />
                    <span class="placeholder col-6" />
                    <span class="placeholder col-8" />
                    <span class="placeholder col-3" />
                </p>
            </div>
        </div>
    </div>
{:then data}
    {#if data}
        {@const dataf = fix_data(data)}
        {#each dataf as hit}
            <div class="card my-2">
                <div class="d-flex">
                    {#if hit.icon_url}
                        <img src={hit.icon_url} alt="logo" height="128" />
                    {:else}
                        <div
                            class="bg-secondary d-flex align-items-center justify-content-center text-light"
                            style="width: 128px; height: 128px;"
                        >
                            No logo
                        </div>
                    {/if}
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h5 class="card-title">
                                    <a
                                        class="link-info"
                                        target="_blank"
                                        href="https://modrinth.com/{datapackMode
                                            ? 'datapack'
                                            : 'mod'}/{hit.slug}"
                                    >
                                        {hit.title}
                                    </a>
                                </h5>
                                {#if hit.author}
                                    <h6
                                        class="card-subtitle text-body-secondary"
                                    >
                                        by {hit.author}
                                    </h6>
                                {/if}
                                <p class="card-text">
                                    {hit.description}
                                </p>
                            </div>
                            <div class="text-end">
                                <Download class="me-1" />{format(hit.downloads)}
                                <Heart class="ms-2 me-1" />{format(
                                    hit.followers ? hit.followers : hit.follows,
                                )}
                                {#if installMode}
                                    {#await getVers(datapackMode ? "datapack" : serverlist[mgsServer].software, serverlist[mgsServer].mc_version, hit.project_id)}
                                        <button
                                            type="button"
                                            class="btn btn-primary mb-1"
                                            disabled
                                        >
                                            <span
                                                class="spinner-border spinner-border-sm"
                                                aria-hidden="true"
                                            />
                                            <span role="status">Loading...</span
                                            ></button
                                        >
                                    {:then data}
                                        <button
                                            type="button"
                                            class="btn btn-primary mb-1 ms-2"
                                            on:click={() =>
                                                install(
                                                    hit.project_id,
                                                    getVersion(
                                                        data,
                                                        document.getElementById(
                                                            "verselect-" +
                                                                hit.project_id,
                                                        ).value,
                                                    ),
                                                    optionalMode,
                                                )}
                                        >
                                            <Plus />
                                            Install
                                        </button>

                                        <select
                                            class="form-select form-select-sm"
                                            style="width: 19rem;"
                                            id={"verselect-" + hit.project_id}
                                        >
                                            {#each data as version}
                                                <option value={version.id}
                                                    >{version.name}</option
                                                >
                                            {/each}
                                        </select>
                                    {/await}
                                {:else}
                                    <button
                                        type="button"
                                        class="btn btn-danger mb-2 ms-2"
                                        on:click={() =>
                                            uninstallMod(hit.id, datapackMode)}
                                    >
                                        <TrashFill />
                                        Uninstall
                                    </button>
                                    <br />

                                    {#await getVers(datapackMode ? "datapack" : serverlist[mgsServer].software, serverlist[mgsServer].mc_version, hit.id)}
                                        <button
                                            class="btn btn-secondary"
                                            disabled
                                            >Searching for updates...</button
                                        >
                                    {:then data}
                                        {#if versions[hit.id] === data[0].id}
                                            <button
                                                type="button"
                                                class="btn btn-primary"
                                                disabled>Up to date</button
                                            >
                                        {:else}
                                            <button
                                                type="button"
                                                class="btn btn-success icon-link"
                                                on:click={updateMod(
                                                    hit.id,
                                                    data[0],
                                                )}
                                            >
                                                <Download />Update to {data[0]
                                                    .version_number}
                                            </button>
                                        {/if}
                                    {/await}
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    {/if}
{/await}
