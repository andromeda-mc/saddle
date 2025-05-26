<script lang="ts">
	import { page } from "$app/state";
	import { con, legacyProperty } from "$lib/client.svelte";
	import {
		Card,
		CardBody,
		CardHeader,
		CardText,
		CardTitle,
	} from "@sveltestrap/sveltestrap";
	import { isRight } from "fp-ts/lib/Either";
	import { array } from "io-ts";

	const { server } = page.params;
</script>

{#if con.state.authed}
	{#await con.runJob("getProperties", server) then d}
		{#if isRight(array(legacyProperty).decode(d.properties))}
			<div class="absolute top-1/2 left-1/2 -translate-1/2">
				<Card>
					<CardHeader>Warning</CardHeader>
					<CardBody>
						<CardTitle
							>You're using an outdated version of Andromeda Stall.</CardTitle
						>
						<CardText
							>The settings can't be displayed, because your version of
							Andromeda Stall is using the old system, which is deprecated.
							Please switch to the newest version of Andromeda Stall.</CardText
						>
					</CardBody>
				</Card>
			</div>
		{/if}
	{/await}
{/if}
