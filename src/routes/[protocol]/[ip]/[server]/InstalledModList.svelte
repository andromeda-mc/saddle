<script lang="ts">
	import { page } from "$app/state";
	import { con } from "$lib/client.svelte";
	import ModList, { type ActionVersion } from "$lib/components/ModList.svelte";
	import { Button, Container, Icon, Spinner } from "@sveltestrap/sveltestrap";
	import { ProjectsService, type Version } from "modrinthjs";
	import ModManager from "./ModManager.svelte";
	import { installMod } from "$lib/mods";
	import { assembleWSPath } from "$lib/util";

	let isOpen: boolean = $state(false);

	const { server, protocol, ip } = page.params;
	const { isDatapack }: { isDatapack: boolean } = $props();

	const toggle = () => {
		isOpen = !isOpen;
	};

	function updateMod(p_id: string, version: Version) {
		con.runJob(isDatapack ? "uninstallDatapack" : "uninstallMod", server, p_id);
		installMod(server, p_id, version, isDatapack);
	}
</script>

<svelte:head>
	<title>{isDatapack ? "Datapacks" : "Mods"} - {server} - {assembleWSPath(protocol, ip)} - Andromeda Saddle</title>
</svelte:head>

{#snippet updateUninstall(versions: ActionVersion, p_id: string, installed: Record<string, string>)}
	<Button
		color="danger"
		class="mb-2 ml-2"
		size="sm"
		onclick={() => {
			con.runJob(isDatapack ? "uninstallDatapack" : "uninstallMod", server, p_id);
		}}
	>
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
			{#if installed[p_id] === data[0].id}
				<span>Up to date!</span>
			{:else}
				<Button color="success" size="sm" onclick={() => updateMod(p_id, data[0])}>
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
	<h1 class="text-lg text-center">
		Installed {isDatapack ? "Datapack" : con.state.servers[server].software === "Paper" ? "Plugin" : "Mod"}s
		<Button color="primary" onclick={toggle}>
			<Icon name="plus" />
			Install more...
		</Button>
	</h1>
	<ModList
		listPromise={ProjectsService.getProjects(JSON.stringify(con.state.servers[server][isDatapack ? "datapacks" : "mods"].map((s) => s[0])))}
		{isDatapack}
		actionSnippet={updateUninstall}
	/>
</Container>

<ModManager {isDatapack} {isOpen} {toggle} />
