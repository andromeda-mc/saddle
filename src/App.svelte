<script>
    import "bootstrap/dist/css/bootstrap.min.css";
    import "bootstrap/dist/js/bootstrap.js";
    import { sha256 } from "barely-sha256";
    import { MoonStarsFill, BrightnessHighFill } from "svelte-bootstrap-icons";
    import { onMount } from "svelte";

    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
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

    let page_state = "loading";
    const websocket = new WebSocket(
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:29836`,
    );

    let serverlist = {};
    let statelist = {};
    let software_info = {};
    let build_info = {};

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

            case "serverlist":
                serverlist = jdata.servers;
                statelist = jdata.states;
                console.log(serverlist);
                console.log(statelist);

            case "serverstate":
                if (!statelist) {
                    return;
                }
                statelist[jdata.server] = jdata.state;

            case "softwareinfo":
                software_info[jdata.software] = jdata.mc_versions;

            case "buildinfo":
                if (!(jdata.software in build_info)) {
                    build_info[jdata.software] = {};
                }
                build_info[jdata.software][jdata.mc_version] = jdata.builds;

            case "exception":
                switch (jdata.msg) {
                    case "invalid login":
                        document.getElementById("pass_input").value = "";
                        document.getElementById("pass_text").innerText =
                            "Your password is incorrect!\nIf you forgot your password, reset it using the CLI tool on this server.";
                }
        }
    };

    function customPageAction(state) {
        switch (state) {
            case "server":
                websocket.send('{"data": "listservers"}');
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
        const software_val = document.getElementById("createSoftware").value;
        const build_html = document.getElementById("createBuild");
        const is_vanilla = software_val == "Vanilla";
        build_html.required = !is_vanilla;
        build_html.disabled = is_vanilla;
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
        if (software_val in build_info) {
            if (mc_version in build_info[software_val]) {
                return;
            }
        }
        if (software_val == "Vanilla") {
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
                    class="btn btn-outline-secondary"
                    type="button"
                    on:click={() => (darkMode = !darkMode)}
                >
                    {#if darkMode}
                        <BrightnessHighFill />
                    {:else}
                        <MoonStarsFill />
                    {/if}
                </button>
            </div>
        </div>
    </nav>
    {#if page_state == "loading"}
        <div class="position-absolute top-50 start-50 translate-middle fs-1">
            Please wait...
        </div>
    {:else if page_state == "error"}
        <div class="position-absolute top-50 start-50 translate-middle fs-1">
            Failed to connect to server!
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
                            <div class="card m-2" style="width: 15rem;">
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
                                    <button class="btn btn-primary">
                                        Edit
                                    </button>
                                    {#if server_state == "stopped"}
                                        <button
                                            class="btn btn-outline-success"
                                            on:click={() => startServer(server)}
                                        >
                                            Start
                                        </button>
                                    {:else if server_state == "running"}
                                        <button
                                            class="btn btn-outline-danger"
                                            on:click={() => stopServer(server)}
                                        >
                                            Stop
                                        </button>
                                    {:else}
                                        <span
                                            class="btn btn-outline-secondary disabled"
                                            disabled
                                            >{capitalize(server_state)}...
                                        </span>
                                    {/if}
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
                data-bs-target="#createServer">Create server</button
            >
            <button class="btn btn-outline-danger mx-1">Delete server</button>
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
                <form class="modal-body" id="createSoftwareForm">
                    <div class="form-floating mb-3">
                        <input
                            type="text"
                            class="form-control"
                            id="createName"
                            required
                        />
                        <label for="createName">Server Name</label>
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
                    </div>
                    <div class="form-floating mb-3">
                        <select id="createBuild" class="form-select" required>
                            <option selected disabled></option>
                            {#if build_info && document.getElementById("createSoftware") && document.getElementById("createSoftware").value in build_info}
                                {#if document.getElementById("createMc") && document.getElementById("createMc").value in build_info[document.getElementById("createSoftware").value]}
                                    {#each build_info[document.getElementById("createSoftware").value][document.getElementById("createMc").value] as version (version)}
                                        <option>{version}</option>
                                    {/each}
                                {/if}
                            {/if}
                        </select>
                        <label for="createBuild">Server Software Version</label>
                    </div>
                </form>
                <div class="modal-footer">
                    <button
                        type="button"
                        class="btn btn-secondary"
                        data-bs-dismiss="modal">Cancel</button
                    >
                    <button
                        type="button"
                        class="btn btn-success"
                        on:click={() =>
                            document
                                .getElementById("createSoftwareForm")
                                .submit()}>Create server</button
                    >
                </div>
            </div>
        </div>
    </div>
</main>

<style>
</style>
