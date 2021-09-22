# Development section

## 0. Certificates

Since now we hosting with SSL, it is required to have a root dev certificate added to host development system. Cerficate generation is required to be performed only once.

### Generate local certificates to allow SSL (required only once)

```bash
./common/scripts/certificate/root-gen.sh
```

After certificate is generated, an ./dev/certificates/RootCA.crt should be imported to host system.

### Generate an server certificate for use for SSL.

```bash
./common/scrtips/certificate/

### Register Root certificate MacOS Only

```bash
./common/scripts/certificate/macos-reg.sh
```

## 1. Running Web + in memory storage for UI development only

Following configuration will execute webpack with UI from sources and load `core-plugin-dev`, it will perform emulation of server and allow to do local development and testing.

Require a certificate generation before launching.

```bash
cd ./dev/prod
rushx dev
```

## 2. Running Web + server storage + production dev

Require a certificate and mongoDB to be launched before execution.

### 2.1 Run dev server + auth

```bash
cd ./dev/server
rushx dev
```

### 2.2 Run Web UI connected to server

```bash
cd ./dev/prod
rushx dev-server
```
