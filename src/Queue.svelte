<script>
    export let exception_list;
    export let delException;
    export let queue;
</script>

<div class="offcanvas offcanvas-end" tabindex="-1" id="queueModal">
    <div class="offcanvas-header">
        <h5 class="offcanvas-title">Task queue</h5>
        <button
            type="button"
            class="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
        />
    </div>
    <div class="offcanvas-body">
        {#if exception_list}
            {#if exception_list.length}
                {#each exception_list as exceptionItem, index}
                    <div class="card border-danger mb-3">
                        <div class="card-header d-flex">
                            Exception
                            <button
                                type="button"
                                class="btn-close ms-auto"
                                aria-label="Dismiss"
                                on:click={() => delException(index)}
                            />
                        </div>
                        <div class="card-body">
                            <h5>{exceptionItem.title}</h5>
                            <h6 class="card-subtitle mb-2">
                                {exceptionItem.subtitle}
                            </h6>
                        </div>
                    </div>
                {/each}
            {:else}
                <p>No exception has occurred.</p>
            {/if}
        {/if}
        <hr />
        {#if queue}
            {#if queue.length}
                {#each queue as queueItem}
                    {@const title = queueItem.split(":", 1)[0]}
                    <div class="card">
                        <div class="card-body">
                            <h5>{title}</h5>
                            <h6 class="card-subtitle mb-2 text-body-secondary">
                                {queueItem.replace(title + ": ", "")}
                            </h6>
                            <div class="progress" role="progressbar">
                                <div
                                    class="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                                    style="width: 100%"
                                />
                            </div>
                        </div>
                    </div>
                {/each}
            {:else}
                <p>No tasks are running.</p>
            {/if}
        {/if}
    </div>
</div>
