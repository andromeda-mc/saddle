<script>
    import { Download, Heart, TrashFill, Plus } from "svelte-bootstrap-icons";
    import { format } from "./utils.js";

    export let listPromise;
    export let installMode = false;
    export let datapackMode = false;
    export let install = undefined;
    export let uninstallMod = undefined;

    function fix_data(data) {
        if (data.hits) {
            data = data.hits;
        }
        return data.sort((a, b) => {
            return a.title.localeCompare(b.title);
        });
    }
</script>

{#await listPromise}
    <div class="card my-1">
        <div class="d-flex">
            <div class="bg-secondary" style="width: 128px; height: 128px;" />
            <div class="card-body">
                <h5 class="card-title placeholder-glow">
                    <span class="placeholder col-6" />
                </h5>
                <p class="card-text placeholder-glow">
                    <span class="placeholder col-7" />
                    <span class="placeholder col-4" />
                    <span class="placeholder col-5" />
                    <span class="placeholder col-6" />
                    <span class="placeholder col-8" />
                    <span class="placeholder col-3" />
                </p>
            </div>
        </div>
    </div>
{:then data}
    {#if data}
        {@const dataf = fix_data(data)}
        {#each dataf as hit}
            <div class="card my-2">
                <div class="d-flex">
                    {#if hit.icon_url}
                        <img src={hit.icon_url} alt="logo" height="128" />
                    {:else}
                        <div
                            class="bg-secondary d-flex align-items-center justify-content-center text-light"
                            style="width: 128px; height: 128px;"
                        >
                            No logo
                        </div>
                    {/if}
                    <div class="card-body">
                        <h5 class="card-title d-flex justify-content-between">
                            <a
                                class="link-info"
                                target="_blank"
                                href="https://modrinth.com/{datapackMode
                                    ? 'datapack'
                                    : 'mod'}/{hit.slug}"
                            >
                                {hit.title}
                            </a>
                            <div>
                                <Download class="me-1" />{format(hit.downloads)}
                                <Heart class="ms-2 me-1" />{format(
                                    hit.followers ? hit.followers : hit.follows,
                                )}
                                {#if installMode}
                                    <button
                                        type="button"
                                        class="btn btn-primary"
                                        on:click={() => install(hit.project_id)}
                                    >
                                        <Plus height="24" width="24" /></button
                                    >
                                {:else}
                                    <button
                                        type="button"
                                        class="btn btn-danger"
                                        on:click={() =>
                                            uninstallMod(hit.id, datapackMode)}
                                    >
                                        <TrashFill /></button
                                    >
                                {/if}
                            </div>
                        </h5>
                        {#if hit.author}
                            <h6 class="card-subtitle text-body-secondary">
                                by {hit.author}
                            </h6>
                        {/if}
                        <p class="card-text">
                            {hit.description}
                        </p>
                    </div>
                </div>
            </div>
        {/each}
    {/if}
{/await}
