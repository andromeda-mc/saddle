<script lang="ts">
	import type { Snippet } from "svelte";
	import { page } from "$app/state";
	import { con } from "$lib/client.svelte";
	import {
		Button,
		Card,
		CardBody,
		CardFooter,
		CardHeader,
		CardSubtitle,
		CardTitle,
		Icon,
		Spinner,
	} from "@sveltestrap/sveltestrap";
	import { assembleWSPath, redirectToLogin } from "$lib/util";

	function connect() {
		rightServer = false;
		const url = assembleWSPath(protocol, ip);

		promise = con.connect(url);

		// svelte-ignore state_referenced_locally
		promise
			.then(() => {
				rightServer = true;
			})
			.catch(() => {});
	}

	const { protocol, ip } = page.params;
	const { children }: { children: Snippet } = $props();

	let rightServer: boolean | undefined = $state(undefined);
	let promise: Promise<undefined | Event> | undefined = $state();

	// Check if we're connected to the right server.
	if (con.isConnected) {
		console.log("Connected. Checking if connected to the right server...");
		const url = new URL(con.websocket!.url);
		if (protocol + ":" !== url.protocol || ip !== url.hostname) {
			console.log("Connecting to right server...");
			connect();
		} else {
			console.log("Alright. You're good to go");
			rightServer = true;
		}
	} else {
		console.log("Not connected. Connecting to the server...");
		connect();
	}

	$effect(() => {
		if (!page.url.pathname.includes("login"))
			if (rightServer === true) {
				if (con.isConnected && !con.state.authed) {
					console.log("Not logged in. Redirecting to login...");
					redirectToLogin();
				}
			}
	});
</script>

{#if rightServer === true}
	{@render children()}
{:else if rightServer === false}
	<div class="absolute top-1/2 left-1/2 -translate-1/2">
		<Card>
			{#await promise}
				<CardBody class="flex items-center gap-1">
					<Spinner type="border" />
					<span class="text-2xl font-bold">Connecting...</span>
				</CardBody>
			{:catch}
				<CardHeader>
					<CardTitle>Sorry, but</CardTitle>
				</CardHeader>
				<CardBody>
					<CardSubtitle>This Server is currently unavailable.</CardSubtitle>
				</CardBody>
				<CardFooter>
					<Button color="primary" onclick={connect}>
						<Icon name="arrow-clockwise" />
						Try again
					</Button>
				</CardFooter>
			{/await}
		</Card>
	</div>
{/if}
