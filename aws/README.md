# Production infrastructure

This directory contains the configuration files for the production infrastructure of the Global.health project.

## One-time setup

Install `eksctl` and `kubectl` to interact with Amazon EKS and the Kubernetes control plane.

You can learn more about `eksctl` [here](https://eksctl.io/).

To configure kubectl to talk to the ghdsi cluster, do:

```shell
aws eks --region us-east-1 update-kubeconfig --name ghdsi
```

If you have multiple contexts in your kubeconfig, you can list them with `kubectl config get-contexts` and use the one you want with: `kubectl config use-context <context name>`.

## Kubernetes setup

Our cluster can be seen on the [AWS console](https://console.aws.amazon.com/eks/home?region=us-east-1#/clusters) but that console is pretty much useless as it shows no information on the cluster nodes.

You can also list them with `eksctl get cluster`.

The cluster was originally created with the command:

```shell
eksctl create cluster -f cluster.yaml
```

The basic deployment/pods/services configuration looks like:

```
kubectl get deployments
------------------------------------------------------
NAME            READY   UP-TO-DATE   AVAILABLE   AGE
curator-dev     1/1     1            1           357d
curator-prod    2/2     2            2           357d
data-dev        1/1     1            1           2d6h
data-prod       2/2     2            2           357d
location-dev    1/1     1            1           10d
location-prod   2/2     2            2           10d

kubectl get pods
-----------------------------------------------------------------
NAME                             READY   STATUS    RESTARTS   AGE
curator-dev-7c65fdd7bc-jkfnn     1/1     Running   0          26h
curator-prod-94ccbc565-qtmph     1/1     Running   1          26h
curator-prod-94ccbc565-v7rvs     1/1     Running   0          26h
data-dev-66676656f6-897p8        1/1     Running   0          26h
data-prod-7d479ddbbc-fdkgb       1/1     Running   0          26h
data-prod-7d479ddbbc-qq256       1/1     Running   0          26h
location-dev-5986bf6f77-f8mmb    1/1     Running   0          26h
location-prod-6d674b7b47-lxj2z   1/1     Running   0          26h
location-prod-6d674b7b47-zfgk2   1/1     Running   0          26h

kubectl get services
--------------------------------------------------------------------------------------------------------------------------------------------------
NAME                 TYPE           CLUSTER-IP       EXTERNAL-IP                                                              PORT(S)         AGE
curator-dev          ClusterIP      10.100.222.22    <none>                                                                   80/TCP          357d
curator-dev-aws-1    LoadBalancer   10.100.175.60    a1fc85431766047dda91ffcb74696fa4-156204500.us-east-1.elb.amazonaws.com   443:32233/TCP   105d
curator-prod         ClusterIP      10.100.43.67     <none>                                                                   80/TCP          357d
curator-prod-aws-1   LoadBalancer   10.100.165.255   ae37d40a64ae44960b885564ddee19cf-419585441.us-east-1.elb.amazonaws.com   443:31681/TCP   105d
data-dev             ClusterIP      10.100.204.152   <none>                                                                   80/TCP          357d
data-prod            ClusterIP      10.100.59.189    <none>                                                                   80/TCP          357d
kubernetes           ClusterIP      10.100.0.1       <none>                                                                   443/TCP         357d
location-dev         ClusterIP      10.100.234.147   <none>                                                                   80/TCP          10d
location-prod        ClusterIP      10.100.68.234    <none>                                                                   80/TCP          10d
```

We use a deployment file for the data service and for the curator service, check out `data.yaml` and `curator.yaml`.

To update the deployments, first do a dry run:

```shell
kubectl apply -f data.yaml -f curator.yaml -f location.yaml --dry-run=server
```

For more verbose output use:

```shell
kubectl apply -f data.yaml -f curator.yaml -f location.yaml --dry-run=server --output=yaml
```

Then once changes look good, use:

```shell
kubectl apply -f data.yaml -f curator.yaml -f location.yaml
```

To confirm changes occurred, use:
```shell
kubectl get pod <POD_NAME> --output=yaml
```

## Reading server logs

To read the server logs first find the pod whose logs you want to read.

```shell
kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
curator-dev-7c65fdd7bc-jkfnn     1/1     Running   0          26h
curator-prod-94ccbc565-qtmph     1/1     Running   1          26h
curator-prod-94ccbc565-v7rvs     1/1     Running   0          26h
data-dev-66676656f6-897p8        1/1     Running   0          26h
data-prod-7d479ddbbc-fdkgb       1/1     Running   0          26h
data-prod-7d479ddbbc-qq256       1/1     Running   0          26h
location-dev-5986bf6f77-f8mmb    1/1     Running   0          26h
location-prod-6d674b7b47-lxj2z   1/1     Running   0          26h
location-prod-6d674b7b47-zfgk2   1/1     Running   0          26h
```

Then call logs on the pod you want to read from.

```shell
kubectl logs data-prod-7d479ddbbc-qq256
```

## Getting access to the cluster

Ask an admin to run `kubectl edit -n kube-system configmap/aws-auth` and add the appropriate user there. Instructions can be found in the [official docs](https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html).

### Addressing

The EKS cluster has kube-dns running by default which enables pods to talk together easily.

Data and curator are exposed as kubernetes services inside the cluster (but have no external IP yet until we enable authorization on data CRUD).

You can check DNS resolution within the cluster by running:

```shell
kubectl run curl --image=radial/busyboxplus:curl -i --tty
[ root@curl:/ ]$ nslookup curator
Server:    10.100.0.10
Address 1: 10.100.0.10 kube-dns.kube-system.svc.cluster.local

Name:      curator
Address 1: 10.100.15.14 curator.default.svc.cluster.local
```

Once you're done with it, don't forget to delete the pod: `kubectl delete pod curl`.

### Secrets

Deployments require secrets to connect to MongoDB for example or set up OAuth.

Here is the list of environment variables that should be filled with secrets and their purpose:

- `AWS_SES_REGION`: Amazon Web Services region used for the Simple Email Service.
- `AWS_SES_SENDER`: Sender email address for Simple Email Service. This must be verified in the SES dashboard.
- `AWS_ACCESS_KEY_ID`: _(optional)_ Amazon Web Services Access Key ID for a service account used to talk to Lambda/Cloudwatch AWS services. You can leave this one out when developing locally and have no need to talk work with the automated ingestion pipeline. Configure this access key from the [AWS console](https://console.aws.amazon.com/).
- `AWS_SECRET_ACCESS_KEY`: _(optional)_ Amazon Web Services Secret Access Key that is shown to you only once when generating a new access key from the AWS console or CLI. This must be the secret access key correpsonding to the specified `AWS_ACCESS_KEY_ID`. You can leave this one out when developing locally and have no need to talk work with the automated ingestion pipeline. Configure this secret access key from the [AWS console](https://console.aws.amazon.com/).
- `DB_CONNECTION_STRING`: _(required)_ The Mongo DB connection string as per [official documentation](https://docs.mongodb.com/manual/reference/connection-string/). Cases, sources, users and sessions are stored in MongoDB so this is required. Configure this connection string from the [Mongo Atlas console](https://cloud.mongodb.com/v2/5ea89a90db26a511f1804cf8#security/database/users).
- `GOOGLE_OAUTH_CLIENT_ID`: _(required)_ Google OAuth20 client ID used to sign-in people in the curator web portal. Chances are you want to sign-in when working on the curator portal so this is required. This client should have the desired javascript origins and redirect URIs setup depending on where you host the curator web portal. Configure this client ID from the [Google Cloud console](https://console.cloud.google.com).
- `GOOGLE_OAUTH_CLIENT_SECRET`: _(required)_ Google OAuth20 client secret used to sign-in people in the curator web portal. Chances are you want to sign-in when working on the curator portal so this is required. Must correspond to the specified `GOOGLE_OAUTH_CLIENT_ID`. Configure this client secret from the [Google Cloud console](https://console.cloud.google.com).
- `MAPBOX_TOKEN`: _(optional)_ Mapbox private token used to perform geocoding of new cases. It must have Configure this token from the [Mapbox console](https://account.mapbox.com/auth/signin/). The mapbox account should have the [Boudaries API](https://www.mapbox.com/boundaries/) enabled to properly geocode all administrative areas.
- `REACT_APP_PUBLIC_MAPBOX_TOKEN`: This is not really a secret as it is a public mapbox token but still it is nice to have it documented here close to its private counterpart (`MAPBOX_TOKEN`) used for geocoding. As it is a public token, make sure it is restricted only to the origins where the curator portal UI is running.
- `SESSION_COOKIE_KEY`: _(optional)_ Session cookies contain IDs that are encrypted using this key.
- `REACT_APP_POLICY_PUBLIC_ID`: This is a public ID for Iubenda service that provides legal policies.
- `REACT_APP_COOKIE_CONSENT_PUBLIC_ID`: This is a public ID for Iubenda service that provides cookie consent banner.

#### Secrets in production

We are using kubernetes-managed secrets via kustomize to generate secrets and reference them in the deployment files.

When you want to generate a new secret, follow the [official instructions](https://kubernetes.io/docs/concepts/configuration/secret/) for example using a kustomization.yaml file that looks like this:

```yaml
secretGenerator:
  - name: data-dev
    literals:
      - some_secret_for_data=foo
  - name: curator-dev
    literals:
      - some_secret_for_curator=bar
      - another_secret_for_curator=baz
  - name: data-prod
    literals:
      - some_secret_for_data=foo
  - name: curator-prod
    literals:
      - some_secret_for_curator=foo
      - another_secret_for_curator=baz
```

Apply with `kubectl apply -k .`.

If you generated a new secret, you need to set it in the appropriate deployment files.

To get a list of existing secrets, you can do `kubectl get secrets`.
Note that some secrets are automatically managed in prod like let's encrypt certs for example, you shouldn't have to do anything with them.

#### How-to rotate secrets

If for some reason a secret has been compromised or if you want to perform a rotation as part of a routine exercise (thank you for doing that!) here is the procedure:

1. Identify the secret that needs to be rotated.

2. Contact [administrators](https://github.com/orgs/globaldothealth/people) that are in charge of the infrastructure and tell them to rotate a new secret.

3. Go to the web console where the secret can be rotated and rotated it, the link should be in the list of secrets above.

4. Generate a new version of the secrets in production by following the kustomize setup described above (`kubectl apply -k .`).

5. Change reference to new secret in deployment configs.

6. Apply configuration changes. (`kubectl apply -f curator.yaml -f data.yaml -f location.yaml`)

7. Verify new deployment works as intended.

8. Destroy old secrets from their respective management console if they still exist.

## Labels

We use labels to differentiate between prod and dev instances of the containers.

Curator service has the labels `app=curator` and `environment=prod|dev`.

Data service has the labels `app=data` and `environment=prod|dev`.

Services exposed contain the environment in their names to avoid mistakenly taking to a different service, for example use `http://data-dev` to talk to dev data service and `http://data-prod` to talk to the prod data service.

## Github Container Registry

Images used in deployments are pulled from the Github Container Registry where images are automatically pushed by the [curator](/.github/workflows/curator-service-package.yml) and data [workflows](/.github/workflows/curator-service-package.yml).

Check out the registries for the [curator service](https://github.com/orgs/globaldothealth/packages/container/list%2Fcuratorservice/) and [data service](https://github.com/orgs/globaldothealth/packages/container/list%2Fdataservice/).

If you add a service, the packages will be _private_ by default which will make `k8s` have "image pull" errors as it won't be able to fetch the configured images from the Github Container Registry. You have to go to the [global.health packages list](https://github.com/orgs/globaldothealth/packages), find your new package, and in its settings change its visibility from private to public. This is a one-time action for each new package.

## Releases

We follow [semantic versioning](https://semver.org/) which is basically:

```text
Given a version number MAJOR.MINOR.PATCH, increment the:

MAJOR version when you make incompatible API changes,
MINOR version when you add functionality in a backwards compatible manner, and
PATCH version when you make backwards compatible bug fixes.
```

Github workflows will automatically extract the tags from the repository and apply them to the images built (thanks to the `add_git_labels: true` param in the workflow).

To push a new release follow the [github UI flow](https://github.com/globaldothealth/list/releases/new) or do it using the command line:

Tag main with the `0.1.2` tag:

```shell
git checkout main
git tag 0.1.2
```

then push it to the repo:

`git push origin 0.1.2`

Github actions will automatically build the image, e.g. `ghcr.io/globaldothealth/list/curatorservice:0.1.2`.

This tag can then be referenced in the deployment files:
- Submit a PR to change the current image version to the new one. [Example](https://github.com/globaldothealth/list/pull/1170).
- Apply the change: `kubectl apply -f curator.yaml -f data.yaml`.

In a few seconds the push should be complete.

You can list the existing tags/versions with `git tag` or on the [github repo](https://github.com/globaldothealth/list/releases).

### `latest` image tag for dev

Dev instances of curator and data services are using the `latest` image tag. Using this tag lets kubernetes know
that the image should always be fetched when restarting the service, which can be done using the following:

```shell
kubectl rollout restart deployment/curator-dev
kubectl rollout restart deployment/data-dev
```

### Rollback

Just change the image tag referenced in the deployment file to an earlier version and apply the change with `kubectl apply`.

### Deleting a release

If for some reason you need to delete a tag, you can do it with `git tag -d 1.2.3` then `git push origin :refs/tags/0.1.2` to delete it remotely.

Note that because our packages are public, it is not possible to delete a package as github does not allow for that.

### Deprecated packages

https://github.com/globaldothealth/list/packages/253413 and https://github.com/globaldothealth/list/packages/253391 were package repositories setup before Github Container Registry was released, they are unused and because they are public they cannot be deleted so please ignore them.

## Metric server

Metric server was installed in the custer:

```shell
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/download/v0.3.6/components.yaml
```

It allows getting real-time resource usage of pods and nodes using `kubectl top node` and `kubectl top pod`.

## Ingress / Application load balancer

We use the [kubernetes-maintained nginx ingress controller](https://kubernetes.github.io/ingress-nginx/), it was installed with:

```shell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-0.32.0/deploy/static/provider/aws/deploy.yaml
```

Our ingress routes to the dev and prod curator services were installed with:

```shell
kubectl apply -f curator-ingress.yaml
kubectl apply -f curator-ingress-config-map.yaml -n ingress-nginx
```

The curator services are exposed here:

- [dev](https://dev-data.covid-19.global.health)
- [prod](https://data.covid-19.global.health)

## Kubernetes dashboard

The kubernetes dashboard has been deployed following the [official instructions](https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/), mainly:

```shell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0/aio/deploy/recommended.yaml
kubectl apply -f dashboard.yaml
```

The [dashboard.yaml](dashboard.yaml) file contains the user configuration that is needed to log into the dashboard. The user has the `read` role that gives read access to all resources (except secrets to avoid privilege escalation).

To log into the dashboard:

1. Start a proxy (the dashboard isn't exposed externally): `kubectl proxy`

2. Get the token to login as the `dashboard-reader` user by running the `display_dashboard_token.sh` script in this directory.

3. Go to the [dashboard](http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/) and copy the token into the login screen.

## HTTPS / certs management

Certificates are managed automatically by [certs manager](https://cert-manager.io).

It was installed with:

```shell
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v0.15.1/cert-manager.yaml
```

Note: Cert manager pods run in the `cert-manager` namespace.

We are using let's encrypt as an issuing authority:

```shell
kubectl apply -f letsencrypt.yaml
```

The nginx ingress is annotated with the corresponding `cert-manager.io/issuer` annotation so that certs are automatically requested for the hosts specified in the ingress config.

You can check the certs with `kubectl get|describe certificates`.
