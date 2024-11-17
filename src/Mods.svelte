<script>
    import { VersionsService } from "modrinthjs";
    import {
        searchMods,
        searchDatapacks,
        getLatestVerMod,
        getLatestVerDatapack,
    } from "./modrinth_wrapper.js";
    import { format } from "./utils.js";
    import { Download, Heart, Plus } from "svelte-bootstrap-icons";

    export let serverlist;
    export let mgsServer;
    export let installMod;
    let result;
    let datapackMode = false;

    function searchEntered(d) {
        if (d.key == "Enter") {
            advSearch(document.getElementById("modsSearch").value);
        }
    }

    function advSearch(query) {
        if (datapackMode) {
            result = searchDatapacks(serverlist[mgsServer].mc_version, query);
        } else {
            result = searchMods(
                serverlist[mgsServer].software,
                serverlist[mgsServer].mc_version,
                query,
            );
        }
    }

    function install(id) {
        const install_optional =
            document.getElementById("installOptional").checked;
        let promise;

        if (datapackMode) {
            promise = getLatestVerDatapack(
                serverlist[mgsServer].mc_version,
                id,
            );
        } else {
            promise = getLatestVerMod(
                serverlist[mgsServer].software,
                serverlist[mgsServer].mc_version,
                id,
            );
        }
        promise.then((data) => {
            const latest_ver = data[0];

            installMod(
                id,
                latest_ver.id,
                latest_ver.files[0].url,
                datapackMode,
            );

            if (latest_ver.dependencies.length) {
                for (const depend of latest_ver.dependencies) {
                    if (
                        depend.dependency_type == "optional" &&
                        !install_optional
                    ) {
                        continue;
                    }

                    let depend_ver;
                    if (depend.version_id) {
                        depend_ver = VersionsService.getVersion(
                            depend.version_id,
                        );
                    } else if (datapackMode) {
                        depend_ver = getLatestVerDatapack(
                            serverlist[mgsServer].mc_version,
                            depend.project_id,
                        );
                    } else {
                        depend_ver = getLatestVerMod(
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
        });
    }
</script>

<div
    class="modal fade"
    id="modManager"
    tabindex="-1"
    aria-labelledby="modManagerLabel"
    aria-hidden="true"
    data-bs-backdrop="static"
    on:show.bs.modal={() => {
        document.getElementById("modsSearch").value = "";
    }}
    on:shown.bs.modal={advSearch}
>
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="manageServerLabel">
                    Install Mods, Plugins and Datapacks
                </h1>
                <button
                    type="button"
                    class="btn-close"
                    data-bs-toggle="modal"
                    data-bs-target="#manageServer"
                    aria-label="Close"
                />
            </div>
            <div class="modal-body">
                <input
                    type="text"
                    id="modsSearch"
                    class="form-control"
                    placeholder="Search for mods or plugins"
                    on:keydown={searchEntered}
                />
                <div class="form-check">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        value=""
                        id="installOptional"
                    />
                    <label class="form-check-label" for="installOptional">
                        Also install optional dependencies
                    </label>
                </div>
                <div class="form-check">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        value=""
                        id="datapackMode"
                        on:change={(d) => {
                            datapackMode = d.target.checked;
                            advSearch(
                                document.getElementById("modsSearch").value,
                            );
                        }}
                    />
                    <label class="form-check-label" for="datapackMode">
                        Search for Datapacks instead
                    </label>
                </div>
                {#await result}
                    <div class="card my-1">
                        <div class="d-flex">
                            <div
                                class="bg-secondary"
                                style="width: 128px; height: 128px;"
                            />
                            <div class="card-body">
                                <h5 class="card-title placeholder-glow">
                                    <span class="placeholder col-6" />
                                </h5>
                                <h6 class="card-subtitle placeholder-glow">
                                    <span class="placeholder col-1" />
                                    <span class="placeholder col-5" />
                                </h6>
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
                        {#each data.hits as hit}
                            <div class="card my-1">
                                <div class="d-flex">
                                    {#if hit.icon_url}
                                        <img
                                            src={hit.icon_url}
                                            alt="logo"
                                            height="128"
                                        />
                                    {:else}
                                        <div
                                            class="bg-secondary d-flex align-items-center justify-content-center text-light"
                                            style="width: 128px; height: 128px;"
                                        >
                                            No logo
                                        </div>
                                    {/if}
                                    <div class="card-body">
                                        <h5
                                            class="card-title d-flex justify-content-between"
                                        >
                                            <a
                                                class="link-info"
                                                target="_blank"
                                                href="https://modrinth.com/mod/{hit.slug}"
                                            >
                                                {hit.title}
                                            </a>
                                            <div>
                                                <Download
                                                    class="me-1"
                                                />{format(hit.downloads)}
                                                <Heart class="ms-2" />{format(
                                                    hit.follows,
                                                )}
                                                <button
                                                    type="button"
                                                    class="btn btn-primary"
                                                    on:click={() =>
                                                        install(hit.project_id)}
                                                    ><Plus /></button
                                                >
                                            </div>
                                        </h5>
                                        <h6
                                            class="card-subtitle text-body-secondary"
                                        >
                                            by {hit.author}
                                        </h6>
                                        <p class="card-text">
                                            {hit.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    {/if}
                {/await}
            </div>
        </div>
    </div>
</div>
