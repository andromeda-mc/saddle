<script lang="ts">
  import { con } from "$lib/client.svelte";
  import { goto } from "$app/navigation";

  import "../app.css";
  import "/node_modules/bootstrap/dist/css/bootstrap.min.css";
  import "/node_modules/bootstrap-icons/font/bootstrap-icons.min.css";

  import {
    Button,
    Collapse,
    Nav,
    Navbar,
    NavbarBrand,
    NavbarToggler,
    ThemeToggler,
    Icon,
    colorMode,
    NavItem,
    NavLink,
    Progress,
  } from "@sveltestrap/sveltestrap";
  import { assembleBasePath } from "$lib/util";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  const { children } = $props();

  function check() {
    if (page.status !== 200) return;

    // Goto connect page, when not connected
    if (!page.route.id?.startsWith("/[protocol]/[ip]") && !con.isConnected)
      return goto("/");

    if (con.isConnected && !con.state.authed)
      return goto(assembleBasePath(con.websocket!.url) + "login");
  }

  let isOpen = $state(true);

  function handleUpdate(event: any) {
    isOpen = event.detail.isOpen;
  }

  onMount(() => {
    $colorMode = localStorage.getItem("theme") ?? "dark";

    // Register effect after reading theme from local storage
    $effect(() => {
      localStorage.setItem("theme", $colorMode);
      console.log("Stored color mode");
    });
  });

  check();
</script>

<Navbar color="secondary-subtle" expand="md" container="md">
  <NavbarBrand>Andromeda Saddle²</NavbarBrand>
  <NavbarToggler on:click={() => (isOpen = !isOpen)} />
  <Collapse {isOpen} navbar expand="md" on:update={handleUpdate}>
    <Nav class="ms-auto items-center" navbar>
      <NavItem>
        <NavLink href="/"
          >Connect to {page.route.id?.includes("[ip]")
            ? "other server"
            : "server"}</NavLink
        >
      </NavItem>
      {#if page.route.id?.includes("[ip]") && con.state.authed}
        <NavLink href="/{page.params.protocol}/{page.params.ip}/"
          >Serverlist</NavLink
        >
        <NavItem>
          <Progress
            class="w-2xs m-1"
            color="info"
            value={con.state.cpu_percent}
            title="CPU Usage: {con.state.cpu_percent}%">CPU</Progress
          >
          <Progress
            class="w-2xs m-1"
            color="success"
            value={con.state.memory_percent}
            title="Memory Usage: {con.state.memory_percent}%">Mem</Progress
          >
        </NavItem>
      {/if}

      {/* @ts-ignore */ null}
      <ThemeToggler let:currentColorMode let:toggleColorMode>
        <Button onclick={() => toggleColorMode()} outline color="secondary">
          {#if currentColorMode === "dark"}
            <Icon name="moon-stars" />
          {:else}
            <Icon name="brightness-high" />
          {/if}
        </Button>
      </ThemeToggler>
    </Nav>
  </Collapse>
</Navbar>
{@render children()}
