<script lang="ts">
	import { con } from "$lib/client.svelte";
	import ServerStartStopButton from "$lib/components/ServerStartStopButton.svelte";
	import { assembleBasePath, assembleWSPath, capitalize } from "$lib/util";
	import {
		Card,
		CardBody,
		CardHeader,
		Container,
		Row,
		Col,
		CardTitle,
		CardText,
		CardSubtitle,
		CardFooter,
		Button,
		Icon,
	} from "@sveltestrap/sveltestrap";
	import CreateServer from "./CreateServer.svelte";
	import { page } from "$app/state";

	const {protocol, ip} = page.params;

	let deletionServer: string | undefined = $state();

	function deleteServer(name: string): void {
		if (deletionServer === name) {
			con.runJob("deleteServer", name);
			deletionServer = undefined;
		} else {
			deletionServer = name;
		}
	}

	let isOpen = $state(false);
</script>

<svelte:head>
	<title>Server list - {assembleWSPath(protocol, ip)} - Andromeda Saddle</title>
</svelte:head>

<Container>
	<h1 class="text-lg text-center">Your Servers</h1>
	{#if Object.keys(con.state.servers).length > 0}
		<Row class="gap-0.5 justify-center">
			{#each Object.entries(con.state.servers) as [name, data] ([name, data])}
				<Col class="flex justify-center p-2">
					<Card class="w-72!">
						<CardHeader>
							<CardTitle>{name}</CardTitle>
						</CardHeader>
						<CardBody>
							<CardSubtitle>Minecraft {data.mc_version}</CardSubtitle>
							<CardText
								>{capitalize(data.software)}
								{data.software_version !== "" ? `(${data.software_version})` : ""}</CardText
							>
							<CardText>Java {data.java_ver}</CardText>
						</CardBody>
						<CardFooter>
							<Button color="primary" href={assembleBasePath(con.websocket!.url) + name}>
								<Icon name="pencil-fill" />
								Edit
							</Button>
							<ServerStartStopButton serverName={name} />
							<Button
								outline={deletionServer !== name}
								color={deletionServer === name ? "danger" : "secondary"}
								onclick={() => {
									deleteServer(name);
								}}
							>
								<Icon name="trash-fill" />
							</Button>
						</CardFooter>
					</Card>
				</Col>
			{/each}
		</Row>
	{:else}
		<p class="text-center text-2xl">You have no servers created.</p>
		<p class="text-center">Create a server with the button below!</p>
	{/if}
	<div class="flex justify-center mt-2">
		<Button
			color="primary"
			onclick={() => {
				isOpen = true;
			}}
		>
			<Icon name="plus" />
			Create server
		</Button>
	</div>
</Container>

<CreateServer bind:isOpen={isOpen} />
