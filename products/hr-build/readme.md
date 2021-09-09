# Running on AWS

```bash

# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install node


# Run mongo db
docker volume create mongodbdata
docker run -d -p 27017:27017 -v mongodbdata:/data/db mongo

# When download and unzip hr-build artifacts.

# Starting server

cp launcher.sh.template launcher.sh
# Modify launcher.sh with a proper parameters
launcher.sh # will start server in background, out.log will be accessible with logs
```
