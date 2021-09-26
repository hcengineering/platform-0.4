echo "Launching locally"

export SECURITY_CERT_FILE=$(realpath ../../dev/certificates/cert.crt)
export SECURITY_KEY_FILE=$(realpath ../../dev/certificates/cert.key)
export WEB_HOST='localhost'
export ACCOUNTS_URI='https://localhost:8080/auth'
export CLIENT_URI='wss://localhost:18080'
pushd ./dist

node ./server.js
popd
