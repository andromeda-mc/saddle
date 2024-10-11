<script>
    import "bootstrap/dist/css/bootstrap.min.css";
    import "bootstrap/dist/js/bootstrap.js";
    import { sha256 } from "barely-sha256";
    import { MoonStarsFill, BrightnessHighFill } from "svelte-bootstrap-icons";
    import { onMount } from "svelte";

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
            case "exception":
                switch (jdata.msg) {
                    case "invalid login":
                        document.getElementById("pass_input").value = "";
                        document.getElementById("pass_text").innerText =
                            "Your password is incorrect!\nIf you forgot your password, reset it using the CLI tool on this server.";
                }
        }
    };
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
</script>

<main>
    <nav class="navbar navbar-expand-lg bg-body-secondary">
        <div class="container-fluid">
            <a class="navbar-brand">Andromeda Saddle</a>
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
                        <a class="nav-link active" aria-current="page" href="#"
                            >Settings</a
                        >
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
                class="form-control"
                type="password"
                placeholder="Enter your password here"
                aria-label="password input"
                on:keydown={passEntered}
            />
            <div id="pass_text" class="form-text text-danger" />
        </div>
    {/if}
</main>

<style>
</style>
