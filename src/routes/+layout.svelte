<script lang="ts">
	import { con } from "$lib/client.svelte";
	import { goto } from "$app/navigation";

	import "../app.css";
	import "/node_modules/bootstrap/dist/css/bootstrap.min.css";
	import "/node_modules/bootstrap-icons/font/bootstrap-icons.min.css";

	import {
		Button,
		Collapse,
		Nav,
		Navbar,
		NavbarBrand,
		NavbarToggler,
		ThemeToggler,
		Icon,
		colorMode,
		NavItem,
		NavLink,
		Progress,
		Offcanvas,
		Card,
		CardTitle,
		CardSubtitle,
		Badge,
		CardText,
	} from "@sveltestrap/sveltestrap";
	import { assembleBasePath } from "$lib/util";
	import { page } from "$app/state";
	import { onMount } from "svelte";

	const { children } = $props();

	function check() {
		if (page.status !== 200) return;

		// Goto connect page, when not connected
		if (!page.route.id?.startsWith("/[protocol]/[ip]") && !con.isConnected) return goto("/");

		if (con.isConnected && !con.state.authed) return goto(assembleBasePath(con.websocket!.url) + "login");
	}

	let isOpen = $state(true);
	let isQueueOpen = $state(false);
	const toggle = () => {
		isQueueOpen = !isQueueOpen;
	};

	function handleUpdate(event: any) {
		isOpen = event.detail.isOpen;
	}

	onMount(() => {
		$colorMode = localStorage.getItem("theme") ?? "dark";

		// Register effect after reading theme from local storage
		$effect(() => {
			localStorage.setItem("theme", $colorMode);
			console.log("Stored color mode");
		});
	});

	check();
</script>

<Navbar color="secondary-subtle" expand="xl" container="md" class="mb-2!">
	<NavbarBrand class="flex items-end gap-1.5">
		<img src="/favicon.png" alt="Andromeda Saddle logo" height="32" width="32"/>
		Andromeda Saddle²
		<span class="text-lg">{page.route.id?.includes("[ip]") && con.isConnected ? " - " + con.websocket!.url : ""} </span></NavbarBrand
	>
	<NavbarToggler on:click={() => (isOpen = !isOpen)} aria-label="Open or collapse navbar"/>
	<Collapse {isOpen} navbar expand="md" on:update={handleUpdate}>
		<Nav class="ms-auto items-center" navbar>
			<NavItem>
				<NavLink href="/">Connect to {page.route.id?.includes("[ip]") ? "other server" : "server"}</NavLink>
			</NavItem>
			{#if page.route.id?.includes("[ip]") && con.state.authed}
				<NavLink href="/{page.params.protocol}/{page.params.ip}/">Serverlist</NavLink>
				<NavItem>
					<Progress class="w-2xs m-1" color="info" value={con.state.cpu_percent} title="CPU Usage: {con.state.cpu_percent}%">CPU</Progress>
					<Progress class="w-2xs m-1" color="success" value={con.state.memory_percent} title="Memory Usage: {con.state.memory_percent}%"
						>Mem</Progress
					>
				</NavItem>
			{/if}

			<NavItem>
				{/* @ts-expect-error */ null}
				<ThemeToggler let:currentColorMode let:toggleColorMode>
					<Button onclick={() => toggleColorMode()} outline color="secondary" aria-label="Toggle between light and dark mode">
						{#if currentColorMode === "dark"}
							<Icon name="moon-stars" />
						{:else}
							<Icon name="brightness-high" />
						{/if}
					</Button>
				</ThemeToggler>
			</NavItem>

			<NavItem>
				<Button color="primary" class="ml-1.5! relative" disabled={!con.state.authed} onclick={toggle}>
					<Icon name="card-list" />
					Pending tasks
					{#if con.state.queue.length > 0}
						<Badge pill positioned ariaLabel="Pending taksks">{con.state.queue.length}</Badge>
					{/if}
				</Button>
			</NavItem>
		</Nav>
	</Collapse>
</Navbar>

<main>
	{@render children()}

	<Offcanvas isOpen={isQueueOpen} {toggle} header="Pending tasks" placement="end" scroll>
		{#if con.isConnected && con.state.authed}
			{#if con.state.queue.length > 0}
				{#each con.state.queue as entry (entry)}
					{@const titles = entry.split(":", 2)}
					<Card body>
						<CardTitle>{titles[0]}</CardTitle>
						<CardSubtitle>{titles[1]}</CardSubtitle>
						<Progress animated color="primary" value="100" />
					</Card>
				{/each}
			{:else}
				<CardText>No tasks are pending.</CardText>
			{/if}
		{:else}
			You need to be logged in to do that.
		{/if}
	</Offcanvas>
</main>
