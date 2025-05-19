<script lang="ts">
  import { page } from "$app/state";
  import { con } from "$lib/client.svelte";
  import ServerStartStopButton from "$lib/components/ServerStartStopButton.svelte";
  import { capitalize } from "$lib/util";
  import {
    Container,
    Row,
    Col,
    CardFooter,
    CardHeader,
    Card,
    CardBody,
    CardTitle,
    CardText,
    CardSubtitle,
  } from "@sveltestrap/sveltestrap";
  const { server } = page.params;
</script>

{#if con.state.authed}
  {@const data = con.state.servers[server]}
  <h1 class="text-center text-2xl">Server: {server}</h1>
  <Container>
    <Row class="gap-0.5 justify-center">
      <Col class="flex justify-center p-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardBody>
            <CardSubtitle>Minecraft {data.mc_version}</CardSubtitle>
            <CardText
              >{capitalize(data.software)}
              {data.software_version !== ""
                ? `(${data.software_version})`
                : ""}</CardText
            >
            <CardText>Java {data.java_ver}</CardText>
            {#if data.software !== "Vanilla"}
              <CardText
                >{data.mods.length}
                {data.software === "Paper" ? "Plugin" : "Mod"}{data.mods
                  .length === 1
                  ? ""
                  : "s"}</CardText
              >
            {/if}
            <CardText
              >{data.datapacks.length} Datapack{data.datapacks.length === 1
                ? ""
                : "s"}</CardText
            >
          </CardBody>
          <CardFooter>
            <ServerStartStopButton serverName={server} />
          </CardFooter>
        </Card>
      </Col>
    </Row>
  </Container>
{/if}
