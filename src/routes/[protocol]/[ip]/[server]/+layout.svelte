<script lang="ts">
	import { page } from "$app/state";
	import { con } from "$lib/client.svelte";
	import ServerStartStopButton from "$lib/components/ServerStartStopButton.svelte";
	import { assembleBasePath } from "$lib/util";
	import { Collapse, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from "@sveltestrap/sveltestrap";

	const { server } = page.params;
	const { children } = $props();
	const basePath = assembleBasePath(con.websocket!.url) + server;

	let isOpen = $state(true);

	function handleUpdate(event: any) {
		isOpen = event.detail.isOpen;
	}
</script>

{#if con.state.authed}
	<Navbar color="secondary-subtle" expand="lg" container="md" class="mb-2! border-t-2 border-(--bs-light-border-subtle)">
		<NavbarBrand href={basePath}>Server: {server}</NavbarBrand>
		<NavbarToggler on:click={() => (isOpen = !isOpen)} aria-label="Open or collapse navbar" />
		<Collapse {isOpen} navbar expand="md" on:update={handleUpdate}>
			<Nav class="ms-auto items-center" navbar>
				<NavItem><NavLink href={basePath}>Console & Overview</NavLink></NavItem>
				<NavItem><NavLink href={basePath + "/settings"}>Settings</NavLink></NavItem>
				{#if con.state.servers[server].software !== "Vanilla"}
					<NavItem
						><NavLink href={basePath + "/mods"}>{con.state.servers[server].software === "Paper" ? "Plugins" : "Mods"}</NavLink></NavItem
					>
				{/if}
				<NavItem><NavLink href={basePath + "/datapacks"}>Datapacks</NavLink></NavItem>
				<NavItem><ServerStartStopButton serverName={server} /></NavItem>
			</Nav>
		</Collapse>
	</Navbar>

	<main>
		{@render children()}
	</main>
{/if}
