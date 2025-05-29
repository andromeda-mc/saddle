<script lang="ts">
	import { page } from "$app/state";
	import { con } from "$lib/client.svelte";
	import { assembleWSPath, capitalize } from "$lib/util";
	import { type ITerminalInitOnlyOptions, type ITerminalOptions, Xterm, XtermAddon } from "@battlefieldduck/xterm-svelte";
	import { CardFooter, CardHeader, Card, CardBody, CardTitle, CardText, CardSubtitle, Button, Icon } from "@sveltestrap/sveltestrap";
	import { onDestroy } from "svelte";
	const { server, protocol, ip } = page.params;

	let serverState = $derived(con.state.states[server]);

	// Console
	const options: ITerminalOptions & ITerminalInitOnlyOptions = {
		fontFamily: "Noto Sans Mono,monospace",
	};

	async function onLoad() {
		const fitAddon = new (await XtermAddon.FitAddon()).FitAddon();
		con.state.terminals[server]!.loadAddon(fitAddon);
		fitAddon.fit();
	}

	function onData(data: string) {
		if (serverState === "stopped") return;
		con.runJob("writeConsole", server, data);
	}

	$effect(() => {
		if (con.state.terminals[server] === undefined) return;

		con.runJob("subscribeLogging", server).then((d) => {
			con.state.terminals[server].write(d.log);
		});
	});

	onDestroy(() => {
		con.runJob("unsubscribeLogging");
	});
</script>

<svelte:head>
	<title>{server} - {assembleWSPath(protocol, ip)} - Andromeda Saddle</title>
</svelte:head>

{#if con.state.authed}
	{@const data = con.state.servers[server]}
	<Card class="mx-4">
		<CardHeader>
			<CardTitle>Overview</CardTitle>
		</CardHeader>
		<CardBody>
			<CardSubtitle>Minecraft {data.mc_version}</CardSubtitle>
			<CardText
				>{capitalize(data.software)}
				{data.software_version !== "" ? `(${data.software_version})` : ""}</CardText
			>
			<CardText>Java {data.java_ver}</CardText>
			{#if data.software !== "Vanilla"}
				<CardText
					>{data.mods.length}
					{data.software === "Paper" ? "Plugin" : "Mod"}{data.mods.length === 1 ? "" : "s"}</CardText
				>
			{/if}
			<CardText>{data.datapacks.length} Datapack{data.datapacks.length === 1 ? "" : "s"}</CardText>
		</CardBody>

		<!-- Console -->
		<CardHeader>
			<CardTitle>Console</CardTitle>
		</CardHeader>
		<CardBody>
			<Xterm bind:terminal={con.state.terminals[server]} {onLoad} {onData} {options} class="mb-1" />
		</CardBody>
		<CardFooter>
			<Button
				color="secondary"
				outline
				onclick={() => {
					onData("\t");
				}}
				disabled={serverState === "stopped"}
			>
				<Icon name="indent" />
				Tab
			</Button>
		</CardFooter>
	</Card>
{/if}
