# DID and SSI case study

Decentralized identifiers [(DIDs)](https://www.w3.org/TR/did-core/) are a new type of identifier to provide verifiable, decentralized digital identity. These new identifiers are designed to enable the controller of a DID to prove control over it and to be implemented independently of any centralized registry, identity provider, or certificate authority.

## Running the app
#### Prerequisities
The whole application is started using [`docker`](https://docs.docker.com/install/).

#### Building and running
Bootstrap the web ui and all the services using following commands

```
docker-compose build
docker-compose up
```

The status of the containers can be checked using `docker ps` command.

Once the containers are started, navigate to http://localhost:8080/ for a step by step wizard. The descriptions for the flow of the case study including the entities and their roles is included into the wizard.

#### Used libraries
This code is based on [Web DID Resolver](https://github.com/decentralized-identity/web-did-resolver) library for resolving DIDs via https protocol as well as
[did-jwt](https://github.com/decentralized-identity/did-jwt) and [did-jwt-vc](https://github.com/decentralized-identity/did-jwt-vc) libraries for generation and validation of DID documents using JWT

#### Project structure
`wallet-ui` directory has a quick and dirty UI while `identity-providers` includes server-side logics


#### Deploying to cloud
For the case study i have chosen the scaleway cloud service provider.
To deploy to cloud using kubernetes follow the next steps: 

- Set env variables with API keys
```
export SCW_ACCESS_TOKEN=token
export SCW_SECRET_TOKEN=secret
```

- Create docker image
```
docker build -t identity-image:latest ./identity-providers
```

- Login to registry provider
```
docker login rg.fr-par.scw.cloud/affectionatenewton -u nologin -p $SCW_SECRET_TOKEN
```

- Tag docker image and push to registry
```
docker tag identity-image:latest rg.fr-par.scw.cloud/affectionatenewton/identity-image:latest
docker push rg.fr-par.scw.cloud/affectionatenewton/identity-image:latest
```

- Creating an Image Pull Secret
```
kubectl create secret docker-registry registry-secret --docker-server=rg.fr-par.scw.cloud --docker-username=myuser --docker-password=$SCW_SECRET_TOKEN --docker-email=my@email.com
```

- Apply to cluster
```
kubectl apply -f ./deployment/deployment-clinic.yaml,./deployment/deployment-insurance.yaml,./deployment/deployment-notary.yaml,./deployment/deployment-user.yaml`
```

- Check the running instances
```
kubectl get pods
``` 