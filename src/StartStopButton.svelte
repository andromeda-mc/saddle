<script>
    import { PlayFill, StopFill } from "svelte-bootstrap-icons";
    function capitalize(string) {
        if (!string) {
            return;
        }
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    export let server_state, server, startServer, stopServer;
</script>

{#if server_state == "stopped"}
    <button class="btn btn-success" on:click={() => startServer(server)}>
        <PlayFill />
        Start
    </button>
{:else if server_state == "running"}
    <button class="btn btn-danger" on:click={() => stopServer(server)}>
        <StopFill />
        Stop
    </button>
{:else}
    <span class="btn btn-secondary disabled" disabled>
        <span class="spinner-border spinner-border-sm" aria-hidden="true"
        ></span>
        {capitalize(server_state)}...
    </span>
{/if}
