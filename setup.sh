#!/bin/bash -
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# Setup
#
# 1. Update data sources
# 2. Run the server, with optional debug info to console
#
# E.g.,
# ./setup.sh -f ~/fabric-samples/first-network -s


_show_help() {
    printf -- "Usage: setup.sh [OPTIONS]\n\n"
    printf -- "Options:\n"
    printf -- "-s Start server\n"
    printf -- "-t Use HTTPS\n"
    printf -- "-p Specify a port to listen on\n"
    printf -- "-d Set debug info on\n"
    printf -- "-u Update data sources\n"
    printf -- "-k Update keys\n"
    printf -- "-f Fabic network dir\n"
    printf -- "-a Run as Admin, not User1\n"
    exit 12
}

if [[ -z "$1" ]]; then
    _show_help
fi

while getopts :stp:dukf:ah opt; do
    case "$opt" in
        s)    start_server=true
              ;;
        t)    use_https=true
              ;;
        p)    port="$OPTARG"
              ;;
        d)    debug=true
              ;;
        u)    update_data_sources=true
              ;;
        k)    update_keys=true
              ;;
        f)    fabric_network_dir="${OPTARG%/}"
              ;;
        a)    run_as_admin=true
              ;;
        h)    _show_help
              ;;
        '?')  printf -- "Invalid option $OPTARG. Try '-h' for help.\n" && exit 12
              ;;
    esac
done

shift $((OPTIND-1))

project_dir="$(cd "$( dirname "${BASH_SOURCE[0]}" )/../" && pwd)/fabric-sdk-rest"

# Update private key in datasources.json
if [[ -n $update_keys ]]; then
    cd "${fabric_network_dir}/crypto-config/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore"
    privatekeyUser="$(ls *_sk)"
    cd "${fabric_network_dir}/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"
    privatekeyAdmin="$(ls *_sk)"

    if [[ -n $debug ]]; then
        printf -- "Fabric network directory: ${fabric_network_dir}\n"
        printf -- "Private user key: $privatekeyUser\n"
        printf -- "Private admin key: $privatekeyAdmin\n"
    fi
fi

cd "${project_dir}/packages/fabric-rest/server"

if [[ -n $use_https ]]; then
    mkdir -p private
    cd private
    if [[ ! -f privatekey.pem ]]; then
        openssl genrsa -out privatekey.pem 1024
    fi
    if [[ ! -f certrequest.csr ]]; then
        openssl req -new -key privatekey.pem -out certrequest.csr
    fi
    if [[ ! -f certificate.pem ]]; then
        openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
    fi
    cd ..
fi

if [[ -n $update_data_sources ]]; then
    # Use ^ for sed command as / is in file paths
    if [[ -n $run_as_admin ]]; then
        sed -e "s/ADMINUSER/fabricUser/" -e "s/XXXXXXXX/${privatekeyUser}/" -e "s/ADMIN1STORE/${privatekeyAdmin}/" \
            -e "s^FABSAMPLE^${fabric_network_dir}^" < datasources.json.template > datasources.json
    else
        sed -e "s/AUSER/fabricUser/" -e "s/XXXXXXXX/${privatekeyUser}/" -e "s/ADMIN1STORE/${privatekeyAdmin}/" \
            -e "s^FABSAMPLE^${fabric_network_dir}^" < datasources.json.template > datasources.json
    fi
fi

if [[ -n $use_https ]]; then
    cliOptions="--https"
fi

if [[ -n $port ]]; then
    cliOptions="${cliOptions} --port ${port}"
fi

if [[ -n $start_server ]]; then
    cd ..
    if [[ -n $debug ]]; then
        node . ${cliOptions} --hfc-logging '{"debug":"console"}'
    else
        node . ${cliOptions}
    fi
fi
