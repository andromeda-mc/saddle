<script lang="ts">
	import { page } from "$app/state";
	import { assembleBasePath, assembleWSPath } from "$lib/util";
	import {
		Card,
		CardBody,
		CardHeader,
		Form,
		InputGroup,
		InputGroupText,
		Input,
		CardFooter,
		Button,
		ToastBody,
		ToastHeader,
		Icon,
		Toast,
	} from "@sveltestrap/sveltestrap";
	import { con } from "$lib/client.svelte";
	import { goto } from "$app/navigation";
	import { sha256 } from "js-sha256";
	import type { ReturnTypeOfJob } from "$lib/websocketStateClient.svelte";

	function submit(e: SubmitEvent) {
		e.preventDefault();
		promise = con.runJob("auth", sha256(password));

		promise
			.then(() => {
				con.state.authed = true;

				promise = con.runJob("listservers");

				promise.then(() => {
					const url = assembleBasePath(con.websocket!.url) + page.url.search.substring(2);
					goto(url);
				});
			})
			.catch(() => {
				promise = undefined;
				failed = "Invalid Password";
				password = "";
			});
	}

	function checkforcaps(e: KeyboardEvent): void {
		capsOn = e.getModifierState("CapsLock");
	}

	let promise: ReturnTypeOfJob<typeof con, "auth"> | ReturnTypeOfJob<typeof con, "listservers"> | undefined = $state();
	let failed = $state("");
	let password: string = $state("");
	let capsOn: boolean = $state(false);

	const { protocol, ip } = page.params;
</script>

<svelte:head>
	<title>Login - {assembleWSPath(protocol, ip)} - Andromeda Saddle</title>
</svelte:head>

<div class="absolute top-1/2 left-1/2 -translate-1/2">
	{#if promise}
		{#await promise}
			<Card>
				<CardBody>
					<span class="text-2xl font-bold">Logging in...</span>
				</CardBody>
			</Card>
		{:catch}
			<!-- svelte-ignore block_empty -->
		{/await}
	{:else}
		<Card>
			<CardHeader>Log in into {assembleWSPath(protocol, ip)}</CardHeader>
			<Form onsubmit={submit}>
				<CardBody>
					<InputGroup>
						<InputGroupText>
							<Icon name="key" class="mr-1" />
							Password:
						</InputGroupText>
						<Input type="password" required bind:value={password} onkeydown={checkforcaps} />
					</InputGroup>
					<span class="text-danger" style:display={capsOn ? "block" : "none"}>
						<Icon name="capslock-fill" />
						Caps lock is on!
					</span>
				</CardBody>
				<CardFooter class="flex justify-end items-center">
					<Button type="submit" color="primary">
						<Icon name="box-arrow-in-right" />
						Log in...
					</Button>
				</CardFooter>
			</Form>
		</Card>
	{/if}
</div>

<Toast
	class="bottom-2 right-2 absolute"
	autohide
	isOpen={failed !== ""}
	onclose={() => {
		failed = "";
	}}
>
	<ToastHeader>
		<Icon slot="icon" name="x-circle-fill" class="text-danger mr-0.5" />
		An error occured
	</ToastHeader>
	<ToastBody>
		{failed}
	</ToastBody>
</Toast>
