<script>
    import { XCircleFill, InfoCircleFill } from "svelte-bootstrap-icons";
</script>

<div class="toast-container p-3 bottom-0 end-0">
    <div
        class="toast"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        id="warningtoast"
    >
        <div class="toast-header">
            <XCircleFill class="text-danger" />
            <strong class="me-auto ms-1" />
            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="toast"
                aria-label="Close"
            />
        </div>
        <div class="toast-body" />
    </div>
    <div
        class="toast"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        id="notificationtoast"
    >
        <div class="toast-header">
            <InfoCircleFill class="text-info" />
            <strong class="me-auto ms-1" />
            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="toast"
                aria-label="Close"
            />
        </div>
        <div class="toast-body" />
    </div>
</div>
