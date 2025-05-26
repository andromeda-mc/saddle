<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import {
		Button,
		Card,
		CardBody,
		CardFooter,
		CardHeader,
		CardSubtitle,
		CardTitle,
		Icon,
	} from "@sveltestrap/sveltestrap";
</script>

<div class="absolute top-1/2 left-1/2 -translate-1/2">
	<Card>
		<CardHeader>
			<CardTitle>
				Error {page.status}
			</CardTitle>
		</CardHeader>
		<CardBody>
			<CardSubtitle>{page.error?.message}</CardSubtitle>
		</CardBody>
		<CardFooter>
			<Button
				color="primary"
				onclick={() => {
					goto("/");
				}}
			>
				<Icon name="arrow-left" />
				Go back
			</Button>
		</CardFooter>
	</Card>
</div>
