<script>
    import StartStopButton from "./StartStopButton.svelte";
    export let mgsServer;
    export let mgsInitTerminal;
    export let statelist;
    export let startServer;
    export let stopServer;
</script>

<div
    class="modal fade modal-xl"
    id="manageServer"
    tabindex="-1"
    aria-labelledby="manageServerLabel"
    aria-hidden="true"
    data-bs-backdrop="static"
>
    <div class="modal-dialog">
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
                        <a class="nav-link text-body" href="#mgsConsole">
                            Console
                        </a>
                        <a class="nav-link text-body" href="#mgsSettings">
                            Settings
                        </a>
                        <a class="nav-link text-body" href="#mgsPlayers">
                            Players
                        </a>
                        <a class="nav-link text-body" href="#mgsFiles">
                            Files
                        </a>
                        <a class="nav-link text-body" href="#mgsWorld">
                            World
                        </a>
                        <a class="nav-link text-body" href="#mgsGuest">
                            Guest Access
                        </a>
                    </nav>
                </nav>
                <div
                    id="mgsBody"
                    class="overflow-auto p-3"
                    style="height: 50vh;"
                    data-bs-smooth-scroll="true"
                >
                    <div id="mgsConsole">
                        <h4>Console</h4>
                        <div id="mgs-terminal" on:load={mgsInitTerminal()} />
                    </div>
                    <div id="mgsSettings">
                        <h4>Settings</h4>
                    </div>
                    <div id="mgsPlayers">
                        <h4>Players</h4>
                    </div>
                    <div id="mgsFiles">
                        <h4>Files</h4>
                    </div>
                    <div id="mgsWorld">
                        <h4>World</h4>
                    </div>
                    <div id="mgsGuest">
                        <h4>Guest Access</h4>
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
                        class="btn btn-primary"
                        data-bs-dismiss="modal">Close</button
                    >
                </div>
            </div>
        </div>
    </div>
</div>
