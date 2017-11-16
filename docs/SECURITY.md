# Securing the REST Server
The REST server supports HTTPS, and a number of authentication
mechanisms.


## Enabling HTTPS
By default, the server operates over HTTP. With the supplied option
`-t` or `--tls`, however, HTTPS can be enabled. To do this, you must
first generate or provide SSL keys. The server will look for these keys in the
directory `packages/fabric-rest/server/private`. The following files
are required:

- `certificate.pem`
- `privatekey.pem`

To generate these files for testing, the following command can be
issued in the `private` directory:

```bash
openssl req -x509 -newkey rsa:4096 -keyout privatekey.pem -out certificate.pem \
-days 365 -subj "/C=US/ST=Oregon/L=Portland/O=Company Name/OU=Org/CN=www.example.com" -nodes
```

Now, start the server with `node . --tls` or `node . -t`. Note that if
you connect to the server with a web browser, to view the `/explorer`
interface for example, the browser may warn about using a self-signed
certificate. This is expected behaviour.

The `setup.sh` helper script has support for TLS too. Use `setup.sh
-t` option to use HTTPS when running the server, as well as running
the above commands to generate keys, if they don't already
exist. Attempting to start the server requesting HTTPS secure
transport while not having the correct certificates and private key
will cause the server to fail.

You can point the server to specific TLS certificate and private key
files using the `-c` and `-k` respectively.


## Authentication Mechanisms
The REST server makes use of [Passport][] authentication strategies. LDAP
is the default; other strategies can be added.


### LDAP
`server/providers.json` contains the information defining the
strategies to be used by the server. The default LDAP configuration
applies to the packaged LDAP server (an [ldapjs][] server).

To use the packaged LDAP server for authentication, run

```bash
node ./authentication.js
```

in the `test/authentication` directory. This will start the server on
port `1389` by default, with a user `alice` whose password is
`secret`.

To configure the LDAP strategy for your own LDAP server, edit the file
`server/providers.json` in the `fabric-rest` package.


### Using Other Strategies
Many other strategies are available; to use another strategy, install
the required strategy and add this to the `providers.json` file.




[Passport]: http://passportjs.org/
[ldapjs]: http://ldapjs.org/
