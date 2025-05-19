<script lang="ts">
  import { con } from "$lib/client.svelte";
  import ServerStartStopButton from "$lib/components/ServerStartStopButton.svelte";
  import { assembleBasePath, capitalize } from "$lib/util";
  import type { ReturnTypeOfJob } from "$lib/websocketStateClient.svelte";
  import {
    Card,
    CardBody,
    CardHeader,
    Container,
    Row,
    Col,
    CardTitle,
    CardText,
    CardSubtitle,
    CardFooter,
    Button,
    Icon,
  } from "@sveltestrap/sveltestrap";
</script>

<h1 class="text-center text-2xl">Your servers</h1>
<Container>
  {#if Object.keys(con.state.servers).length > 0}
    <Row class="gap-0.5 justify-center">
      {#each Object.entries(con.state.servers) as [name, data]}
        <Col class="flex justify-center p-2">
          <Card class="w-72!">
            <CardHeader>
              <CardTitle>{name}</CardTitle>
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
            </CardBody>
            <CardFooter>
              <Button
                color="primary"
                href={assembleBasePath(con.websocket!.url) + name}
              >
                <Icon name="pencil-fill" />
                Edit
              </Button>
              <ServerStartStopButton serverName={name} />
              <Button outline color="secondary">
                <Icon name="trash-fill" />
              </Button>
            </CardFooter>
          </Card>
        </Col>
      {/each}
    </Row>
  {:else}
    <p class="text-center text-2xl">You have no servers created</p>
  {/if}
</Container>
