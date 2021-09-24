# Generate root certificate
echo "Generate root certificate"

mkdir -p ./dev/certificates
pushd ./dev/certificates
  #
  # Generate self signed certificate
  # 
  openssl req -x509 -nodes -new -sha256 -days 256 -newkey rsa:2048 -keyout RootCA.key -out RootCA.pem -subj "/C=US/CN=Anticrm-Root-CA"
  openssl x509 -outform pem -in RootCA.pem -out RootCA.crt
popd
