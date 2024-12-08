<script>
    import "bootstrap/dist/css/bootstrap.min.css";
    import "@xterm/xterm/css/xterm.css";
    import { Toast, Modal, Tooltip } from "bootstrap";
    import { sha256 } from "barely-sha256";
    import {
        MoonStarsFill,
        BrightnessHighFill,
        CardList,
        TrashFill,
        PencilFill,
        BoxArrowRight,
        Plus,
    } from "svelte-bootstrap-icons";
    import { Terminal } from "@xterm/xterm";
    import { FitAddon } from "@xterm/addon-fit";
    import { onMount } from "svelte";
    import { modsListToVerList } from "./utils.js";
    import StartStopButton from "./StartStopButton.svelte";
    import Queue from "./Queue.svelte";
    import Toasts from "./Toasts.svelte";
    import ManageServer from "./ManageServer.svelte";
    import Mods from "./Mods.svelte";

    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function statetoclass(state) {
        switch (state) {
            case "stopped":
                return "danger";
            case "starting":
                return "info";
            case "running":
                return "success";
            case "stopping":
                return "warning";
        }
    }

    let darkMode = localStorage.getItem("darkMode") !== "false";
    function updateTheme(mode) {
        localStorage.setItem("darkMode", darkMode);
        document.body.setAttribute("data-bs-theme", mode ? "dark" : "light");
    }

    onMount(() => {
        updateTheme(darkMode);
    });

    $: updateTheme(darkMode);

    function show_exception(title, subtitle) {
        console.error(`Andromeda exception:\n${title} - ${subtitle}`);
        const toastElement = document.getElementById("warningtoast");
        toastElement.querySelector("strong").innerText = title;
        toastElement.querySelector(".toast-body").innerText = subtitle;
        Toast.getOrCreateInstance(toastElement).show();
        exception_list = [{ title, subtitle }, ...exception_list];
    }

    function show_notification(title, subtitle) {
        console.log(`Andromeda notification:\n${title} - ${subtitle}`);
        const toastElement = document.getElementById("notificationtoast");
        toastElement.querySelector("strong").innerText = title;
        toastElement.querySelector(".toast-body").innerText = subtitle;
        Toast.getOrCreateInstance(toastElement).show();
    }

    let page_state = "loading";
    let serverlist = {};
    let statelist = {};
    let software_info = {};
    let build_info = {};
    let exception_list = [];
    let queue = [];
    let confirming_delete_server;
    let createServerModal;
    let mgsServer;
    let mgsConsole;
    let mgsConsoleFit;
    let mgsProperties = {};
    let websocket;
    let server_url;
    let hasConnected;

    let cpu_usage;
    let mem_usage;

    const url_params = new URLSearchParams(window.location.search);
    if (url_params.has("remote")) {
        server_url = url_params.get("remote");
    } else {
        server_url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}`;
    }

    function setupTooltips() {
        const tooltipTriggerList = document.querySelectorAll(
            '[data-bs-toggle="tooltip"]',
        );
        const tooltipList = [...tooltipTriggerList].map(
            (tooltipTriggerEl) => new Tooltip(tooltipTriggerEl),
        );
    }

    function startWebsocket() {
        websocket = new WebSocket(server_url + ":29836");

        websocket.onclose = () => {
            page_state = "closed";
            if (!hasConnected) {
                show_exception(
                    "Failed to connect to the server!",
                    "Connection failed",
                );
            }
            hasConnected = false;
        };
        websocket.onopen = () => {
            page_state = "login";
            hasConnected = true;
        };
        websocket.onmessage = (message) => {
            const jdata = JSON.parse(message.data);
            // console.log(jdata);
            switch (jdata.data) {
                case "welcome":
                    page_state = "server";
                    document
                        .getElementById("loginForm")
                        .classList.remove("was-validated");
                    break;

                case "serverlist":
                    serverlist = jdata.servers;
                    statelist = jdata.states;
                    queue = jdata.queue;
                    break;

                case "serverstate":
                    if (!statelist) {
                        return;
                    }
                    statelist[jdata.server] = jdata.state;
                    break;

                case "softwareinfo":
                    software_info[jdata.software] = jdata.mc_versions;
                    break;

                case "buildinfo":
                    if (!(jdata.software in build_info)) {
                        build_info[jdata.software] = {};
                    }
                    build_info[jdata.software][jdata.mc_version] = jdata.builds;
                    break;

                case "exception":
                    switch (jdata.msg) {
                        case "invalid login":
                            const login = document.getElementById("loginPass");
                            login.value = "";
                            login.setCustomValidity(
                                "Your password is incorrect!\nIf you forgot your password, reset it using the CLI tool on this server.",
                            );
                            break;

                        case "cs: java not found":
                            show_exception(
                                "Failed to install the server",
                                `Java ${jdata.java_ver} is not installed.\nPlease install it on the backend.`,
                            );
                            break;

                        case "cs: already exists":
                            show_exception(
                                "Failed to install the server",
                                "There already exists a server with the same name.",
                            );
                            break;

                        default:
                            show_exception("Unhandeled exception", jdata.msg);
                            break;
                    }
                    break;

                case "queue":
                    queue = jdata.queue;
                    break;

                case "log_history":
                    mgsConsole.write("\x1b[2J\x1b[H" + jdata.log);
                    break;

                case "console_logging":
                    mgsConsole.write(jdata.msg);
                    break;

                case "properties":
                    mgsProperties[jdata.server_name] = jdata.properties;
                    setTimeout(setupTooltips, 100);
                    break;

                case "settings":
                    serverlist[jdata.server_name] = jdata.settings;
                    break;

                case "sysstats":
                    cpu_usage = jdata.cpu;
                    mem_usage = jdata.mem;
                    break;

                default:
                    show_exception(
                        "Communication exception",
                        "Unknown data message type: " + jdata.data,
                    );
                    break;
            }
        };
    }

    function customPageAction(state) {
        switch (state) {
            case "server":
                websocket.send('{"data":"listservers"}');
        }
    }

    $: customPageAction(page_state);

    function startServer(server_name) {
        websocket.send(
            JSON.stringify({ data: "startserver", server_name: server_name }),
        );
    }

    function stopServer(server_name) {
        websocket.send(
            JSON.stringify({ data: "stopserver", server_name: server_name }),
        );
    }

    function createSoftwareChanged() {
        const software = document.getElementById("createSoftware");
        const software_val = software.value;
        const mc_version = document.getElementById("createMc");
        const build_html = document.getElementById("createBuild");
        const is_vanilla = software_val === "Vanilla";
        build_html.required = !is_vanilla;
        build_html.disabled = is_vanilla;
        mc_version.selectedIndex = 0;
        build_html.selectedIndex = 0;
        if (!(software_val in software_info)) {
            websocket.send(
                JSON.stringify({
                    data: "getsoftwaredata",
                    software: software_val,
                }),
            );
        }
    }

    function createMcChanged() {
        const software_val = document.getElementById("createSoftware").value;
        const mc_version = document.getElementById("createMc").value;
        if (!software_val) {
            return;
        }
        document.getElementById("createBuild").selectedIndex = 0;
        if (software_val in build_info) {
            if (mc_version in build_info[software_val]) {
                return;
            }
        }
        if (software_val === "Vanilla" || mc_version === "") {
            return;
        }
        websocket.send(
            JSON.stringify({
                data: "getbuilddata",
                software: software_val,
                mc_version: mc_version,
            }),
        );
    }

    function openCreateModal() {
        createServerModal = new Modal("#createServer");
        createServerModal.show();
    }

    function onSubmitCreateServer(event) {
        const form = document.getElementById("createSoftwareForm");
        event.preventDefault();
        if (!form.checkValidity()) {
            event.stopPropagation();
        } else {
            createServerModal.hide();

            const mcversion = document.getElementById("createMc").value;
            const software = document.getElementById("createSoftware").value;
            const name = document.getElementById("createName").value;
            const softwarebuild = document.getElementById("createBuild").value;
            websocket.send(
                JSON.stringify({
                    data: "installserver",
                    mcversion,
                    software,
                    name,
                    softwareversion: softwarebuild,
                }),
            );
        }

        form.classList.add("was-validated");
    }

    function onLogin(event) {
        const form = document.getElementById("loginForm");
        event.preventDefault();
        event.stopPropagation();
        const password = document.getElementById("loginPass").value;
        websocket.send(
            JSON.stringify({ data: "auth", hash: sha256(password) }),
        );

        form.classList.add("was-validated");
    }

    function deleteServer(server_name) {
        if (confirming_delete_server === server_name) {
            confirming_delete_server = undefined;
            websocket.send(
                JSON.stringify({ data: "deleteserver", name: server_name }),
            );
        } else {
            confirming_delete_server = server_name;
            show_notification(
                "Confirmation",
                "Click again to confirm the deletion",
            );
        }
    }

    function delException(index) {
        exception_list.splice(index, 1);
        exception_list = [...exception_list];
    }

    function openManageServer(server_name) {
        mgsServer = server_name;
        const modal = new Modal("#manageServer");
        modal.show();
    }

    function mgsInitTerminal() {
        if (mgsConsole) {
            return;
        }
        mgsConsole = new Terminal({
            fontFamily: "Noto Sans Mono,monospace",
            letterSpacing: 0,
        });
        mgsConsoleFit = new FitAddon();
        mgsConsole.loadAddon(mgsConsoleFit);
        mgsConsole.open(document.getElementById("mgs-terminal"));
        mgsConsoleFit.fit();
        mgsConsole.onData((data) => {
            if (statelist[mgsServer] !== "stopped") {
                websocket.send(
                    JSON.stringify({
                        data: "console_write",
                        server_name: mgsServer,
                        content: data,
                    }),
                );
            }
        });
    }

    function setProperty(index, value) {
        if (mgsProperties[mgsServer][index][1] === value) {
            return;
        }
        mgsProperties[mgsServer][index][1] = value;

        websocket.send(
            JSON.stringify({
                data: "setproperty",
                server_name: mgsServer,
                property: mgsProperties[mgsServer][index][0],
                value: value,
            }),
        );
    }

    function login() {
        if (document.getElementById("connectRemote").checked) {
            server_url = document.getElementById("connectURL").value;
        } else {
            server_url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}`;
        }

        if (/^wss?:\/{2}[^:]*$/.test(server_url)) {
            startWebsocket();
        } else {
            document.getElementById("connectError").innerText =
                "Invalid URL specified!";
        }
    }

    function installMod(id, ver_id, url, datapackMode) {
        const list = modsListToVerList(
            datapackMode
                ? serverlist[mgsServer].datapacks
                : serverlist[mgsServer].mods,
        );
        if (list[id] && list[id] == ver_id) {
            show_notification(
                "Ignored Mod Installation",
                "A mod (or a dependency of a mod) was not installed because it is already installed.",
            );
        }
        websocket.send(
            JSON.stringify({
                data: datapackMode ? "installdatapack" : "installmod",
                server_name: mgsServer,
                mod_id: id,
                mod_ver_id: ver_id,
                mod_jar: url,
            }),
        );
    }

    function uninstallMod(id, datapackMode) {
        websocket.send(
            JSON.stringify({
                data: "uninstallmod",
                server_name: mgsServer,
                mod_id: id,
                datapackMode,
            }),
        );
    }

    startWebsocket();
