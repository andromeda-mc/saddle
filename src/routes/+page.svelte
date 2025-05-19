<script lang="ts">
  import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardText,
    Form,
    Icon,
    Input,
    InputGroup,
    InputGroupText,
    Toast,
    ToastBody,
    ToastHeader,
  } from "@sveltestrap/sveltestrap";
  import { con } from "$lib/client.svelte";
  import { goto } from "$app/navigation";
  import { assembleBasePath } from "$lib/util";
  import { onDestroy, onMount } from "svelte";

  let promise: ReturnType<(typeof con)["connect"]> | undefined = $state();
  let failed = $state("");
  let url: string = $state("");

  let quickConnect: string[] = $state([]);

  function submit(e: Event) {
    e.preventDefault();
    connect(url);
  }

  function addQuickConnect() {
    if (/wss?:\/\/[\d\.a-z]*/.exec(url)) {
      quickConnect.push(url);
      url = "";
    } else {
      failed = "This is not a valid URL";
    }
  }

  function connect(url: string) {
    try {
      const urlElement = new URL(url);
      promise = con.connect(
        `${urlElement.protocol}//${urlElement.hostname}:29836`
      );

      promise
        .then(() => {
          goto(assembleBasePath(con.websocket!.url) + "login");
        })
        .catch(() => {
          promise = undefined;
          failed = "Could not connect to server!";
        });
    } catch {
      promise = undefined;
      failed = "This is not a valid url!";
    }
  }

  onMount(() => {
    quickConnect = JSON.parse(localStorage.getItem("quickConnect") ?? "[]");
  });

  $effect(() => {
    localStorage.setItem("quickConnect", JSON.stringify(quickConnect));
  });
</script>

<div class="absolute top-1/2 left-1/2 -translate-1/2">
  {#if promise}
    {#await promise}
      <Card>
        <CardBody>
          <span class="text-2xl font-bold">Connecting...</span>
        </CardBody>
      </Card>
    {:catch}
      <!-- svelte-ignore block_empty -->
    {/await}
  {:else}
    <Card>
      <CardHeader>Connect to server</CardHeader>
      <Form validated={true} onsubmit={submit}>
        <CardBody>
          <InputGroup>
            <InputGroupText>Server address:</InputGroupText>
            <Input
              placeholder="wss://example.com"
              type="url"
              required
              bind:value={url}
            />
            <InputGroupText>:29836</InputGroupText>
          </InputGroup>
        </CardBody>

        <CardHeader>Quick Connect</CardHeader>
        <CardBody class="flex flex-col gap-1">
          {#if quickConnect.length > 0}
            <table>
              <tbody>
                {#each quickConnect as server}
                  <tr>
                    <td>
                      <Button
                        color="secondary"
                        class="text-left! w-full! mb-1"
                        onclick={() => {
                          connect(server);
                        }}>{server}</Button
                      >
                    </td>
                    <td>
                      <Button
                        color="secondary"
                        outline
                        class="ml-2!"
                        type="button"
                        onclick={() => {
                          quickConnect.splice(quickConnect.indexOf(server), 1);
                        }}
                      >
                        <Icon name="trash-fill" />
                      </Button></td
                    >
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <CardText
              >Add a Quick Connect Server with the button below.</CardText
            >
          {/if}
        </CardBody>

        <CardFooter class="flex justify-end items-center gap-1">
          <Button
            type="button"
            color="primary"
            outline
            onclick={addQuickConnect}
            ><Icon name="plus" />Add Quick Connect Server</Button
          >
          <Button type="submit" color="primary">
            <Icon name="box-arrow-in-right" />
            Connect...</Button
          >
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
