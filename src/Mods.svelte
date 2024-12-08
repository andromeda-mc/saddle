<script>
    import { searchMods, searchDatapacks } from "./modrinth_wrapper.js";
    import ModList from "./ModList.svelte";
    export let serverlist;
    export let mgsServer;
    export let installMod;
    let result;
    let datapackMode = false;
    let optionalMode = false;

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
                        on:change={(d) => {
                            optionalMode = d.target.checked;
                        }}
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
                <ModList
                    listPromise={result}
                    installMode={true}
                    {installMod}
                    {datapackMode}
                    {optionalMode}
                    {serverlist}
                    {mgsServer}
                />
            </div>
        </div>
    </div>
</div>
