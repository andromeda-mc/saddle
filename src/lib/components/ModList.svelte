<script module>
	export type ActionVersion = CancelablePromise<Version[]>;
	export type ActionSnippet = (versions: ActionVersion, p_id: string) => ReturnType<Snippet>;
</script>

<script lang="ts">
	import { page } from "$app/state";
	import { getVers } from "$lib/modrinthWrapper";
	import { assembleModrinthUrl, capitalize, format, reduceToOwner } from "$lib/util";
	import { Badge, Card, CardBody, CardSubtitle, CardText, CardTitle, Icon } from "@sveltestrap/sveltestrap";
	import { TeamsService } from "modrinthjs";
	import type { CancelablePromise, Project, ProjectResult, SearchResults, Version } from "modrinthjs";
	import type { Snippet } from "svelte";
	const {
		listPromise,
		isDatapack,
		actionSnippet,
	}: {
		listPromise: Promise<Project[] | SearchResults>;
		isDatapack: boolean;
		actionSnippet?: ActionSnippet;
	} = $props();

	function fixData(data: Project[] | SearchResults): SearchResults["hits"] | Project[] {
		if (!Array.isArray(data)) {
			return data.hits;
		}
		return data;
	}
</script>

{#await listPromise}
	<Card>
		<div class="flex items-center">
			<CardBody class="flex-none! pr-0!">
				<div class="bg-secondary w-24 h-24 border-2 rounded-sm border-(--bs-card-border-color)"></div>
			</CardBody>
			<CardBody class="shrink">
				<CardTitle class="placeholder-glow">
					<span class="placeholder col-6"></span>
				</CardTitle>
				<CardText class="placeholder-glow">
					<span class="placeholder col-7"></span>
					<span class="placeholder col-4"></span>
					<span class="placeholder col-5"></span>
					<span class="placeholder col-6"></span>
					<span class="placeholder col-8"></span>
					<span class="placeholder col-3"></span>
				</CardText>
			</CardBody>
		</div>
	</Card>
{:then data}
	{@const dataf = fixData(data)}
	{#if dataf.length > 0}
		{#each dataf as p}
			{@const project = p as ProjectResult | Project}
			{@const p_id = "id" in p ? p.id : p.project_id}
			{@const modrinthUrl = assembleModrinthUrl("id" in project ? project.id : project.project_id, isDatapack)}

			<Card class="my-2">
				<div class="flex items-center">
					<CardBody class="flex-none! pr-0!">
						{#if project.icon_url}
							<img
								class="w-24 h-24 border-2 rounded-sm border-(--bs-card-border-color)"
								src={project.icon_url}
								alt={project.title + "'s logo"}
							/>
						{:else}
							<svg
								fill-rule="evenodd"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-miterlimit="1.5"
								clip-rule="evenodd"
								viewBox="0 0 104 104"
								aria-hidden="true"
								class="w-24 h-24 border-2 rounded-sm border-(--bs-card-border-color)"
							>
								<path data-v-4d2ae5a0="" fill="none" d="M0 0h103.4v103.4H0z" />
								<path
									data-v-4d2ae5a0=""
									fill="none"
									stroke="#9a9a9a"
									stroke-width="5"
									d="M51.7 92.5V51.7L16.4 31.3l35.3 20.4L87 31.3 51.7 11 16.4 31.3v40.8l35.3 20.4L87 72V31.3L51.7 11"
								/>
							</svg>
						{/if}
					</CardBody>

					<CardBody class="flex justify-between shrink">
						<div>
							<CardTitle>
								<a href={modrinthUrl} target="_blank">{project.title}</a>
								{#if project.categories?.length}
									{#each project.categories as cat}
										<Badge color="primary" class="mx-1 no-underline!" href="https://modrinth.com/mods?f=categories:{cat}" target="_blank"
											>{capitalize(cat)}</Badge
										>
									{/each}
								{/if}
							</CardTitle>
							<CardSubtitle>
								{#if "author" in project}
									by
									{project.author}
								{:else}
									{#await TeamsService.getProjectTeamMembers(project.id)}
										<div class="placeholder-glow">
											<span class="placeholder col-3"></span>
										</div>
									{:then members}
										{#if members.length > 0}
											{@const user = reduceToOwner(members).user}
											by
											<a href="https://modrinth.com/user/{user.id}">
												{user.username}
											</a>
										{:else}
											<a
												class="italic"
												href={modrinthUrl}
												target="_blank"
												title="This is necessary, because the Modrinth API is not up to date, with the main Modrinth Website. It is impossible to get even the organisation name of a project."
												>click for author</a
											>
										{/if}
									{/await}
								{/if}
							</CardSubtitle>
							<CardText>
								{project.description}
							</CardText>
						</div>
						<div class="text-end flex-none">
							<div class="flex items-center gap-1.5 justify-end">
								<Icon name="download" />{format(project.downloads)}
								<Icon name="heart" />
								{format("followers" in project ? project.followers : project.follows)}
							</div>
							{#if actionSnippet}
								{@render actionSnippet(getVers(page.params.server!, p_id, isDatapack), p_id)}
							{/if}
						</div>
					</CardBody>
				</div>
			</Card>
		{/each}
	{:else}
		<Card>
			<div class="flex items-center">
				<CardBody class="flex-none! pr-0!">
					<div
						class="bg-secondary w-24 h-24 flex items-center justify-center text-2xl font-light rotate-90 cursor-vertical-text border-2 rounded-sm border-(--bs-card-border-color)"
					>
						:(
					</div>
				</CardBody>
				<CardBody class="shrink">
					<CardTitle>No results found!</CardTitle>
				</CardBody>
			</div>
		</Card>
	{/if}
{:catch error}
	<Card>
		<div class="flex items-center">
			<CardBody class="flex-none! pr-0!">
				<div
					class="bg-danger w-24 h-24 flex items-center justify-center text-2xl font-light border-2 rounded-sm border-(--bs-card-border-color)"
				>
					!
				</div>
			</CardBody>
			<CardBody class="shrink">
				<CardTitle>Failed to fetch data from Modrinth!</CardTitle>
				<CardSubtitle class="text-body-secondary">This is not necessarily an Andromeda Stall or Saddle error.</CardSubtitle>
				<CardText>
					Error details: {error.message}
					For even further details please see the developer console.
				</CardText>
			</CardBody>
		</div>
	</Card>
{/await}
