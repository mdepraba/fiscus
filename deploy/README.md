# Host runbook

How Fiscus runs in production: one LXC host with 1 vCPU and 1 GB (A-01),
PostgreSQL 18 on localhost, the API under systemd, and Tailscale in front.
CI builds everything and the host only receives files (NFR-20). Docker is not
used here, because it does not start on this host (PRD 1.3).

**Status: drafted 15 Oct 2026, not yet run on the host.** The steps follow
the Apion and Atelion hosts. Each one ends with a check, and
[Verifying this runbook](#verifying-this-runbook) lists what to confirm
before the Stage 1 work items are ticked.

| File | What it is |
| --- | --- |
| [postgresql/fiscus.conf](postgresql/fiscus.conf) | The PostgreSQL limits from PRD 5.3: 160 MB shared buffers, 20 connections, localhost only |
| [fiscus.service](fiscus.service) | The API: `bun --smol apps/api/dist/main.js` as `fiscus`, with MemoryHigh 224 MB and MemoryMax 256 MB (NFR-01), sandboxed as `apion.service` is |

The deploy from CI adds the rest with its own work item: the migration
oneshot, the `deploy` user's sudoers entry, and the script that stages a
release. The memory baseline adds a measuring script and its table.

## Layout on the host

```text
/srv/fiscus/
├── .env                 secrets (NFR-10): root:root, mode 0600
├── data/                files the app writes: fiscus:fiscus, mode 0750
├── releases/<sha>/      one per deploy, owned by deploy
└── current -> releases/<sha>    what fiscus.service runs
```

A release holds `apps/api/dist`, `apps/fiscus-web/dist`, the apps'
`package.json` files and the production `node_modules`. Nothing in it is
built on the host.

Two users keep the duties apart:

- **`fiscus`** is a system user with no login shell. It runs the app.
- **`deploy`** is the account CI logs in as. It owns the releases, and it
  will only be able to start and restart Fiscus's units, through sudoers.

Neither of them can read `.env`. systemd reads it as root before it starts
the unit as `fiscus`.

## Provisioning a fresh host

This takes a fresh Debian 12 or 13, or Ubuntu 24.04, LXC container to ready.
Run it as root. Copy this folder to the host first, for example with
`scp -r deploy root@<host>:/root/fiscus-deploy`, and run the commands from
that copy. The host never needs the rest of the repository.

While Apion still runs on the host (A-01), most of steps 1 to 5 are already
done. Read [Sharing the host with Apion](#sharing-the-host-with-apion) first.

### Step 1: packages and daily security updates

NFR-08: security updates install daily.

```sh
apt-get update
apt-get install -y ca-certificates curl gnupg rsync unattended-upgrades

cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

unattended-upgrade --dry-run --debug 2>&1 | tail -n 5
```

The default `50unattended-upgrades` applies the distribution's security
origin, and that is all this needs. The dry run should list the security
origin and end without errors.

### Step 2: SSH by key only

NFR-08: SSH accepts keys only. Before reloading, make sure your own key works
in a second session, so a mistake cannot lock you out.

```sh
cat > /etc/ssh/sshd_config.d/10-fiscus.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
PubkeyAuthentication yes
EOF

sshd -t && systemctl reload ssh
sshd -T | grep -E '^(passwordauthentication|kbdinteractiveauthentication|permitrootlogin) '
```

The last command should print `no`, `no` and `without-password`.

### Step 3: PostgreSQL 18

PostgreSQL comes from the PGDG repository and listens on localhost only
(NFR-08). [postgresql/fiscus.conf](postgresql/fiscus.conf) holds the PRD 5.3
limits.

```sh
apt-get install -y postgresql-common
/usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
apt-get install -y postgresql-18

install -m 644 postgresql/fiscus.conf /etc/postgresql/18/main/conf.d/fiscus.conf
systemctl restart postgresql@18-main

sudo -u postgres psql -Atc 'SHOW shared_buffers' -c 'SHOW max_connections' -c 'SHOW listen_addresses'
# 160MB, 20, localhost
```

Create the role and the database. The role owns the database, so migrations
can create each module's schema, and pg-boss can create its own later. Keep
the password for `.env` in step 6.

```sh
sudo -u postgres createuser --pwprompt fiscus
sudo -u postgres createdb --owner fiscus fiscus
```

### Step 4: Bun

Install exactly the version that `packageManager` in the root `package.json`
pins (tech-stack follow-up 2). The deploy will check it, and fail if the host
runs a different one.

```sh
BUN_VERSION=1.4.2   # packageManager in package.json, without "bun@"
curl -fsSL https://bun.sh/install | bash -s "bun-v$BUN_VERSION"
install -m 755 ~/.bun/bin/bun /usr/local/bin/bun
bun --version
```

To upgrade, change `packageManager`, install the new version here, then
deploy.

### Step 5: Tailscale

FR-01: only `tailscale serve` reaches the app.

```sh
curl -fsSL https://tailscale.com/install.sh | sh
ls -l /dev/net/tun
```

If `/dev/net/tun` is missing, as it often is in an LXC container, run
Tailscale in userspace mode. `tailscale serve` works the same way there.

```sh
sed -i 's/^FLAGS=.*/FLAGS="--tun=userspace-networking"/' /etc/default/tailscaled
systemctl restart tailscaled
```

Then join the tailnet:

```sh
tailscale up
```

In the Tailscale admin console, turn on MagicDNS and HTTPS certificates, so
that `serve` can use `https://<host>.<tailnet>.ts.net`.

### Step 6: users and `/srv/fiscus`

```sh
useradd --system --home-dir /srv/fiscus --no-create-home \
  --shell /usr/sbin/nologin fiscus
id deploy || useradd --create-home --shell /bin/bash deploy

install -d -m 755 -o deploy -g deploy /srv/fiscus /srv/fiscus/releases
install -d -m 750 -o fiscus -g fiscus /srv/fiscus/data

# NFR-10: root-only. systemd reads it before dropping privileges.
install -m 600 -o root -g root /dev/null /srv/fiscus/.env
stat -c '%a %U:%G %n' /srv/fiscus/.env   # 600 root:root
```

Edit `/srv/fiscus/.env` as root. Each line is a plain `KEY=VALUE`, with no
quotes, spaces or shell expansion. [.env.example](../.env.example) lists the
keys. Today only `DATABASE_URL` is required:

```text
DATABASE_URL=postgres://fiscus:<password from step 3>@127.0.0.1:5432/fiscus
```

Leave `HOST` and `PORT` out. The defaults, `127.0.0.1` and `3000`, are where
`tailscale serve` looks, unless Apion already holds port 3000 (see
[Sharing the host with Apion](#sharing-the-host-with-apion)).

Give CI a key of its own: put the public half of a new key pair in
`~deploy/.ssh/authorized_keys`. The private half becomes a repository secret
with the deploy from CI.

```sh
install -d -m 700 -o deploy -g deploy ~deploy/.ssh
install -m 600 -o deploy -g deploy /dev/null ~deploy/.ssh/authorized_keys
# then append the CI public key to that file
```

### Step 7: the systemd unit

```sh
install -m 644 fiscus.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable fiscus.service
systemd-analyze verify /etc/systemd/system/fiscus.service
```

The unit is enabled but does not start yet: it starts for the first time
when the first deploy has created `current`. `systemd-analyze verify` should
report no errors in the unit itself; a complaint that `/srv/fiscus/current`
is missing is expected until then.

`fiscus.service` keeps the sandboxing that `apion.service` proved on this
host. To see what else could be tightened, run
`systemd-analyze security fiscus.service`, and test each change on the host
before committing it: some settings need kernel features an LXC container
lacks.

### Step 8: `tailscale serve`

FR-01: Tailscale terminates HTTPS and proxies it to the API on loopback.

```sh
tailscale serve --bg --https=443 http://127.0.0.1:3000
tailscale serve status
tailscale funnel status   # must list nothing: Funnel would publish the app
```

`--bg` keeps the setting across restarts. After the first deploy, check
both sides:

- From a device on the tailnet, `curl https://<host>.<tailnet>.ts.net/health`
  returns `{"status":"ok"}`.
- From outside the tailnet, `curl --max-time 5 http://<public-ip>:3000/health`
  fails, and so does port 443 on the public address.

The only other public surface is the ingest path through Caddy, which
Stage 6 adds (FR-26, NFR-08).

### Check: nothing is exposed

NFR-08: only SSH and Tailscale may face the internet. LXC containers often
cannot run a firewall, so the control is that every other service binds to
loopback.

```sh
ss -tlnp
```

- `sshd` should be the only process listening on `0.0.0.0` or `[::]`, apart
  from Apion while it runs.
- PostgreSQL should be on `127.0.0.1:5432` and `[::1]:5432` only.
- Fiscus, once it runs, should be on `127.0.0.1:3000` only.
- `tailscaled` listens only on its tailnet address, and on UDP for WireGuard
  (`ss -ulnp`).

## Sharing the host with Apion

A-01: Fiscus shares the current VPS with Apion until Apion is shut down.
Most of steps 1 to 5 are then already done, with these differences:

- **PostgreSQL is one cluster for both.** Apion's
  `/etc/postgresql/18/main/conf.d/apion.conf` has the same values as
  `fiscus.conf`, so installing both is harmless: `conf.d` loads in name
  order, and `fiscus.conf` comes last. Remove `apion.conf` when Apion goes.
- **Connections.** `max_connections = 20`, of which 3 are reserved for
  superusers. Apion's pool of 10, Fiscus's pool of 5 and one migration
  session make 16, which fits in the 17 that remain.
- **Memory.** While Apion runs, the host has about 160 to 260 MB of headroom
  (PRD 5.3).
- **Ports.** Apion's example configuration also uses port 3000. Run
  `ss -tlnp | grep ':3000 '` before step 8. If Apion holds it, set `PORT=3001`
  in `/srv/fiscus/.env` and use `http://127.0.0.1:3001` in step 8. Likewise,
  if `tailscale serve status` already shows Apion on `https:443`, serve Fiscus
  on another HTTPS port, such as `--https=8443`.
- **Bun is shared.** Both units run `/usr/local/bin/bun`. After changing its
  version, check that Apion still starts.
- **The `deploy` user may already exist.** Fiscus's sudoers file, added with
  the deploy from CI, sits next to Apion's; the two do not overlap.

## Verifying this runbook

When the host is ready, run the steps and confirm each of these. Then tick
the Stage 1 work items in the [implementation plan](../docs/implementation-plan.md),
and fix this runbook wherever the host differed.

| Check | Work item |
| --- | --- |
| `SHOW shared_buffers`, `max_connections` and `listen_addresses` give `160MB`, `20` and `localhost` | The host runbook |
| `sshd -T` gives `no`, `no` and `without-password` | The host runbook |
| The unattended-upgrades dry run lists the security origin | The host runbook |
| `tailscale status` shows the host on the tailnet | The host runbook |
| `/srv/fiscus/.env` is `600 root:root` | The host runbook |
| `systemctl show fiscus.service -p MemoryHigh -p MemoryMax` gives 234881024 and 268435456 (224 MB and 256 MB) | The systemd unit |
| The unit starts under the sandboxing without errors in `journalctl -u fiscus.service` | The systemd unit |
| `tailscale serve status` proxies HTTPS to the API, and `tailscale funnel status` lists nothing | The systemd unit |
| `ss -tlnp` matches [Check: nothing is exposed](#check-nothing-is-exposed) | The host runbook |

The unit can only start once a release is in `current`, so its checks wait
for the first deploy, or for a release copied by hand.
