<script>
    import {
        ExclamationTriangleFill,
        Terminal,
        GearFill,
        PeopleFill,
        Folder,
        GlobeAmericas,
        PersonFillAdd,
        Plugin,
        Download,
        InfoCircle,
        Puzzle,
    } from "svelte-bootstrap-icons";
    import { ScrollSpy } from "bootstrap";
    import StartStopButton from "./StartStopButton.svelte";
    import { modsToList, modsListToVerList } from "./utils.js";
    import { ProjectsService } from "modrinthjs";
    import ModList from "./ModList.svelte";
    export let mgsServer;
    export let mgsProperties;
    export let statelist;
    export let serverlist;
    export let startServer;
    export let stopServer;
    export let setProperty;
    export let uninstallMod;
    export let websocket;
    export let mgsInitTerminal;
    export let installMod;
    let modsList;
    let datapacksList;

    function createModsList(list) {
        if (!list) {
            return;
        }
        modsList = ProjectsService.getProjects(
            JSON.stringify(modsToList(list.mods)),
        );
        datapacksList = ProjectsService.getProjects(
            JSON.stringify(modsToList(list.datapacks)),
        );
    }

    function onShow() {
        createModsList(serverlist[mgsServer]);
        mgsInitTerminal();
    }

    function onHide() {
        websocket.send(
            JSON.stringify({
                data: "stopconsolelogging",
                server_name: mgsServer,
            }),
        );
    }

    function onShown() {
        websocket.send(
            JSON.stringify({
                data: "startconsolelogging+getproperties",
                server_name: mgsServer,
            }),
        );

        new ScrollSpy(document.getElementById("mgsBody"), {
            target: "#manageServerSidebar",
        });
    }

    $: createModsList(serverlist[mgsServer]);
</script>

<div
    class="modal fade"
    id="manageServer"
    tabindex="-1"
    aria-labelledby="manageServerLabel"
    aria-hidden="true"
    data-bs-backdrop="static"
    on:show.bs.modal={onShow}
    on:hide.bs.modal={onHide}
    on:shown.bs.modal={onShown}
