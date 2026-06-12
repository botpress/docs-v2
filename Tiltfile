# Docs-v2 Development Environment
allow_k8s_contexts('foundation-cloud-staging')
allow_k8s_contexts("development")

allow_k8s_contexts("development")

# --- Guard: vale required for writing check ---
_vale_installed = str(local("which vale 2>/dev/null || echo ''", quiet=True)).strip() != ""

local_resource(
    "install",
    cmd="bun install",
    dir=".",
    labels=["setup"],
)

local_resource(
    "dev",
    serve_cmd="bun dev",
    serve_dir=".",
    resource_deps=["install"],
    links=["http://localhost:4321/docs"],
    labels=["services"],
)

local_resource(
    "preview",
    cmd="bun run build",
    serve_cmd="bun preview",
    serve_dir=".",
    resource_deps=["install"],
    auto_init=False,
    links=["http://localhost:4322/docs"],
    labels=["services"],
)

local_resource(
    "build",
    cmd="bun run build",
    dir=".",
    resource_deps=["install"],
    auto_init=False,
    labels=["build"],
)

local_resource(
    "check",
    cmd="bun run check",
    dir=".",
    resource_deps=["install"],
    auto_init=False,
    labels=["checks"],
)

local_resource(
    "check:format",
    cmd="bun run check:format",
    dir=".",
    resource_deps=["install"],
    auto_init=False,
    labels=["checks"],
)

local_resource(
    "check:lint",
    cmd="bun run check:lint",
    dir=".",
    resource_deps=["install"],
    auto_init=False,
    labels=["checks"],
)

local_resource(
    "check:type",
    cmd="bun run check:type",
    dir=".",
    resource_deps=["install"],
    auto_init=False,
    labels=["checks"],
)

local_resource(
    "check:links",
    cmd="bun run check:link",
    dir=".",
    resource_deps=["install"],
    auto_init=False,
    labels=["checks"],
)

if _vale_installed:
    local_resource(
        "check:writing",
        cmd="bun run check:writing",
        dir=".",
        resource_deps=["install"],
        auto_init=False,
        labels=["checks"],
    )
else:
    warn("vale not found in PATH. 'check:writing' resource disabled. See https://vale.sh/docs/vale-cli/installation/ for install instructions.")

local_resource(
    "fix",
    cmd="bun run fix",
    dir=".",
    resource_deps=["install"],
    auto_init=False,
    labels=["utils"],
)

local_resource(
    "fix:format",
    cmd="bun run fix:format",
    dir=".",
    resource_deps=["install"],
    auto_init=False,
    labels=["utils"],
)

local_resource(
    "fix:lint",
    cmd="bun run fix:lint",
    dir=".",
    resource_deps=["install"],
    auto_init=False,
    labels=["utils"],
)
