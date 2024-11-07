<script>
    import { ExclamationTriangleFill } from "svelte-bootstrap-icons";
    import StartStopButton from "./StartStopButton.svelte";
    export let mgsServer;
    export let mgsProperties;
    export let statelist;
    export let startServer;
    export let stopServer;
    export let setProperty;
</script>

<div
    class="modal fade"
    id="manageServer"
    tabindex="-1"
    aria-labelledby="manageServerLabel"
    aria-hidden="true"
    data-bs-backdrop="static"
>
    <div class="modal-dialog modal-fullscreen">
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
                    data-bs-smooth-scroll="true"
                    style="max-height: 80vh;"
                >
                    <div id="mgsConsole">
                        <h4>Console</h4>
                        <div id="mgs-terminal" />
                    </div>
                    <div id="mgsSettings">
                        <h4>Settings</h4>
                        <div
                            class="alert alert-warning d-flex align-items-center"
                            role="alert"
                        >
                            <ExclamationTriangleFill />
                            <div class="ms-1">
                                Changing a setting requires a server restart!
                            </div>
                        </div>
                        {#if mgsProperties[mgsServer] && mgsProperties[mgsServer].length}
                            {#if !mgsProperties[mgsServer][0][1]}
                                <div class="alert alert-info" role="alert">
                                    This is a empty template. Starting the
                                    server will fill in the default values.<br
                                    />
                                    This <em>should</em> be only temporary.
                                </div>
                            {/if}
                            <table
                                class="table table-striped table-bordered table-responsive"
                            >
                                <tbody>
                                    {#each mgsProperties[mgsServer] as property, i}
                                        {@const type = property[2][1]}
                                        <tr class="align-middle">
                                            <td
                                                >{property[2][0]}
                                                <a
                                                    class="fw-light fst-italic link-info"
                                                    href="https://minecraft.wiki/w/Server.properties#{property[0]}"
                                                    target="_blank"
                                                >
                                                    (Wiki entry)
                                                </a>
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
                                                        value={property[1]}
                                                    />
                                                {:else if type == "integer" || type == "integer_range"}
                                                    <input
                                                        class="form-control"
                                                        type="number"
                                                        min={type == "integer"
                                                            ? "0"
                                                            : property[2][2]}
                                                        max={type == "integer"
                                                            ? "10000"
                                                            : property[2][3]}
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
                                                    >
                                                        {#each Object.entries(property[2][2]) as option}
                                                            <option
                                                                value={option[0]}
                                                                selected={property[1] ==
                                                                    option[0]}
                                                                on:change={(
                                                                    d,
                                                                ) =>
                                                                    setProperty(
                                                                        i,
                                                                        d.target
                                                                            .value,
                                                                    )}
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

<style>
    .form-switch .form-check-input {
        margin-left: 0;
    }

    .form-switch {
        padding-left: 0;
    }
</style>
