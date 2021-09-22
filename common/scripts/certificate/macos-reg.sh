
# Register an root certificate with MacOS registry.
echo "Register an root cerficiate with MacOS registry"

sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./dev/certificates/RootCA.crt
