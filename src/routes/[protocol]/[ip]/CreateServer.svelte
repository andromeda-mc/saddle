<script lang="ts">
	import { con } from "$lib/client.svelte";
	import type { ReturnTypeOfJob } from "$lib/websocketStateClient.svelte";
	import { Button, Form, FormGroup, Icon, Input, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "@sveltestrap/sveltestrap";

	interface CreateException {
		data: string;
		msg: string;
		java_ver?: string;
	}

	const errorLookup: Record<string, string> = {
		"cs: already exists": "A server with the same name already exists",
		"cs: java not found": "The needed java version for this minecraft version was not found",
	};

	function create(e: SubmitEvent) {
		e.preventDefault();

		promise = con.runJob("createServer", serverName, serverSoftware, mcVerson, serverSoftwareVersion);
	}

	function reset() {
		serverName = "";
		serverSoftware = "";
		mcVerson = "";
		serverSoftwareVersion = "";
	}

	let { isOpen = $bindable() }: { isOpen: boolean } = $props();
	const toggle = () => {
		isOpen = !isOpen;
	};

	let validated: boolean = $state(false);

	let serverName = $state("");
	let serverSoftware = $state("");
	let mcVerson = $state("");
	let serverSoftwareVersion = $state("");

	let promise: ReturnTypeOfJob<typeof con, "createServer"> | undefined = $state();

	function softwareChanged() {
		if (serverSoftware === "") return;

		mcVerson = "";
		serverSoftwareVersion = "";

		if (serverSoftware in con.state.softwareInfo === false) con.runJob("getSoftwareData", serverSoftware);
	}

	function mcChanged() {
		if (serverSoftware === "" || serverSoftware === "Vanilla" || mcVerson === "") return;

		serverSoftwareVersion = "";

		if (!con.state.softwareInfo[serverSoftware][mcVerson]) con.runJob("getBuildData", serverSoftware, mcVerson);
	}
</script>

<Modal {isOpen} toggle={promise ? undefined : toggle} on:opening={reset}>
	{#if promise}
		{#await promise}
			<ModalHeader>Creating {serverName}...</ModalHeader>
			<ModalBody>
				<div class="flex justify-center items-center gap-1.5 text-xl">
					<Spinner />
					Creating...
				</div>
			</ModalBody>
		{:then}
			<ModalHeader {toggle}>Created {serverName}!</ModalHeader>
			<ModalBody>
				<div class="flex justify-center items-center gap-1.5 text-xl flex-col">
					The server was created successfully!
					<Button color="success" onclick={toggle}>
						<Icon name="x" />
						Close</Button
					>
				</div>
			</ModalBody>
		{:catch e: CreateException}
			<ModalHeader {toggle}>Failed to create {serverName}</ModalHeader>
			<ModalBody>
				<p class="text-xl">{serverName} could not be created.</p>
				<p><strong>Reason:</strong> {errorLookup[e.msg] ?? e.msg}</p>

				{#if e.java_ver}
					<p>
						<strong>Solution:</strong>
						Install Java {e.java_ver} on this server.
					</p>
				{/if}
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" onclick={toggle}>
					<Icon name="x" />
					Cancel
				</Button>
				<Button
					color="primary"
					onclick={() => {
						promise = undefined;
						validated = false;
					}}
				>
					<Icon name="arrow-left" />
					Go back
				</Button>
			</ModalFooter>
		{/await}
	{:else}
		<ModalHeader {toggle}>Create new Minecraft-Server</ModalHeader>
		<Form {validated} onsubmit={create}>
			<ModalBody>
				<FormGroup floating label="Server Name">
					<Input feedback="Please enter a server name" required type="text" bind:value={serverName} id="create-server-name" />
				</FormGroup>

				<FormGroup floating label="Server Software">
					<Input feedback="Please select a server software" required type="select" bind:value={serverSoftware} onchange={softwareChanged}>
						<option selected disabled></option>
						<option>Vanilla</option>
						<option>Paper</option>
						<option>Fabric</option>
						<option>Forge</option>
					</Input>
				</FormGroup>

				<FormGroup floating label="Minecraft Version">
					<Input feedback="Please select a minecraft version" required type="select" bind:value={mcVerson} onchange={mcChanged}>
						{#each Object.keys(con.state.softwareInfo[serverSoftware] ?? {}) as entry}
							{#if entry !== "undefined"}
								<option>{entry}</option>
							{/if}
						{/each}
					</Input>
				</FormGroup>

				<FormGroup floating label="Server Software Version">
					<Input
						feedback="Please select a server software version"
						required={serverSoftware !== "Vanilla"}
						disabled={serverSoftware === "Vanilla"}
						type="select"
						bind:value={serverSoftwareVersion}
					>
						{#each con.state.softwareInfo[serverSoftware]?.[mcVerson] ?? [] as entry}
							<option>{entry}</option>
						{/each}
					</Input>
				</FormGroup>

				<p>By creating a sever, you agree to the <a href="https://minecraft.net/eula">Minecraft EULA</a>.</p>
			</ModalBody>
			<ModalFooter>
				<Button type="button" color="secondary" onclick={toggle}>Cancel</Button>
				<Button
					type="submit"
					color="primary"
					onclick={() => {
						validated = true;
					}}
				>
					<Icon name="plus" />
					Create Server
				</Button>
			</ModalFooter>
		</Form>
	{/if}
</Modal>
