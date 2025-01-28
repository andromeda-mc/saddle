<script lang="ts">
	import { websocket } from '$lib/stores/websocket';
	import { goto } from '$app/navigation';
	import logo from '$lib/logo.png';
	import '../app.css';

	if (!$websocket && location.pathname != '/login') {
		goto('/login?redirect_url=' + location.pathname + location.search);
	}
	let { children } = $props();
</script>

<header>
	<nav>
		<img src={logo} alt="andromeda logo" />
		<span>Andromeda Saddle <em>2</em>:&nbsp;</span>
		{#if $websocket}
			<span>Connected with [placeholder]</span>
		{:else}
			<span class="gray-text">Disconnected</span>
		{/if}
	</nav>
</header>

<main>
	{@render children()}
</main>

<footer>Not affliniated with Mojang Studios or Microsoft!</footer>
