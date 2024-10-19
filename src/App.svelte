<script>
    import "bootstrap/dist/css/bootstrap.min.css";
    import { Toast, Modal } from "bootstrap/dist/js/bootstrap.js";
    import { sha256 } from "barely-sha256";
    import {
        MoonStarsFill,
        BrightnessHighFill,
        XCircleFill,
        CardList,
        TrashFill,
        PencilFill,
        PlayFill,
        StopFill,
    } from "svelte-bootstrap-icons";
    import { onMount } from "svelte";

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

    let darkMode = localStorage.getItem("darkMode") != "false";
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
        exception_list.push({ title, subtitle });
        exception_list = [...exception_list];
    }

    let page_state = "loading";
    const websocket = new WebSocket(
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:29836`,
    );

    let serverlist = {};
    let statelist = {};
    let software_info = {};
    let build_info = {};
    let exception_list = [];
    let queue = [];
    let confirming_delete_server;
    let createSoftwareModal;

    websocket.onerror = () => {
        page_state = "error";
    };
    websocket.onclose = () => {
        page_state = "error";
    };
    websocket.onopen = () => {
        page_state = "login";
    };
    websocket.onmessage = (message) => {
        const jdata = JSON.parse(message.data);
        console.log(jdata);
        switch (jdata.data) {
            case "welcome":
                page_state = "server";
                break;

            case "serverlist":
                serverlist = jdata.servers;
                statelist = jdata.states;
                queue = jdata.queue;
                console.log(serverlist);
                console.log(statelist);
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
                        document.getElementById("pass_input").value = "";
                        document.getElementById("pass_text").innerText =
                            "Your password is incorrect!\nIf you forgot your password, reset it using the CLI tool on this server.";
                        break;

                    case "cs: java not found":
                        show_exception(
                            "Failed to install the server",
                            `Java ${jdata.java_ver} is not installed.\nPlease install it on the backend.`,
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

            default:
                show_exception(
                    "Communication exception",
                    "Unknown data message type: " + jdata.data,
                );
                break;
        }
    };

    function customPageAction(state) {
        switch (state) {
            case "server":
                websocket.send('{"data": "listservers"}');
                document
                    .getElementById("createServer")
                    .addEventListener("hidden.bs.modal", () => {
                        document.getElementById("createName").value = "";
                        document.getElementById("createMc").value = "";
                        document.getElementById("createSoftware").value = "";
                        document.getElementById("createBuild").value = "";
                        document
                            .getElementById("createSoftwareForm")
                            .classList.remove("was-validated");
                    });
        }
    }

    $: customPageAction(page_state);

    function passEntered(d) {
        if (d.key == "Enter") {
            websocket.send(
                JSON.stringify({
                    data: "auth",
                    hash: sha256(document.getElementById("pass_input").value),
                }),
            );
        }
    }

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
        const is_vanilla = software_val == "Vanilla";
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
        if (software_val == "Vanilla" || mc_version == "") {
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
        createSoftwareModal = new Modal("#createServer");
        createSoftwareModal.show();
    }

    function onSubmitCreateServer(event) {
        const form = document.getElementById("createSoftwareForm");
        event.preventDefault();
        if (!form.checkValidity()) {
            event.stopPropagation();
        } else {
            createSoftwareModal.hide();

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

    function deleteServer(server_name) {
        if (confirming_delete_server == server_name) {
            confirming_delete_server = undefined;
            websocket.send(
                JSON.stringify({ data: "deleteserver", name: server_name }),
            );
        } else {
            confirming_delete_server = server_name;
            show_exception(
                "Confirmation",
                "Click again to confirm the deletion",
            );
        }
    }

    function delException(index) {
        exception_list.splice(index, 1);
        exception_list = [...exception_list];
    }
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
                Andromeda Saddle
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
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    <li class="nav-item">
                        <a class="nav-link active" aria current="page" href="#">
                            Servers
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" aria-current="page" href="#">
                            Settings
                        </a>
                    </li>
                </ul>
                <button
                    class="btn btn-outline-secondary mx-1"
                    type="button"
                    on:click={() => (darkMode = !darkMode)}
                >
                    {#if darkMode}
                        <BrightnessHighFill />
                    {:else}
                        <MoonStarsFill />
                    {/if}
                </button>
                <button
                    class="btn btn{page_state == 'server'
                        ? ''
                        : '-outline'}-primary mx-1 position-relative"
                    type="button"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#queueModal"
                    aria-controls="queueModal"
                    disabled={page_state != "server"}
                >
                    <CardList />
                    {#if queue || exception_list}
                        {#if exception_list.length}
                            <span
                                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                            >
                                {exception_list.length}
                                <span class="visually-hidden">
                                    exceptions
                                </span>
                            </span>
                        {:else if queue.length}
                            <span
                                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"
                            >
                                {queue.length}
                                <span class="visually-hidden"
                                    >running tasks</span
                                >
                            </span>
                        {/if}
                    {/if}
                </button>
            </div>
        </div>
    </nav>
    {#if page_state == "loading"}
        <div
            class="position-absolute top-50 start-50 translate-middle fs-1 text-nowrap"
        >
            <div
                class="spinner-border"
                style="--bs-spinner-border-width: 0.25rem"
            />
            Connecting...
        </div>
    {:else if page_state == "error"}
        <div
            class="position-absolute top-50 start-50 translate-middle fs-1 text-center"
        >
            Failed to connect to the backend server!
        </div>
    {:else if page_state == "login"}
        <div class="position-absolute top-50 start-50 translate-middle">
            <input
                id="pass_input"
                class="form-control px-2"
                type="password"
                placeholder="Enter your password here"
                aria-label="password input"
                on:keydown={passEntered}
            />
            <div id="pass_text" class="form-text text-danger" />
        </div>
    {:else if page_state == "server"}
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
                                        {server_settings.software_version != ""
                                            ? `(${server_settings.software_version})`
                                            : ""}
                                        {server_settings.mc_version}
                                    </h6>
                                    <p class="card-text">
                                        Java {server_settings.java_ver}
                                    </p>
                                </div>
                                <div class="card-footer">
                                    <button class="btn btn-primary">
                                        <PencilFill />
                                        Edit
                                    </button>
                                    {#if server_state == "stopped"}
                                        <button
                                            class="btn btn-success"
                                            on:click={() => startServer(server)}
                                        >
                                            <PlayFill />
                                            Start
                                        </button>
                                    {:else if server_state == "running"}
                                        <button
                                            class="btn btn-danger"
                                            on:click={() => stopServer(server)}
                                        >
                                            <StopFill />
                                            Stop
                                        </button>
                                    {:else}
                                        <span
                                            class="btn btn-secondary disabled"
                                            disabled
                                        >
                                            <span
                                                class="spinner-border spinner-border-sm"
                                                aria-hidden="true"
                                            ></span>
                                            {capitalize(server_state)}...
                                        </span>
                                    {/if}
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
        {:else}
            <div class="translate-middle">Here are no servers. Create one!</div>
        {/if}
        <div class="d-flex justify-content-center">
            <button
                class="btn btn-primary mx-1"
                data-bs-toggle="modal"
                on:click={() => openCreateModal()}>Create server</button
            >
        </div>
    {/if}

    <div
        class="modal fade"
        id="createServer"
        tabindex="-1"
        aria-labelledby="createModalLabel"
        aria-hidden="true"
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
                    ></button>
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
                    </div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            data-bs-dismiss="modal">Cancel</button
                        >
                        <button type="submit" class="btn btn-success">
                            Create server
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="toast-container p-3 bottom-0 end-0">
        <div
            class="toast"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            id="warningtoast"
        >
            <div class="toast-header">
                <XCircleFill class="text-danger" />
                <strong class="me-auto ms-1" />
                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="toast"
                    aria-label="Close"
                />
            </div>
            <div class="toast-body" />
        </div>
    </div>

    <div class="offcanvas offcanvas-end" tabindex="-1" id="queueModal">
        <div class="offcanvas-header">
            <h5 class="offcanvas-title">Task queue</h5>
            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
            />
        </div>
        <div class="offcanvas-body">
            {#if exception_list}
                {#if exception_list.length}
                    {#each exception_list as exceptionItem, index}
                        <div class="card border-danger mb-3">
                            <div class="card-header d-flex">
                                Exception
                                <button
                                    type="button"
                                    class="btn-close ms-auto"
                                    aria-label="Dismiss"
                                    on:click={() => delException(index)}
                                />
                            </div>
                            <div class="card-body">
                                <h5>{exceptionItem.title}</h5>
                                <h6 class="card-subtitle mb-2">
                                    {exceptionItem.subtitle}
                                </h6>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <p>No exceptions have occurred.</p>
                {/if}
            {/if}
            <hr />
            {#if queue}
                {#if queue.length}
                    {#each queue as queueItem}
                        {@const title = queueItem.split(":", 1)[0]}
                        <div class="card">
                            <div class="card-body">
                                <h5>{title}</h5>
                                <h6
                                    class="card-subtitle mb-2 text-body-secondary"
                                >
                                    {queueItem.replace(title + ": ", "")}
                                </h6>
                                <div class="progress" role="progressbar">
                                    <div
                                        class="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                                        style="width: 100%"
                                    />
                                </div>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <p>No tasks are running.</p>
                {/if}
            {/if}
        </div>
    </div>
</main>

<style>
</style>
