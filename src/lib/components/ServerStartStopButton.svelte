<script lang="ts">
	import { con } from "$lib/client.svelte";
	import { capitalize } from "$lib/util";
	import { Button, Icon, Spinner } from "@sveltestrap/sveltestrap";

	const { serverName }: { serverName: string } = $props();
	let state = $derived(con.state.states[serverName]);
</script>

{#if state === "stopped"}
	<Button
		color="success"
		onclick={() => {
			con.runJob("startServer", serverName);
		}}
	>
		<Icon name="play-fill" />
		Start
	</Button>
{:else if state === "running"}
	<Button
		color="danger"
		onclick={() => {
			con.runJob("stopServer", serverName);
		}}
	>
		<Icon name="stop-fill" />
		Stop
	</Button>
{:else}
	<Button color="secondary" disabled>
		<Spinner type="border" size="sm" />
		{capitalize(state)}...
	</Button>
{/if}
