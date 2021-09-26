echo "Launching locally"

export SECURITY_CERT_FILE=$(realpath ../../dev/certificates/cert.crt)
export SECURITY_KEY_FILE=$(realpath ../../dev/certificates/cert.key)
export WEB_HOST='127.0.0.1'
export ACCOUNTS_URI='https://127.0.0.1:8080/auth'
export CLIENT_URI='wss://127.0.0.1:18080'
pushd ./dist

node ./server.js
popd