>
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="manageServerLabel">
                    Managing Server: {mgsServer}
                </h1>
                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                />
            </div>
            <div class="modal-body">
                <nav
                    id="manageServerSidebar"
                    class="navbar bg-body-tertiary px-3 mb-3 rounded-2"
                >
                    <nav class="nav nav-pills">
                        <a
                            class="nav-link text-body icon-link"
                            href="#mgsConsole"
                        >
                            <Terminal />
                            Console
                        </a>
                        <a
                            class="nav-link text-body icon-link"
                            href="#mgsSettings"
                        >
                            <GearFill />
                            Settings
                        </a>
                        <a
                            class="nav-link text-body icon-link"
                            href="#mgsPlayers"
                        >
                            <PeopleFill />
                            Players
                        </a>
                        <a
                            class="nav-link text-body icon-link"
                            href="#mgsFiles"
                        >
                            <Folder />
                            Files
                        </a>
                        <a
                            class="nav-link text-body icon-link"
                            href="#mgsWorld"
                        >
                            <GlobeAmericas />
                            World
                        </a>
                        <a
                            class="nav-link text-body icon-link"
                            href="#mgsGuest"
                        >
                            <PersonFillAdd />
                            Guest Access
                        </a>
                        <a
                            class="nav-link text-body icon-link"
                            href="#mgsDatapacks"
                        >
                            <Puzzle />
                            Datapacks
                        </a>
                        {#if serverlist[mgsServer] && serverlist[mgsServer].software !== "Vanilla"}
                            <a
                                class="nav-link text-body icon-link"
                                href="#mgsMods"
                            >
                                <Plugin />
                                {serverlist[mgsServer].software == "Paper"
                                    ? "Plugins"
                                    : "Mods"}
                            </a>
                        {/if}
                    </nav>
                </nav>
                <div
                    id="mgsBody"
                    class="overflow-auto p-3"
                    data-bs-smooth-scroll="true"
                    style="max-height: 78vh;"
                >
                    <div id="mgsConsole">
                        <h4 class="icon-link">
                            <Terminal />Console
                        </h4>
                        <br />
                        <div id="mgs-terminal" />
                    </div>
                    <div id="mgsSettings">
                        <h4 class="icon-link">
                            <GearFill />Settings
                        </h4>
                        <br />
                        <div class="alert alert-info icon-link" role="alert">
                            <InfoCircle />
                            <div class="ms-1">
                                Changing a setting requires a server restart!
                            </div>
                        </div>
                        {#if mgsProperties[mgsServer] && mgsProperties[mgsServer].length}
                            <table
                                class="table table-striped table-bordered table-responsive"
                            >
                                <thead>
                                    <tr>
                                        <th scope="col">Option</th>
                                        <th scope="col">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each mgsProperties[mgsServer] as property, i}
                                        {@const type = property[2][1]}
                                        <tr class="align-middle">
                                            <td>
                                                {property[2][0]}
                                                <a
                                                    class="link-info text-decoration-none"
                                                    href="https://minecraft.wiki/w/Server.properties#{property[0]}"
                                                    target="_blank"
                                                    data-bs-toggle="tooltip"
                                                    data-bs-title="{property[2][3]}<p>Click for wiki entry</p>"
                                                    data-bs-html="true"
                                                >
                                                    <InfoCircle />
                                                </a>
                                                <br />
                                                <span
                                                    class="text-body-secondary"
                                                >
                                                    Default value:
                                                    <i>{property[2][2]}</i>
                                                </span>
                                            </td>
                                            <td>
                                                {#if type == "boolean"}
                                                    <div class="form-switch">
                                                        <input
                                                            class="form-check-input"
                                                            type="checkbox"
                                                            role="switch"
                                                            checked={property[1] ===
                                                                "true"}
                                                            on:change={(d) =>
                                                                setProperty(
                                                                    i,
                                                                    d.target.checked.toString(),
                                                                )}
                                                        />
                                                    </div>
                                                {:else if type == "string"}
                                                    <input
                                                        class="form-control"
                                                        type="text"
                                                        on:focusout={(d) =>
                                                            setProperty(
                                                                i,
                                                                d.target.value,
                                                            )}
                                                        value={property[1].replaceAll(
                                                            "\\",
                                                            "",
                                                        )}
                                                    />
                                                {:else if type == "integer" || type == "integer_range"}
                                                    <input
                                                        class="form-control"
                                                        type="number"
                                                        min={type == "integer"
                                                            ? "0"
                                                            : property[2][4]}
                                                        max={type == "integer"
                                                            ? "10000"
                                                            : property[2][5]}
                                                        on:focusout={(d) =>
                                                            setProperty(
                                                                i,
                                                                d.target.value.toString(),
                                                            )}
                                                        value={property[1]}
                                                    />
                                                {:else if type == "string_dropdown"}
                                                    <select
                                                        class="form-control"
                                                        on:change={(d) =>
                                                            setProperty(
                                                                i,
                                                                d.target.value,
                                                            )}
                                                    >
                                                        {#each Object.entries(property[2][4]) as option}
                                                            <option
                                                                value={option[0]}
                                                                selected={property[1] ==
                                                                    option[0]}
                                                            >
                                                                {option[1]}
                                                            </option>
                                                        {/each}
                                                    </select>
                                                {:else}
                                                    {property[1]}
                                                {/if}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        {/if}
                    </div>
                    <div id="mgsPlayers">
                        <h4 class="icon-link">
                            <PeopleFill />Players
                        </h4>
                        <br />
                    </div>
                    <div id="mgsFiles">
                        <h4 class="icon-link">
                            <Folder />Files
                        </h4>
                        <br />
                    </div>
                    <div id="mgsWorld">
                        <h4 class="icon-link">
                            <GlobeAmericas />World
                        </h4>
                        <br />
                    </div>
                    <div id="mgsGuest">
                        <h4 class="icon-link">
                            <PersonFillAdd />Guest Access
                        </h4>
                        <br />
                    </div>
                    <div id="mgsDatapacks">
                        <h4 class="icon-link">
                            <Puzzle />Datapacks
                        </h4>
                        <br />
                        <div class="alert alert-info icon-link" role="alert">
                            <InfoCircle />
                            <div class="ms-1">
                                (Un)installing datapacks requires a reload to
                                apply changes.
                            </div>
                        </div>
                        <br />
                        <button
                            type="button"
                            class="btn btn-primary"
                            data-bs-toggle="modal"
                            data-bs-target="#modManager"
                        >
                            <Download />
                            Install Mods, Plugins and Datapacks...
                        </button>

                        {#if serverlist[mgsServer] && serverlist[mgsServer].datapacks.length}
                            <ModList
                                listPromise={datapacksList}
                                {uninstallMod}
                                {installMod}
                                datapackMode={true}
                                sort={true}
                                versions={modsListToVerList(
                                    serverlist[mgsServer].datapacks,
                                )}
                                {serverlist}
                                {mgsServer}
                            />
                        {:else}<p>It's empty. No datapacks inside here.</p>{/if}
                    </div>
                    {#if serverlist[mgsServer] && serverlist[mgsServer].software !== "Vanilla"}
                        {@const type =
                            serverlist[mgsServer].software == "Paper"
                                ? "Plugins"
                                : "Mods"}
                        <div id="mgsMods">
                            <h4 class="icon-link">
                                <Plugin />{type}
                            </h4>
                            <br />
                            <div
                                class="alert alert-warning icon-link"
                                role="alert"
                            >
                                <ExclamationTriangleFill />
                                <div class="ms-1">
                                    (Un)installing {type.toLowerCase()}
                                    while the server is running is not recommended!
                                </div>
                            </div>
                            {#if serverlist[mgsServer].mods.length}
                                <ModList
                                    listPromise={modsList}
                                    {uninstallMod}
                                    {installMod}
                                    datapackMode={false}
                                    sort={true}
                                    versions={modsListToVerList(
                                        serverlist[mgsServer].mods,
                                    )}
                                    {serverlist}
                                    {mgsServer}
                                />
                            {:else}
                                <p>
                                    It's empty. No {type.toLowerCase()} inside here.
                                </p>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
            <div class="modal-footer">
                <StartStopButton
                    server_state={statelist[mgsServer]}
                    server={mgsServer}
                    {startServer}
                    {stopServer}
                />
                <button
                    type="button"
                    class="btn btn-secondary"
                    data-bs-dismiss="modal">Close</button
                >
            </div>
        </div>
    </div>
</div>

<style>
    .form-switch .form-check-input {
        margin-left: 0;
    }

    .form-switch {
        padding-left: 0;
    }
</style>