</script>

<main>
    <nav class="navbar navbar-expand-lg bg-body-secondary">
        <div class="container-fluid">
            <span class="navbar-brand">
                <img
                    src="/favicon.png"
                    alt="andromeda saddle logo"
                    height="24"
                    class="d-inline-block align-text-top"
                />
                Andromeda Saddle -
                {#if page_state == "closed"}
                    Disconnected
                {:else}
                    Connected with: {server_url}
                {/if}
            </span>
            <button
                class="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <div class="navbar-nav me-auto mb-2 mb-lg-0" />
                {#if page_state != "closed"}
                    <div
                        class="progress bg-secondary"
                        role="progressbar"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={cpu_usage}
                        style="width: 15rem; height: auto; cursor: default;"
                        title="{cpu_usage}%"
                    >
                        <div
                            class="progress-bar bg-warning overflow-visible text-dark"
                            style="width: {cpu_usage}%;"
                        >
                            CPU
                        </div>
                    </div>
                    <div
                        class="progress bg-secondary ms-1"
                        role="progressbar"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={mem_usage}
                        style="width: 15rem; height: auto; cursor: default;"
                        title="{mem_usage}%"
                    >
                        <div
                            class="progress-bar bg-info overflow-visible text-dark"
                            style="width: {mem_usage}%;"
                        >
                            Memory
                        </div>
                    </div>
                {/if}
                <button
                    class="btn btn-outline-secondary mx-1"
                    type="button"
                    on:click={() => (darkMode = !darkMode)}
                    title="Dark mode/Light mode"
                >
                    {#if darkMode}
                        <BrightnessHighFill />
                    {:else}
                        <MoonStarsFill />
                    {/if}
                </button>
                <button
                    class="btn btn{page_state === 'closed'
                        ? '-outline'
                        : ''}-secondary mx-1"
                    type="button"
                    on:click={() => websocket.close()}
                    disabled={page_state === "closed"}
                    title="Log out"
                >
                    <BoxArrowRight /> Log out
                </button>
                <button
                    class="btn btn{page_state === 'server'
                        ? ''
                        : '-outline'}-primary mx-1 position-relative"
                    type="button"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#queueModal"
                    aria-controls="queueModal"
                    disabled={page_state !== "server"}
                    title="Task list"
                >
                    <CardList /> Task list
                    {#if exception_list && exception_list.length}
                        <span
                            class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        >
                            {exception_list.length}
                            <span class="visually-hidden"> exceptions </span>
                        </span>
                    {:else if queue && queue.length}
                        <span
                            class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"
                        >
                            {queue.length}
                            <span class="visually-hidden">running tasks</span>
                        </span>
                    {/if}
                </button>
            </div>
        </div>
    </nav>
    {#if page_state === "loading"}
        <div
            class="position-absolute top-50 start-50 translate-middle fs-1 text-nowrap"
        >
            <div
                class="spinner-border"
                style="--bs-spinner-border-width: 0.25rem"
            />
            Connecting...
        </div>
    {:else if page_state === "login"}
        <div class="position-absolute top-50 start-50 translate-middle card">
            <form
                id="loginForm"
                class="needs-validation"
                on:submit={(event) => onLogin(event)}
                novalidate
            >
                <div class="card-body">
                    <h5 class="card-title">
                        Currently connected with: {server_url}
                    </h5>
                    <h6 class="card-subtitle">
                        To change this, log out and click remote login.
                    </h6>
                    <div class="form-floating mb-3">
                        <input
                            id="loginPass"
                            class="form-control mt-3"
                            type="password"
                            required
                        />
                        <label for="loginPass">Password</label>
                        <div class="invalid-feedback">
                            Your password is incorrect!<br />
                            If you forgot your password, reset it using the CLI tool
                            on this server.
                        </div>
                    </div>
                </div>
                <div class="card-footer text-end">
                    <button type="submit" class="btn btn-primary">Login</button>
                </div>
            </form>
        </div>
    {:else if page_state === "closed"}
        <div class="position-absolute top-50 start-50 translate-middle card">
            <div class="card-body">
                <h5 class="card-title">Connection closed</h5>
                <div class="form-check">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        value=""
                        id="connectRemote"
                        on:change={(d) => {
                            document.getElementById("connectURL").disabled =
                                !d.target.checked;
                        }}
                    />
                    <label class="form-check-label" for="connectRemote">
                        Use remote connection
                    </label>
                </div>
                <div class="input-group">
                    <input
                        type="text"
                        class="form-control"
                        id="connectURL"
                        placeholder="{location.protocol === 'https:'
                            ? 'wss'
                            : 'ws'}://{location.hostname}"
                        disabled
                    />
                    <span class="input-group-text">:29836</span>
                </div>
            </div>
            <div
                class="card-footer d-flex justify-content-end align-items-center"
            >
                <span class="text-danger" id="connectError" />
                <button
                    type="button"
                    class="btn btn-primary ms-1"
                    on:click={() => login()}>Connect</button
                >
            </div>
        </div>
    {:else if page_state === "server"}
        {#if serverlist && Object.keys(serverlist).length > 0}
            <div class="container">
                <div
                    class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4"
                >
                    {#each Object.keys(serverlist) as server (server)}
                        {@const server_settings = serverlist[server]}
                        {@const server_state = statelist[server]}
                        <div class="col">
                            <div class="card m-2" style="width: 18rem;">
                                <div class="card-header">
                                    <h6
                                        class="card-text text-{statetoclass(
                                            server_state,
                                        )}"
                                    >
                                        {capitalize(server_state)}
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <h5 class="card-title">{server}</h5>
                                    <h6
                                        class="card-subtitle mb-2 text-body-secondary"
                                    >
                                        {capitalize(server_settings.software)}
                                        {server_settings.software_version !== ""
                                            ? `(${server_settings.software_version})`
                                            : ""}
                                        {server_settings.mc_version}
                                    </h6>
                                    <p class="card-text">
                                        Java {server_settings.java_ver}
                                    </p>
                                </div>
                                <div class="card-footer">
                                    <button
                                        class="btn btn-primary"
                                        on:click={() =>
                                            openManageServer(server)}
                                    >
                                        <PencilFill />
                                        Manage
                                    </button>
                                    <StartStopButton
                                        {server_state}
                                        {server}
                                        {startServer}
                                        {stopServer}
                                    />
                                    <button
                                        class="btn btn-outline-secondary"
                                        on:click={() => deleteServer(server)}
                                    >
                                        <TrashFill />
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
        <div class="d-flex justify-content-center">
            <button
                class="btn btn-primary mx-1 d-flex align-items-center"
                data-bs-toggle="modal"
                on:click={() => openCreateModal()}
                ><Plus width="24" height="24" />Create Server</button
            >
        </div>
    {/if}

    <div
        class="modal fade"
        id="createServer"
        tabindex="-1"
        aria-labelledby="createModalLabel"
        aria-hidden="true"
        on:hidden.bs.modal={() => {
            document.getElementById("createName").value = "";
            document.getElementById("createMc").value = "";
            document.getElementById("createSoftware").value = "";
            document.getElementById("createBuild").value = "";
            document
                .getElementById("createSoftwareForm")
                .classList.remove("was-validated");
        }}
    >
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="createModalLabel">
                        Create Server
                    </h1>
                    <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                    />
                </div>
                <form
                    id="createSoftwareForm"
                    class="needs-validation"
                    on:submit={(event) => onSubmitCreateServer(event)}
                    novalidate
                >
                    <div class="modal-body">
                        <div class="form-floating mb-3">
                            <input
                                type="text"
                                class="form-control"
                                id="createName"
                                required
                            />
                            <label for="createName">Server Name</label>
                            <div class="invalid-feedback">
                                Please enter a server name.
                            </div>
                        </div>
                        <div class="form-floating mb-3">
                            <select
                                id="createSoftware"
                                class="form-select"
                                required
                                on:change={() => createSoftwareChanged()}
                            >
                                <option selected disabled></option>
                                <option>Vanilla</option>
                                <option>Paper</option>
                                <option>Fabric</option>
                                <option>Forge</option>
                            </select>
                            <label for="createSoftware">Server Software</label>
                            <div class="invalid-feedback">
                                Please select a server software.
                            </div>
                        </div>
                        <div class="form-floating mb-3">
                            <select
                                id="createMc"
                                class="form-select"
                                required
                                on:change={() => createMcChanged()}
                            >
                                <option selected disabled></option>
                                {#if software_info && document.getElementById("createSoftware") && document.getElementById("createSoftware").value in software_info}
                                    {#each software_info[document.getElementById("createSoftware").value] as version (version)}
                                        <option>{version}</option>
                                    {/each}
                                {/if}
                            </select>
                            <label for="createMc">Minecraft Version</label>
                            <div class="invalid-feedback">
                                Please select a minecraft version.
                            </div>
                        </div>
                        <div class="form-floating mb-3">
                            <select
                                id="createBuild"
                                class="form-select"
                                required
                            >
                                <option selected disabled></option>
                                {#if build_info && document.getElementById("createSoftware") && document.getElementById("createSoftware").value in build_info}
                                    {#if document.getElementById("createMc") && document.getElementById("createMc").value in build_info[document.getElementById("createSoftware").value]}
                                        {#each build_info[document.getElementById("createSoftware").value][document.getElementById("createMc").value] as version (version)}
                                            <option>{version}</option>
                                        {/each}
                                    {/if}
                                {/if}
                            </select>
                            <label for="createBuild"
                                >Server Software Version
                            </label>
                            <div class="invalid-feedback">
                                Please select a server software version.
                            </div>
                        </div>
                        <p>
                            By creating a server, you agree to the
                            <a href="https://minecraft.net/eula"
                                >Minecraft EULA</a
                            >.
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            data-bs-dismiss="modal">Cancel</button
                        >
                        <button type="submit" class="btn btn-success">
                            Create Server
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <ManageServer
        {mgsServer}
        {mgsProperties}
        {statelist}
        {serverlist}
        {startServer}
        {stopServer}
        {setProperty}
        {uninstallMod}
        {websocket}
        {mgsInitTerminal}
        {installMod}
    />
    <Mods {serverlist} {mgsServer} {installMod} />
    <Toasts />
    <Queue {exception_list} {delException} {queue} />
</main>

<style>
    @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100..900&display=swap");

    :global(.xterm-rows) {
        letter-spacing: 0 !important;
    }
</style>
