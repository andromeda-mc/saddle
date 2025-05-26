<script lang="ts">
	import { page } from "$app/state";
	import { con } from "$lib/client.svelte";
	import ModList, { type ActionVersion } from "$lib/components/ModList.svelte";
	import { Button, Container, Icon, Spinner } from "@sveltestrap/sveltestrap";
	import { ProjectsService } from "modrinthjs";

	const { server } = page.params;
</script>

{#snippet updateUninstall(versions: ActionVersion, p_id: string)}
	{@const installedVer = Object.fromEntries(con.state.servers[server].mods)[p_id]}
	<Button color="danger" class="mb-2 ml-2" size="sm">
		<Icon name="trash-fill" />
		Uninstall
	</Button>

	<br />
	{#await versions}
		<span>
			<Spinner size="sm" />
			Searching for updates...
		</span>
	{:then data}
		{#if data.length > 0}
			{#if installedVer === data[0].id}
				<span>Up to date!</span>
			{:else}
				<Button color="success" size="sm">
					<Icon name="gear" />
					Update to {data[0].version_number}
				</Button>
			{/if}
		{:else}
			<span class="text-danger font-medium">No suitable version found!</span>
		{/if}
	{:catch}
		<span class="text-danger"> Failed to search for updates! </span>
	{/await}
{/snippet}

<Container>
	<h1 class="text-lg text-center">Installed Datapacks</h1>
	<ModList
		listPromise={ProjectsService.getProjects(JSON.stringify(con.state.servers[server].datapacks.map((s) => s[0])))}
		isDatapack={true}
		actionSnippet={updateUninstall}
	/>
</Container>
