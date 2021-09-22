# Generate a server certificate
echo "Generate server certificate"

pushd ./dev/certificates
  cat >./domains.ext <<EOL
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage=serverAuth,clientAuth,codeSigning
subjectAltName = @alt_names
[alt_names]
DNS.1 = localhost
DNS.2 = localhost.localdomain
DNS.3 = [::1]
IP.1 = 127.0.0.1
IP.2 = FE80:0:0:0:0:0:0:1
EOL

  #
  # General local development certificate
  #
  openssl req -new -nodes -newkey rsa:2048 -keyout cert.key -out cert.csr -subj "/C=US/ST=YourState/L=YourCity/O=AnticrmDev/CN=localhost"
  openssl x509 -req -sha256 -days 128 -in cert.csr -CA RootCA.pem -CAkey RootCA.key -CAcreateserial -extfile domains.ext -out cert.crt
popd