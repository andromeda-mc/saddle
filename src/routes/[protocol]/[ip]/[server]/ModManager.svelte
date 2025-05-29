<script lang="ts">
	import { page } from "$app/state";
	import { con } from "$lib/client.svelte";
	import {
		Button,
		FormGroup,
		Icon,
		Input,
		InputGroup,
		InputGroupText,
		Modal,
		ModalBody,
		ModalFooter,
		ModalHeader,
		Spinner,
		Table,
	} from "@sveltestrap/sveltestrap";
	import { getVers, search as wrappedSearch } from "$lib/modrinthWrapper";
	import { ProjectsService, VersionsService } from "modrinthjs";
	import type { CancelablePromise, SearchResults, Version } from "modrinthjs";
	import ModList, { type ActionVersion } from "$lib/components/ModList.svelte";
	import { capitalize } from "$lib/util";
	import { installModWithDependencies } from "$lib/mods";

	function installMod(version: Version) {
		installModWithDependencies(
			server,
			version,
			Object.fromEntries(
				(document.querySelectorAll('[id^="installModDep-"]') as NodeListOf<HTMLInputElement>)
					.values()
					.map((e) => [e.id.split("-")[1], e.checked])
					.toArray(),
			),
		);
		isInstallOpen = false;
	}

	const { server } = page.params;
	const { isDatapack, isOpen = $bindable(), toggle }: { isDatapack: boolean; isOpen: boolean; toggle: () => void } = $props();

	let isInstallOpen = $state(false);
	const toggleInstall = () => {
		isInstallOpen = !isInstallOpen;
	};
	let installPID: string | undefined = $state();
	let installVID: string | undefined = $state();
	let installVersionPromise: ActionVersion | undefined = $state();

	function search() {
		resultPromise = wrappedSearch(server, searchTerm, isDatapack);
	}

	let searchTerm: string = $state("");
	let resultPromise: CancelablePromise<SearchResults> = $state(wrappedSearch(server, "", isDatapack));

	function checkSearch(e: KeyboardEvent) {
		if (e.code === "Enter") search();
	}
</script>

{#snippet install(versions: ActionVersion, p_id: string, installed: Record<string, string>)}
	{#if p_id in installed}
		<span class="text-success font-bold">
			<Icon name="check" />
			Already installed
		</span>
	{:else}
		{#await getVers(server, p_id, isDatapack)}
			<span class="text-secondary">
				<Spinner size="sm" />
				Loading versions...
			</span>
		{:then data}
			<Button
				color="success"
				class="mb-2 ml-2"
				size="sm"
				onclick={() => {
					installPID = p_id;
					installVersionPromise = versions;
					installVID = (document.getElementById("verSelect-" + p_id) as HTMLSelectElement).value;
					isInstallOpen = true;
				}}
			>
				<Icon name="plus" />
				Install...
			</Button>
			<FormGroup floating label="Select version to install" class="mb-0!">
				<Input type="select" id="verSelect-{p_id}">
					{#each data as version (version.id)}
						<option value={version.id}>{version.name}</option>
					{/each}
				</Input>
			</FormGroup>
		{/await}
	{/if}
{/snippet}

<Modal
	body
	header="Install {isDatapack ? 'Datapack' : con.state.servers[server].software === 'Paper' ? 'Plugin' : 'Mod'}s"
	scrollable
	size="xl"
	isOpen={isOpen && !isInstallOpen}
	{toggle}
>
	<InputGroup>
		<InputGroupText>
			<Icon name="search" />
		</InputGroupText>
		<Input type="text" bind:value={searchTerm} placeholder="Search" onkeydown={checkSearch} />
	</InputGroup>
	<ModList {isDatapack} listPromise={resultPromise} sort={false} actionSnippet={install} />
</Modal>

<Modal isOpen={isInstallOpen} toggle={toggleInstall} size="lg">
	{#if installPID && installVersionPromise && installVID}
		{#await Promise.all([ProjectsService.getProject(installPID), installVersionPromise])}
			<ModalHeader toggle={toggleInstall}>Loading...</ModalHeader>
			<ModalBody />
		{:then [installProject, versions]}
			{@const installVersion = versions.find((e) => e.id === installVID)!}
			<ModalHeader toggle={toggleInstall}>Install {installProject.title} ({installVersion.version_number})</ModalHeader>
			<ModalBody>
				<Table striped hover>
					<thead>
						<tr>
							<th> Install? </th>
							<th>Mod name</th>
							<th>Version</th>
							<th>Type</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<Input type="checkbox" disabled checked />
							</td>
							<td>{installProject.title}</td>
							<td>{installVersion.version_number}</td>
							<td></td>
						</tr>
						{#each installVersion.dependencies ?? [] as dep (dep.version_id)}
							<tr>
								<td>
									<Input
										type="checkbox"
										disabled={dep.dependency_type !== "optional"}
										checked={dep.dependency_type === "required"}
										id="installModDep-{dep.project_id}"
									/>
								</td>
								<td>
									{#await ProjectsService.getProject(dep.project_id!)}
										<span class="placeholder-glow">
											<span class="placeholder col-4"></span>
										</span>
									{:then dep_pj}
										{dep_pj.title}
									{:catch}
										<em class="text-danger">Failed to load</em>
									{/await}
								</td>
								<td>
									{#if dep.version_id}
										{#await VersionsService.getVersion(dep.version_id)}
											<span class="placeholder-glow">
												<span class="placeholder col-4"></span>
											</span>
										{:then dep_ver}
											{dep_ver.version_number}
										{/await}
									{:else}
										<em>latest</em>
									{/if}
								</td>
								<td>
									{capitalize(dep.dependency_type)}
								</td>
							</tr>
						{/each}
					</tbody>
				</Table>
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" onclick={toggleInstall}>
					<Icon name="x" />
					Cancel
				</Button>
				<Button color="primary" onclick={() => installMod(installVersion)}>
					<Icon name="plus" />
					Install
				</Button>
			</ModalFooter>
		{/await}
	{/if}
</Modal>

<style>
	:global(select) {
		width: 15rem !important;
	}
</style>
